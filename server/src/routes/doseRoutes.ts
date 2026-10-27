import { Router } from 'express';
import { DoseController } from '../controllers/doseController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { doseActionSchema, snoozeSchema, correctDoseActionSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/:occurrenceId/take', validate(doseActionSchema), DoseController.markTaken);
router.post('/:occurrenceId/skip', validate(doseActionSchema), DoseController.markSkipped);
router.post('/:occurrenceId/snooze', validate(snoozeSchema), DoseController.snooze);
router.put('/actions/:actionId/correct', validate(correctDoseActionSchema), DoseController.correctDose);
router.get('/history', DoseController.getHistory);

export default router;
