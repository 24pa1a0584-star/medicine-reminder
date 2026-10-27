import { Types } from 'mongoose';
import { InventoryRecord, IInventoryRecord } from '../models/InventoryRecord';
import { RefillTransaction, IRefillTransaction } from '../models/RefillTransaction';
import { Medicine } from '../models/Medicine';

export class InventoryService {
  /**
   * Retrieves or initializes inventory tracking for a medicine
   */
  public static async getOrCreateInventory(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IInventoryRecord> {
    let record = await InventoryRecord.findOne({ medicineId, ownerId: userId });

    if (!record) {
      const medicine = await Medicine.findOne({ _id: medicineId, ownerId: userId });
      if (!medicine) {
        throw new Error('Medicine not found');
      }

      record = await InventoryRecord.create({
        medicineId,
        ownerId: userId,
        currentQuantity: 30, // Default 30 units
        quantityUnit: medicine.doseUnit + 's',
        unitsPerDose: medicine.doseAmount,
        lowStockThreshold: 5,
        autoDeductOnDose: true,
      });
    }

    return record;
  }

  /**
   * Logs a refill addition to the inventory
   */
  public static async recordRefill(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId,
    addedQuantity: number,
    note?: string
  ): Promise<{ inventory: IInventoryRecord; transaction: IRefillTransaction }> {
    if (addedQuantity <= 0) {
      throw new Error('Refill quantity must be greater than zero');
    }

    const inventory = await this.getOrCreateInventory(medicineId, userId);
    inventory.currentQuantity += addedQuantity;
    inventory.lastRefillDate = new Date();
    if (note) inventory.pharmacyNote = note;
    await inventory.save();

    const transaction = await RefillTransaction.create({
      medicineId,
      ownerId: userId,
      transactionType: 'refill',
      quantityChange: addedQuantity,
      remainingQuantity: inventory.currentQuantity,
      note: note || `Added ${addedQuantity} ${inventory.quantityUnit}`,
      recordedAt: new Date(),
    });

    return { inventory, transaction };
  }

  /**
   * Deducts quantity when a dose is explicitly confirmed taken
   */
  public static async deductDoseIfEnabled(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId,
    doseAmount: number,
    occurrenceId: Types.ObjectId
  ): Promise<IInventoryRecord | null> {
    const inventory = await InventoryRecord.findOne({ medicineId, ownerId: userId });
    if (!inventory || !inventory.autoDeductOnDose) {
      return null;
    }

    const unitsToDeduct = doseAmount || inventory.unitsPerDose || 1;
    const newQty = Math.max(0, inventory.currentQuantity - unitsToDeduct);
    inventory.currentQuantity = newQty;
    await inventory.save();

    await RefillTransaction.create({
      medicineId,
      ownerId: userId,
      transactionType: 'dose_deduction',
      quantityChange: -unitsToDeduct,
      remainingQuantity: newQty,
      note: `Automatic deduction for confirmed dose (${occurrenceId})`,
      recordedAt: new Date(),
    });

    return inventory;
  }

  /**
   * Manual inventory count adjustment / reconciliation
   */
  public static async adjustStock(
    medicineId: string | Types.ObjectId,
    userId: Types.ObjectId,
    newQuantity: number,
    reason?: string
  ): Promise<{ inventory: IInventoryRecord; transaction: IRefillTransaction }> {
    if (newQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    const inventory = await this.getOrCreateInventory(medicineId, userId);
    const diff = newQuantity - inventory.currentQuantity;
    inventory.currentQuantity = newQuantity;
    await inventory.save();

    const transaction = await RefillTransaction.create({
      medicineId,
      ownerId: userId,
      transactionType: 'manual_adjustment',
      quantityChange: diff,
      remainingQuantity: newQuantity,
      note: reason || `Manual reconciliation to ${newQuantity}`,
      recordedAt: new Date(),
    });

    return { inventory, transaction };
  }

  /**
   * Retrieves all medicines running low on stock for a user
   */
  public static async getLowStockAlerts(userId: Types.ObjectId): Promise<Array<{
    medicine: any;
    inventory: IInventoryRecord;
    isLow: boolean;
  }>> {
    const inventories = await InventoryRecord.find({ ownerId: userId }).populate('medicineId');

    return inventories
      .filter((inv) => inv.medicineId && (inv.medicineId as any).status === 'active')
      .map((inv) => ({
        medicine: inv.medicineId,
        inventory: inv,
        isLow: inv.currentQuantity <= inv.lowStockThreshold,
      }));
  }
}
