import { Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { InventoryRecord } from '../models/InventoryRecord';
import { RefillTransaction } from '../models/RefillTransaction';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class InventoryController {
  public static async getInventory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const medicineId = req.query.medicineId as string;
      if (medicineId) {
        const inventory = await InventoryService.getOrCreateInventory(medicineId, req.user._id);
        res.status(200).json({ inventory });
        return;
      }

      const inventories = await InventoryRecord.find({ ownerId: req.user._id })
        .populate('medicineId', 'name formulation strength doseAmount doseUnit color icon status')
        .sort({ currentQuantity: 1 });

      res.status(200).json({ inventories });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve inventory', status: 500 } });
    }
  }

  public static async recordRefill(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const medicineId = req.params.medicineId as string;
      const { addedQuantity, note } = req.body;

      const result = await InventoryService.recordRefill(
        medicineId,
        req.user._id,
        addedQuantity,
        note
      );

      res.status(200).json({
        message: 'Refill recorded successfully',
        inventory: result.inventory,
        transaction: result.transaction,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const medicineId = req.params.medicineId as string;
      const { newQuantity, reason } = req.body;

      const result = await InventoryService.adjustStock(
        medicineId,
        req.user._id,
        newQuantity,
        reason
      );

      res.status(200).json({
        message: 'Stock adjusted successfully',
        inventory: result.inventory,
        transaction: result.transaction,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const medicineId = req.query.medicineId as string;
      const filter: Record<string, unknown> = { ownerId: req.user._id };
      if (medicineId) filter.medicineId = medicineId;

      const transactions = await RefillTransaction.find(filter)
        .populate('medicineId', 'name color icon')
        .sort({ recordedAt: -1 })
        .limit(50);

      res.status(200).json({ transactions });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve refill history', status: 500 } });
    }
  }

  public static async getLowStockAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const alerts = await InventoryService.getLowStockAlerts(req.user._id);
      res.status(200).json({ alerts });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve low stock alerts', status: 500 } });
    }
  }
}
