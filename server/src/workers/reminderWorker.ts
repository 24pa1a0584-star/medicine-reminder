import { ReminderJob, IReminderJob } from '../models/ReminderJob';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { Medicine } from '../models/Medicine';
import { User } from '../models/User';
import { NotificationSender } from '../notifications/notificationSender';
import { ENV } from '../config/env';
import crypto from 'crypto';

export class ReminderWorker {
  private static workerId: string = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  private static intervalId: NodeJS.Timeout | null = null;
  private static isProcessing: boolean = false;
  private static totalProcessed: number = 0;
  private static lastRunAt: Date | null = null;

  public static getStatus() {
    return {
      workerId: this.workerId,
      running: this.intervalId !== null,
      isProcessing: this.isProcessing,
      totalProcessed: this.totalProcessed,
      lastRunAt: this.lastRunAt,
      pollIntervalMs: ENV.WORKER_POLL_INTERVAL_MS,
    };
  }

  /**
   * Starts the worker loop
   */
  public static start(pollIntervalMs: number = ENV.WORKER_POLL_INTERVAL_MS): void {
    if (this.intervalId) {
      console.log('[ReminderWorker] Worker already running.');
      return;
    }

    console.log(`[ReminderWorker] Starting worker [${this.workerId}] with interval ${pollIntervalMs}ms...`);
    this.intervalId = setInterval(() => {
      this.sweepDueReminders().catch((err) => {
        console.error('[ReminderWorker] Sweep cycle error:', err);
      });
    }, pollIntervalMs);

    // Initial immediate tick
    this.sweepDueReminders().catch((err) => {
      console.error('[ReminderWorker] Initial sweep error:', err);
    });
  }

  /**
   * Stops the worker loop gracefully
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[ReminderWorker] Stopped worker [${this.workerId}].`);
    }
  }

  /**
   * Sweeps and processes due reminder jobs atomically
   */
  public static async sweepDueReminders(): Promise<{ claimed: number; delivered: number; failed: number }> {
    if (this.isProcessing) {
      return { claimed: 0, delivered: 0, failed: 0 };
    }

    this.isProcessing = true;
    this.lastRunAt = new Date();
    let claimedCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    try {
      const batchSize = 20;

      for (let i = 0; i < batchSize; i++) {
        const now = new Date();
        const leaseExpiry = new Date(now.getTime() + 60000); // 60s lease

        // Atomic claim using findOneAndUpdate to prevent duplicate work across concurrent workers
        const job = await ReminderJob.findOneAndUpdate(
          {
            status: { $in: ['scheduled', 'queued'] },
            dueAtUTC: { $lte: now },
            $or: [
              { leaseExpiresAt: { $exists: false } },
              { leaseExpiresAt: { $lte: now } },
            ],
          },
          {
            $set: {
              status: 'sending',
              leaseExpiresAt: leaseExpiry,
              claimedByWorkerId: this.workerId,
            },
            $inc: { attempts: 1 },
          },
          { new: true }
        );

        if (!job) {
          // No more due jobs in this cycle
          break;
        }

        claimedCount++;
        this.totalProcessed++;

        // Process the claimed job
        const result = await this.processJob(job);
        if (result === 'delivered') {
          deliveredCount++;
        } else if (result === 'failed') {
          failedCount++;
        }
      }

      // Mark older unacknowledged occurrences as 'unconfirmed' (e.g. older than 4 hours)
      await this.markOverdueOccurrencesAsUnconfirmed();
    } catch (err) {
      console.error('[ReminderWorker] Fatal error in sweep loop:', err);
    } finally {
      this.isProcessing = false;
    }

    return { claimed: claimedCount, delivered: deliveredCount, failed: failedCount };
  }

  /**
   * Processes a single claimed job
   */
  private static async processJob(job: IReminderJob): Promise<'delivered' | 'failed' | 'cancelled'> {
    try {
      const occurrence = await DoseOccurrence.findById(job.occurrenceId);
      if (!occurrence || occurrence.superseded) {
        job.status = 'cancelled';
        job.lastError = 'Occurrence superseded or not found';
        await job.save();
        return 'cancelled';
      }

      // If occurrence already completed or skipped, cancel the job
      if (['taken', 'skipped'].includes(occurrence.state)) {
        job.status = 'cancelled';
        await job.save();
        return 'cancelled';
      }

      const medicine = await Medicine.findById(occurrence.medicineId);
      if (!medicine || medicine.status !== 'active') {
        job.status = 'cancelled';
        job.lastError = 'Medicine is paused or archived';
        await job.save();
        return 'cancelled';
      }

      const user = await User.findById(job.ownerId);
      if (!user || user.accountStatus !== 'active') {
        job.status = 'cancelled';
        job.lastError = 'User account suspended or inactive';
        await job.save();
        return 'cancelled';
      }

      // Catch-up policy: if the job was scheduled > 4 hours ago, do not alarm user with loud stale push
      const now = new Date();
      const hoursLate = (now.getTime() - job.dueAtUTC.getTime()) / (1000 * 60 * 60);

      if (hoursLate > 4) {
        console.warn(`[ReminderWorker] Job ${job._id} is ${hoursLate.toFixed(1)}h overdue. Marking unconfirmed without push spam.`);
        occurrence.state = 'unconfirmed';
        await occurrence.save();

        job.status = 'delivered';
        job.lastError = 'Processed during catch-up window (>4h overdue)';
        await job.save();
        return 'delivered';
      }

      // Update occurrence state to 'due'
      if (occurrence.state === 'upcoming') {
        occurrence.state = 'due';
        await occurrence.save();
      }

      // Dispatch Web Push and In-App notification
      const success = await NotificationSender.dispatchReminder(job, occurrence, medicine, user);

      if (success) {
        job.status = 'delivered';
        job.lastError = undefined;
        await job.save();
        return 'delivered';
      } else {
        // Retry handling
        if (job.attempts < job.maxAttempts) {
          job.status = 'queued';
          // Exponential backoff: 2 min, 5 min
          const backoffMinutes = job.attempts * 2;
          job.dueAtUTC = new Date(Date.now() + backoffMinutes * 60 * 1000);
          job.lastError = `Delivery attempt ${job.attempts} failed. Queued retry for ${job.dueAtUTC.toISOString()}`;
          await job.save();
        } else {
          job.status = 'failed';
          job.lastError = `Exceeded max attempts (${job.maxAttempts})`;
          await job.save();
        }
        return 'failed';
      }
    } catch (err: unknown) {
      console.error(`[ReminderWorker] Error processing job ${job._id}:`, err);
      job.status = job.attempts >= job.maxAttempts ? 'failed' : 'queued';
      job.lastError = (err as Error).message || 'Unknown processing error';
      await job.save();
      return 'failed';
    }
  }

  /**
   * Marks occurrences older than 4 hours with state 'due' as 'unconfirmed'
   */
  private static async markOverdueOccurrencesAsUnconfirmed(): Promise<void> {
    const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1000);
    await DoseOccurrence.updateMany(
      {
        state: 'due',
        scheduledAtUTC: { $lt: cutoff },
        actionId: { $exists: false },
        superseded: false,
      },
      {
        $set: { state: 'unconfirmed' },
      }
    );
  }
}
