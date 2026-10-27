import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { pushSubscriptionSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/vapid-public-key', NotificationController.getVapidPublicKey);
router.post('/subscribe', validate(pushSubscriptionSchema), NotificationController.subscribe);
router.post('/unsubscribe', NotificationController.unsubscribe);
router.get('/devices', NotificationController.listDevices);
router.post('/test', NotificationController.sendTestNotification);
router.get('/logs', NotificationController.getDeliveryLogs);
router.post('/demo-sweep', NotificationController.triggerDemoSweep);

export default router;
