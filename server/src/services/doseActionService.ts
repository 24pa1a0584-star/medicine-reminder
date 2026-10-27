import { Types } from 'mongoose';
import { DoseOccurrence, IDoseOccurrence } from '../models/DoseOccurrence';
import { DoseAction, IDoseAction, DoseActionType } from '../models/DoseAction';
import { ReminderJob } from '../models/ReminderJob';
import { InventoryService } from './inventoryService';
import crypto from 'crypto';

export class DoseActionService {
  /**
   * Explicitly records that the user has taken the scheduled dose
   */
  public static async markTaken(
    occurrenceId: string | Types.ObjectId,
    userId: Types.ObjectId,
    options?: {
      reportedTakenAt?: Date;
      sourceDevice?: string;
      notes?: string;
    }
  ): Promise<{ occurrence: IDoseOccurrence; action: IDoseAction }> {
    const occurrence = await DoseOccurrence.findById(occurrenceId);
    if (!occurrence) {
      throw new Error('Dose occurrence not found');
    }

    if (occurrence.ownerId.toString() !== userId.toString()) {
      throw new Error('Unauthorized action on this dose');
    }

    // Idempotency: if already marked taken, return existing record
    if (occurrence.state === 'taken' && occurrence.actionId) {
      const existingAction = await DoseAction.findById(occurrence.actionId);
      if (existingAction) {
        return { occurrence, action: existingAction };
      }
    }

    const previousState = occurrence.state;
    occurrence.state = 'taken';

    const reportedTakenAt = options?.reportedTakenAt || new Date();
    const action = await DoseAction.create({
      occurrenceId: occurrence._id,
      medicineId: occurrence.medicineId,
      ownerId: userId,
      actionType: 'taken',
      recordedAtUTC: new Date(),
      reportedTakenAtUTC: reportedTakenAt,
      sourceDevice: options?.sourceDevice || 'web',
      notes: options?.notes,
      previousState,
    });

    occurrence.actionId = action._id;
    await occurrence.save();

    // Cancel pending reminder jobs
    await ReminderJob.updateMany(
      { occurrenceId: occurrence._id, status: { $in: ['scheduled', 'queued', 'sending'] } },
      { $set: { status: 'cancelled' } }
    );

    // Deduct stock if user configured automatic inventory tracking
    await InventoryService.deductDoseIfEnabled(
      occurrence.medicineId,
      userId,
      occurrence.doseAmount,
      occurrence._id
    );

    return { occurrence, action };
  }

  /**
   * Explicitly records that the user deliberately skipped the scheduled dose
   */
  public static async markSkipped(
    occurrenceId: string | Types.ObjectId,
    userId: Types.ObjectId,
    options?: {
      sourceDevice?: string;
      notes?: string;
    }
  ): Promise<{ occurrence: IDoseOccurrence; action: IDoseAction }> {
    const occurrence = await DoseOccurrence.findById(occurrenceId);
    if (!occurrence) {
      throw new Error('Dose occurrence not found');
    }

    if (occurrence.ownerId.toString() !== userId.toString()) {
      throw new Error('Unauthorized action on this dose');
    }

    const previousState = occurrence.state;
    occurrence.state = 'skipped';

    const action = await DoseAction.create({
      occurrenceId: occurrence._id,
      medicineId: occurrence.medicineId,
      ownerId: userId,
      actionType: 'skipped',
      recordedAtUTC: new Date(),
      sourceDevice: options?.sourceDevice || 'web',
      notes: options?.notes,
      previousState,
    });

    occurrence.actionId = action._id;
    await occurrence.save();

    // Cancel pending reminder jobs
    await ReminderJob.updateMany(
      { occurrenceId: occurrence._id, status: { $in: ['scheduled', 'queued', 'sending'] } },
      { $set: { status: 'cancelled' } }
    );

    return { occurrence, action };
  }

  /**
   * Snoozes a reminder for a user-specified short interval (e.g., 15 minutes)
   * Does NOT alter the underlying prescription schedule!
   */
  public static async snoozeReminder(
    occurrenceId: string | Types.ObjectId,
    userId: Types.ObjectId,
    snoozeMinutes: number = 15
  ): Promise<IDoseOccurrence> {
    const occurrence = await DoseOccurrence.findById(occurrenceId);
    if (!occurrence) {
      throw new Error('Dose occurrence not found');
    }

    if (occurrence.ownerId.toString() !== userId.toString()) {
      throw new Error('Unauthorized action on this dose');
    }

    if (occurrence.state === 'taken') {
      throw new Error('Cannot snooze a dose that has already been taken');
    }

    const maxSnoozes = 5;
    if (occurrence.snoozeCount >= maxSnoozes) {
      throw new Error(`Maximum snooze limit (${maxSnoozes}) reached for this occurrence`);
    }

    const now = new Date();
    const snoozedUntil = new Date(now.getTime() + snoozeMinutes * 60 * 1000);

    occurrence.state = 'snoozed';
    occurrence.snoozedUntilUTC = snoozedUntil;
    occurrence.snoozeCount += 1;
    await occurrence.save();

    // Schedule new reminder job for the snoozed timestamp
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${occurrence._id.toString()}-snooze-${occurrence.snoozeCount}-${snoozedUntil.toISOString()}`)
      .digest('hex');

    await ReminderJob.create({
      occurrenceId: occurrence._id,
      ownerId: userId,
      dueAtUTC: snoozedUntil,
      status: 'scheduled',
      attempts: 0,
      maxAttempts: 3,
      idempotencyKey,
    });

    return occurrence;
  }

  /**
   * Corrects a previously logged dose action (e.g. from Skipped to Taken) with full audit history
   */
  public static async correctDoseAction(
    actionId: string | Types.ObjectId,
    userId: Types.ObjectId,
    newActionType: DoseActionType,
    reason: string
  ): Promise<{ action: IDoseAction; occurrence: IDoseOccurrence }> {
    const action = await DoseAction.findById(actionId);
    if (!action || action.ownerId.toString() !== userId.toString()) {
      throw new Error('Dose action record not found or unauthorized');
    }

    const occurrence = await DoseOccurrence.findById(action.occurrenceId);
    if (!occurrence) {
      throw new Error('Associated dose occurrence not found');
    }

    const previousAction = action.actionType;
    action.correctionAudit.push({
      correctedAt: new Date(),
      previousAction,
      newAction: newActionType,
      reason,
      sourceDevice: 'web',
    });

    action.actionType = newActionType;
    await action.save();

    occurrence.state = newActionType === 'taken' ? 'taken' : 'skipped';
    await occurrence.save();

    return { action, occurrence };
  }
}
