import { Types } from 'mongoose';
import { Medicine, IMedicine } from '../models/Medicine';
import { MedicineSchedule, IMedicineSchedule } from '../models/MedicineSchedule';
import { ScheduleVersion } from '../models/ScheduleVersion';
import { DoseOccurrence, IDoseOccurrence } from '../models/DoseOccurrence';
import { ReminderJob } from '../models/ReminderJob';
import { generateOccurrencesForWindow, GeneratedOccurrence } from './recurrence';
import crypto from 'crypto';

export class ScheduleService {
  /**
   * Generates and persists dose occurrences for an active schedule across a rolling horizon.
   * Default window: from now (or schedule start date) up to next 14 days.
   */
  public static async generateOccurrencesForSchedule(
    schedule: IMedicineSchedule,
    medicine: IMedicine,
    windowDays: number = 14
  ): Promise<IDoseOccurrence[]> {
    if (!schedule.active || medicine.status !== 'active') {
      return [];
    }

    if (schedule.recurrenceType === 'as_needed') {
      return [];
    }

    const now = new Date();
    // Start window from schedule start date or 1 day ago (to cover today's remaining doses)
    const windowStart = schedule.startDate > now ? schedule.startDate : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    const generated = generateOccurrencesForWindow({
      recurrenceType: schedule.recurrenceType,
      timesOfDay: schedule.timesOfDay,
      daysOfWeek: schedule.daysOfWeek,
      intervalDays: schedule.intervalDays,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      timeZone: schedule.timeZone || 'Asia/Kolkata',
      windowStart,
      windowEnd,
    });

    const createdOccurrences: IDoseOccurrence[] = [];

    for (const occ of generated) {
      try {
        // Upsert by scheduleId and scheduledAtUTC to maintain idempotency
        const existing = await DoseOccurrence.findOne({
          scheduleId: schedule._id,
          scheduledAtUTC: occ.scheduledAtUTC,
        });

        if (!existing) {
          // Determine initial state: if in past and unacknowledged, 'unconfirmed'; if in near future, 'upcoming'
          const state = occ.scheduledAtUTC < now ? 'unconfirmed' : 'upcoming';

          const doc = await DoseOccurrence.create({
            ownerId: schedule.ownerId,
            medicineId: medicine._id,
            scheduleId: schedule._id,
            scheduleVersion: schedule.version,
            scheduledAtUTC: occ.scheduledAtUTC,
            localScheduledDate: occ.localScheduledDate,
            localScheduledTime: occ.localScheduledTime,
            timeOfDaySlot: occ.timeOfDaySlot,
            doseAmount: medicine.doseAmount,
            doseUnit: medicine.doseUnit,
            state,
            snoozeCount: 0,
            superseded: false,
          });

          createdOccurrences.push(doc);

          // If occurrence is due in the future or currently, schedule a reminder job
          if (occ.scheduledAtUTC >= new Date(now.getTime() - 15 * 60 * 1000)) {
            const idempotencyKey = crypto
              .createHash('sha256')
              .update(`${doc._id.toString()}-${occ.scheduledAtUTC.toISOString()}-v${schedule.version}`)
              .digest('hex');

            await ReminderJob.findOneAndUpdate(
              { idempotencyKey },
              {
                $setOnInsert: {
                  occurrenceId: doc._id,
                  ownerId: schedule.ownerId,
                  dueAtUTC: occ.scheduledAtUTC,
                  status: 'scheduled',
                  attempts: 0,
                  maxAttempts: 3,
                  idempotencyKey,
                },
              },
              { upsert: true, new: true }
            );
          }
        } else {
          createdOccurrences.push(existing);
        }
      } catch (err: unknown) {
        // Ignore duplicate key race conditions gracefully
        const mongoErr = err as { code?: number };
        if (mongoErr.code !== 11000) {
          console.error('[ScheduleService] Error saving occurrence:', err);
        }
      }
    }

    return createdOccurrences;
  }

  /**
   * Safely updates an existing schedule:
   * 1. Preserves completed historical records.
   * 2. Archives old version into ScheduleVersion.
   * 3. Invalidates superseded future unacknowledged occurrences.
   * 4. Cancels pending future reminder jobs.
   * 5. Generates replacement occurrences and jobs under the incremented version.
   */
  public static async updateScheduleSafely(
    scheduleId: string | Types.ObjectId,
    updates: Partial<IMedicineSchedule>,
    userId: Types.ObjectId,
    changeReason?: string
  ): Promise<IMedicineSchedule> {
    const existing = await MedicineSchedule.findById(scheduleId);
    if (!existing) {
      throw new Error('Schedule not found');
    }

    if (existing.ownerId.toString() !== userId.toString()) {
      throw new Error('Unauthorized schedule modification');
    }

    // 1. Archive current version snapshot
    await ScheduleVersion.create({
      medicineId: existing.medicineId,
      scheduleId: existing._id,
      ownerId: existing.ownerId,
      version: existing.version,
      snapshot: existing.toObject(),
      changeReason: changeReason || 'User updated dosing schedule',
      changedAt: new Date(),
    });

    const now = new Date();

    // 2. Mark future un-acted occurrences as superseded (never delete historical logs)
    const futureOccurrences = await DoseOccurrence.find({
      scheduleId: existing._id,
      scheduledAtUTC: { $gt: now },
      actionId: { $exists: false },
      state: { $in: ['upcoming', 'due', 'snoozed'] },
    });

    const futureOccurrenceIds = futureOccurrences.map((o) => o._id);

    if (futureOccurrenceIds.length > 0) {
      await DoseOccurrence.updateMany(
        { _id: { $in: futureOccurrenceIds } },
        { $set: { superseded: true } }
      );

      // Cancel future pending reminder jobs
      await ReminderJob.updateMany(
        {
          occurrenceId: { $in: futureOccurrenceIds },
          status: { $in: ['scheduled', 'queued'] },
        },
        { $set: { status: 'cancelled' } }
      );
    }

    // 3. Apply updates and increment version
    const nextVersion = existing.version + 1;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    Object.assign(existing, cleanUpdates);
    existing.version = nextVersion;
    await existing.save();

    // 4. Generate new occurrences under the new version
    const medicine = await Medicine.findById(existing.medicineId);
    if (medicine && medicine.status === 'active' && existing.active) {
      await this.generateOccurrencesForSchedule(existing, medicine, 14);
    }

    return existing;
  }

  /**
   * Pauses all future reminders for a medicine without altering dose history
   */
  public static async pauseMedicine(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IMedicine> {
    const medicine = await Medicine.findOne({ _id: medicineId, ownerId: userId });
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    medicine.status = 'paused';
    await medicine.save();

    await MedicineSchedule.updateMany(
      { medicineId: medicine._id },
      { $set: { active: false } }
    );

    // Cancel future pending reminder jobs
    const now = new Date();
    const futureOccs = await DoseOccurrence.find({
      medicineId: medicine._id,
      scheduledAtUTC: { $gt: now },
    });

    const futureOccIds = futureOccs.map((o) => o._id);
    if (futureOccIds.length > 0) {
      await ReminderJob.updateMany(
        {
          occurrenceId: { $in: futureOccIds },
          status: { $in: ['scheduled', 'queued'] },
        },
        { $set: { status: 'cancelled' } }
      );
    }

    return medicine;
  }

  /**
   * Resumes a paused medicine and generates future reminders
   */
  public static async resumeMedicine(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IMedicine> {
    const medicine = await Medicine.findOne({ _id: medicineId, ownerId: userId });
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    medicine.status = 'active';
    await medicine.save();

    await MedicineSchedule.updateMany(
      { medicineId: medicine._id },
      { $set: { active: true } }
    );

    const schedules = await MedicineSchedule.find({ medicineId: medicine._id, active: true });
    for (const schedule of schedules) {
      await this.generateOccurrencesForSchedule(schedule, medicine, 14);
    }

    return medicine;
  }

  /**
   * Archives a medicine permanently from active views while preserving all historical dose logs
   */
  public static async archiveMedicine(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IMedicine> {
    const medicine = await Medicine.findOne({ _id: medicineId, ownerId: userId });
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    medicine.status = 'archived';
    await medicine.save();

    await MedicineSchedule.updateMany(
      { medicineId: medicine._id },
      { $set: { active: false } }
    );

    const now = new Date();
    const futureOccs = await DoseOccurrence.find({
      medicineId: medicine._id,
      scheduledAtUTC: { $gt: now },
    });

    const futureOccIds = futureOccs.map((o) => o._id);
    if (futureOccIds.length > 0) {
      await ReminderJob.updateMany(
        {
          occurrenceId: { $in: futureOccIds },
          status: { $in: ['scheduled', 'queued'] },
        },
        { $set: { status: 'cancelled' } }
      );
    }

    return medicine;
  }
}
