import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/summary', AnalyticsController.getDashboardSummary);
router.get('/trends', AnalyticsController.getWeeklyTrends);
router.get('/time-distribution', AnalyticsController.getTimeOfDayDistribution);

export default router;
