import { Response } from 'express';
import { Medicine } from '../models/Medicine';
import { MedicineSchedule } from '../models/MedicineSchedule';
import { InventoryRecord } from '../models/InventoryRecord';
import { ScheduleService } from '../scheduling/scheduleService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';

export class MedicineController {
  public static async createMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const {
        name,
        genericName,
        brandName,
        formulation,
        strength,
        doseAmount,
        doseUnit,
        route,
        instructions,
        color,
        icon,
        startDate,
        endDate,
        prescriptionReference,
        notes,
        schedule: scheduleData,
        initialStock,
        lowStockThreshold,
        autoDeductOnDose,
      } = req.body;

      const medicine = await Medicine.create({
        ownerId: req.user._id,
        name,
        genericName,
        brandName,
        formulation: formulation || 'tablet',
        strength,
        doseAmount: doseAmount || 1,
        doseUnit: doseUnit || 'tablet',
        route: route || 'oral',
        instructions,
        color: color || '#10B981',
        icon: icon || 'pill',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        prescriptionReference,
        notes,
        status: 'active',
      });

      // Create schedule
      const sched = await MedicineSchedule.create({
        medicineId: medicine._id,
        ownerId: req.user._id,
        recurrenceType: scheduleData?.recurrenceType || 'daily',
        timesOfDay: scheduleData?.timesOfDay || ['08:00'],
        daysOfWeek: scheduleData?.daysOfWeek || [],
        intervalDays: scheduleData?.intervalDays || 1,
        startDate: medicine.startDate,
        endDate: medicine.endDate,
        timeZone: req.user.timeZone || 'Asia/Kolkata',
        version: 1,
        active: true,
        reminderPreferences: scheduleData?.reminderPreferences || {
          advanceReminderMinutes: 0,
          soundEnabled: true,
          allowSnooze: true,
          maxSnoozes: 3,
        },
      });

      // Create inventory tracking
      const inventory = await InventoryRecord.create({
        medicineId: medicine._id,
        ownerId: req.user._id,
        currentQuantity: initialStock !== undefined ? initialStock : 30,
        quantityUnit: (doseUnit || 'tablet') + 's',
        unitsPerDose: doseAmount || 1,
        lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 5,
        autoDeductOnDose: autoDeductOnDose !== undefined ? autoDeductOnDose : true,
      });

      // Generate upcoming occurrences and reminder jobs for the next 14 days
      await ScheduleService.generateOccurrencesForSchedule(sched, medicine, 14);

      res.status(201).json({
        message: 'Medicine and schedule successfully configured',
        medicine,
        schedule: sched,
        inventory,
      });
    } catch (err: unknown) {
      console.error('[MedicineController.createMedicine] Error:', err);
      res.status(500).json({ error: { message: 'Failed to create medicine', status: 500 } });
    }
  }

  public static async listMedicines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const status = req.query.status as string;
      const filter: Record<string, unknown> = { ownerId: req.user._id };
      if (status) {
        filter.status = status;
      } else {
        filter.status = { $ne: 'archived' }; // Default to active + paused
      }

      const medicines = await Medicine.find(filter).sort({ createdAt: -1 });

      // Attach schedule and inventory
      const result = await Promise.all(
        medicines.map(async (med) => {
          const schedule = await MedicineSchedule.findOne({ medicineId: med._id, active: true });
          const inventory = await InventoryRecord.findOne({ medicineId: med._id });
          return {
            ...med.toObject(),
            schedule,
            inventory,
          };
        })
      );

      res.status(200).json({ medicines: result });
    } catch (err: unknown) {
      console.error('[MedicineController.listMedicines] Error:', err);
      res.status(500).json({ error: { message: 'Failed to list medicines', status: 500 } });
    }
  }

  public static async getMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { id } = req.params;
      const medicine = await Medicine.findOne({ _id: id, ownerId: req.user._id });
      if (!medicine) {
        res.status(404).json({ error: { message: 'Medicine not found', status: 404 } });
        return;
      }

      const schedule = await MedicineSchedule.findOne({ medicineId: medicine._id });
      const inventory = await InventoryRecord.findOne({ medicineId: medicine._id });

      res.status(200).json({
        medicine,
        schedule,
        inventory,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve medicine', status: 500 } });
    }
  }

  public static async updateMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { id } = req.params;
      const medicine = await Medicine.findOne({ _id: id, ownerId: req.user._id });
      if (!medicine) {
        res.status(404).json({ error: { message: 'Medicine not found', status: 404 } });
        return;
      }

      // Exclude schedule or status from direct medicine update (use designated endpoints)
      const allowedUpdates = [
        'name',
        'genericName',
        'brandName',
        'formulation',
        'strength',
        'doseAmount',
        'doseUnit',
        'route',
        'instructions',
        'color',
        'icon',
        'startDate',
        'endDate',
        'prescriptionReference',
        'notes',
      ];

      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          (medicine as any)[field] = req.body[field];
        }
      }

      await medicine.save();

      res.status(200).json({ message: 'Medicine updated successfully', medicine });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to update medicine', status: 500 } });
    }
  }

  public static async pauseMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const id = req.params.id as string;
      const medicine = await ScheduleService.pauseMedicine(id, req.user._id);
      res.status(200).json({ message: 'Reminders for this medicine paused', medicine });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: (err as Error).message, status: 500 } });
    }
  }

  public static async resumeMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const id = req.params.id as string;
      const medicine = await ScheduleService.resumeMedicine(id, req.user._id);
      res.status(200).json({ message: 'Reminders resumed', medicine });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: (err as Error).message, status: 500 } });
    }
  }

  public static async archiveMedicine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const id = req.params.id as string;
      const medicine = await ScheduleService.archiveMedicine(id, req.user._id);
      res.status(200).json({ message: 'Medicine archived (history preserved)', medicine });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: (err as Error).message, status: 500 } });
    }
  }
}
