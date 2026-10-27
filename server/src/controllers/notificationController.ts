import { Response } from 'express';
import { PushSubscription } from '../models/PushSubscription';
import { NotificationDelivery } from '../models/NotificationDelivery';
import { NotificationSender } from '../notifications/notificationSender';
import { ReminderWorker } from '../workers/reminderWorker';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class NotificationController {
  public static async getVapidPublicKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      publicKey: ENV.VAPID_PUBLIC_KEY,
    });
  }

  public static async subscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { endpoint, keys, deviceIdentifier } = req.body;
      const userAgent = req.get('User-Agent') || 'Unknown';

      const subscription = await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          $set: {
            ownerId: req.user._id,
            keys,
            deviceIdentifier: deviceIdentifier || 'Web Browser',
            userAgent,
            active: true,
            lastUsedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      // Ensure user preference browserPush is set to true
      req.user.notificationPreferences.browserPush = true;
      await req.user.save();

      res.status(201).json({
        message: 'Push subscription registered successfully',
        subscriptionId: subscription._id,
      });
    } catch (err: unknown) {
      console.error('[NotificationController.subscribe] Error:', err);
      res.status(500).json({ error: { message: 'Failed to register subscription', status: 500 } });
    }
  }

  public static async unsubscribe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { endpoint } = req.body;
      await PushSubscription.findOneAndUpdate(
        { endpoint, ownerId: req.user._id },
        { $set: { active: false } }
      );

      res.status(200).json({ message: 'Push subscription deactivated' });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to unsubscribe', status: 500 } });
    }
  }

  public static async listDevices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const devices = await PushSubscription.find({
        ownerId: req.user._id,
        active: true,
      }).select('deviceIdentifier lastUsedAt createdAt');

      res.status(200).json({ devices });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to list devices', status: 500 } });
    }
  }

  public static async sendTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const result = await NotificationSender.sendTestNotification(req.user._id);

      res.status(200).json({
        message: 'Test notification dispatched',
        result,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to send test notification', status: 500 } });
    }
  }

  public static async getDeliveryLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const logs = await NotificationDelivery.find({ ownerId: req.user._id })
        .populate('occurrenceId', 'localScheduledDate localScheduledTime timeOfDaySlot')
        .sort({ sentAt: -1 })
        .limit(20);

      res.status(200).json({ logs });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve delivery logs', status: 500 } });
    }
  }

  /**
   * Academic Demonstration Mode trigger:
   * Immediately sweeps and dispatches due reminders on demand
   */
  public static async triggerDemoSweep(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const sweepResult = await ReminderWorker.sweepDueReminders();
      res.status(200).json({
        message: 'Academic demo scheduler sweep executed',
        sweepResult,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to execute demo sweep', status: 500 } });
    }
  }
}
