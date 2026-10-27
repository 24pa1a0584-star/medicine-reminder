import webPush from 'web-push';
import { ENV } from './env';

// Configure Web Push with VAPID details
if (ENV.VAPID_PUBLIC_KEY && ENV.VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(
      ENV.VAPID_SUBJECT,
      ENV.VAPID_PUBLIC_KEY,
      ENV.VAPID_PRIVATE_KEY
    );
    console.log('[WebPush] VAPID details configured successfully.');
  } catch (err) {
    console.error('[WebPush] Failed to set VAPID details:', err);
  }
} else {
  console.warn('[WebPush] VAPID keys are missing. Push notifications will operate in demo fallback mode.');
}

export default webPush;
