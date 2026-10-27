import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { updateScheduleSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/preview', ScheduleController.previewOccurrences);
router.get('/today', ScheduleController.getTodaySchedule);
router.get('/weekly', ScheduleController.getWeeklySchedule);
router.get('/monthly', ScheduleController.getMonthlySchedule);
router.put('/:id', validate(updateScheduleSchema), ScheduleController.updateSchedule);

export default router;
