import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { refillSchema, adjustStockSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.getInventory);
router.get('/low-stock', InventoryController.getLowStockAlerts);
router.get('/transactions', InventoryController.getTransactions);
router.post('/:medicineId/refill', validate(refillSchema), InventoryController.recordRefill);
router.post('/:medicineId/adjust', validate(adjustStockSchema), InventoryController.adjustStock);

export default router;
