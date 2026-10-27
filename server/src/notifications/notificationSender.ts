import webPush from '../config/webpush';
import { PushSubscription, IPushSubscription } from '../models/PushSubscription';
import { NotificationDelivery } from '../models/NotificationDelivery';
import { User, IUser } from '../models/User';
import { Medicine, IMedicine } from '../models/Medicine';
import { DoseOccurrence, IDoseOccurrence } from '../models/DoseOccurrence';
import { ReminderJob, IReminderJob } from '../models/ReminderJob';
import { Types } from 'mongoose';

export interface PushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  data: {
    occurrenceId: string;
    medicineId: string;
    scheduledAt: string;
    url: string;
    actions?: Array<{ action: string; title: string }>;
  };
}

export class NotificationSender {
  /**
   * Dispatches push and in-app reminder notifications for a due reminder job
   */
  public static async dispatchReminder(
    job: IReminderJob,
    occurrence: IDoseOccurrence,
    medicine: IMedicine,
    user: IUser
  ): Promise<boolean> {
    const lockScreenPrivacy = user.notificationPreferences?.lockScreenPrivacy ?? true;

    // Build privacy-conscious payload
    const title = lockScreenPrivacy
      ? 'DOSEBLOOM — Scheduled Reminder'
      : `DOSEBLOOM — Time for ${medicine.name}`;

    const body = lockScreenPrivacy
      ? 'You have a scheduled medicine reminder due now.'
      : `Dose: ${medicine.doseAmount} ${medicine.doseUnit} (${medicine.strength})${
          medicine.instructions ? ` • ${medicine.instructions}` : ''
        }`;

    const payload: PushPayload = {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `dosebloom-${occurrence._id.toString()}`,
      data: {
        occurrenceId: occurrence._id.toString(),
        medicineId: medicine._id.toString(),
        scheduledAt: occurrence.scheduledAtUTC.toISOString(),
        url: `/dashboard?due=${occurrence._id.toString()}`,
        actions: [
          { action: 'take', title: 'Mark Taken' },
          { action: 'snooze', title: 'Remind Later' },
        ],
      },
    };

    const payloadString = JSON.stringify(payload);

    // Find all active subscriptions for the user
    const subscriptions = await PushSubscription.find({
      ownerId: user._id,
      active: true,
    });

    let anySuccess = false;

    // Record In-App notification delivery
    await NotificationDelivery.create({
      jobId: job._id,
      occurrenceId: occurrence._id,
      ownerId: user._id,
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date(),
    });

    if (subscriptions.length === 0) {
      console.log(`[NotificationSender] User ${user.email} has no registered push subscriptions. In-app notification recorded.`);
      return true; // Still marked as delivered in-app
    }

    for (const sub of subscriptions) {
      try {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        const result = await webPush.sendNotification(pushConfig, payloadString, {
          TTL: 3600, // 1 hour TTL
          urgency: 'high',
        });

        sub.lastUsedAt = new Date();
        await sub.save();

        await NotificationDelivery.create({
          jobId: job._id,
          occurrenceId: occurrence._id,
          ownerId: user._id,
          subscriptionId: sub._id,
          channel: 'push',
          status: 'sent',
          responseStatusCode: result.statusCode,
          sentAt: new Date(),
        });

        anySuccess = true;
      } catch (err: unknown) {
        const webPushErr = err as { statusCode?: number; message?: string };
        const statusCode = webPushErr.statusCode;

        console.warn(`[NotificationSender] Push to device ${sub.deviceIdentifier} returned status ${statusCode}: ${webPushErr.message}`);

        // Clean up invalid or expired subscriptions (404 Not Found, 410 Gone)
        if (statusCode === 404 || statusCode === 410) {
          sub.active = false;
          await sub.save();
          console.log(`[NotificationSender] Deactivated expired push subscription: ${sub._id}`);

          await NotificationDelivery.create({
            jobId: job._id,
            occurrenceId: occurrence._id,
            ownerId: user._id,
            subscriptionId: sub._id,
            channel: 'push',
            status: 'invalid_sub',
            responseStatusCode: statusCode,
            errorMessage: 'Subscription expired or unregistered by browser/OS',
            sentAt: new Date(),
          });
        } else {
          await NotificationDelivery.create({
            jobId: job._id,
            occurrenceId: occurrence._id,
            ownerId: user._id,
            subscriptionId: sub._id,
            channel: 'push',
            status: 'failed',
            responseStatusCode: statusCode,
            errorMessage: webPushErr.message || 'Unknown push delivery failure',
            sentAt: new Date(),
          });
        }
      }
    }

    return anySuccess || subscriptions.length === 0;
  }

  /**
   * Sends an immediate test notification to verify browser permissions and VAPID connection
   */
  public static async sendTestNotification(
    userId: Types.ObjectId,
    deviceIdentifier?: string
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await PushSubscription.find({
      ownerId: userId,
      active: true,
      ...(deviceIdentifier ? { deviceIdentifier } : {}),
    });

    const testPayload = JSON.stringify({
      title: 'DOSEBLOOM — Test Notification',
      body: 'Your device is successfully linked to receive scheduled medication reminders!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'dosebloom-test-notification',
      data: {
        url: '/dashboard',
      },
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          testPayload
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const pushErr = err as { statusCode?: number };
        if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
          sub.active = false;
          await sub.save();
        }
      }
    }

    return { sent, failed };
  }
}
