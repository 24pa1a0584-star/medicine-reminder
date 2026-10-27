import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/health', AdminController.getSystemHealth);
router.get('/metrics', AdminController.getAggregateMetrics);
router.get('/audit-logs', AdminController.getAuditLogs);
router.post('/worker/sweep', AdminController.triggerWorkerSweep);

export default router;
