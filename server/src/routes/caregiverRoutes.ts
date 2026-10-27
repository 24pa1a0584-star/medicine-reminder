import { Router } from 'express';
import { CaregiverController } from '../controllers/caregiverController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { caregiverInviteSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/invite', validate(caregiverInviteSchema), CaregiverController.sendInvitation);
router.get('/sent-invitations', CaregiverController.listSentInvitations);
router.post('/accept', CaregiverController.acceptInvitation);
router.get('/my-caregivers', CaregiverController.listCaregivers);
router.get('/loved-ones', CaregiverController.listLovedOnes);
router.get('/loved-ones/:lovedOneId/schedule', CaregiverController.getLovedOneSchedule);
router.delete('/caregivers/:caregiverUserId', CaregiverController.revokeAccess);

export default router;
