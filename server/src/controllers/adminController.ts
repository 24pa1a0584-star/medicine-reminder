import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Medicine } from '../models/Medicine';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { NotificationDelivery } from '../models/NotificationDelivery';
import { ReminderJob } from '../models/ReminderJob';
import { PushSubscription } from '../models/PushSubscription';
import { AuditLog } from '../models/AuditLog';
import { ReminderWorker } from '../workers/reminderWorker';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AdminController {
  public static async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      database: {
        status: mongoStatus,
        name: mongoose.connection.name,
      },
      worker: ReminderWorker.getStatus(),
      memory: {
        rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      },
    });
  }

  public static async getAggregateMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        totalActiveMedicines,
        totalDoseOccurrences,
        totalDeliveries,
        activeSubscriptions,
        pendingJobs,
      ] = await Promise.all([
        User.countDocuments({ accountStatus: 'active' }),
        Medicine.countDocuments({ status: 'active' }),
        DoseOccurrence.countDocuments({ superseded: false }),
        NotificationDelivery.countDocuments(),
        PushSubscription.countDocuments({ active: true }),
        ReminderJob.countDocuments({ status: { $in: ['scheduled', 'queued'] } }),
      ]);

      const successfulDeliveries = await NotificationDelivery.countDocuments({ status: 'sent' });
      const failedDeliveries = await NotificationDelivery.countDocuments({ status: { $in: ['failed', 'invalid_sub'] } });

      res.status(200).json({
        disclaimer: 'Aggregate system metrics. Individual medication records are protected from administrative browsing.',
        metrics: {
          totalUsers,
          totalActiveMedicines,
          totalDoseOccurrences,
          totalDeliveries,
          successfulDeliveries,
          failedDeliveries,
          activeSubscriptions,
          pendingJobs,
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve metrics', status: 500 } });
    }
  }

  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '30', 10);
      const skip = (page - 1) * limit;

      const total = await AuditLog.countDocuments();
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve audit logs', status: 500 } });
    }
  }

  public static async triggerWorkerSweep(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sweepResult = await ReminderWorker.sweepDueReminders();
      res.status(200).json({
        message: 'Admin manual sweep executed',
        sweepResult,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Manual sweep failed', status: 500 } });
    }
  }
}
