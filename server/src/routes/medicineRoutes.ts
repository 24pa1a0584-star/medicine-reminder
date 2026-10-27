import { Router } from 'express';
import { MedicineController } from '../controllers/medicineController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createMedicineSchema, updateMedicineSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/', validate(createMedicineSchema), MedicineController.createMedicine);
router.get('/', MedicineController.listMedicines);
router.get('/:id', MedicineController.getMedicine);
router.put('/:id', validate(updateMedicineSchema), MedicineController.updateMedicine);
router.post('/:id/pause', MedicineController.pauseMedicine);
router.post('/:id/resume', MedicineController.resumeMedicine);
router.post('/:id/archive', MedicineController.archiveMedicine);

export default router;
