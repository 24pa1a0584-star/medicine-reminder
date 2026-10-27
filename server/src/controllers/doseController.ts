import { Response } from 'express';
import { DoseActionService } from '../services/doseActionService';
import { DoseAction } from '../models/DoseAction';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class DoseController {
  public static async markTaken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const occurrenceId = req.params.occurrenceId as string;
      const { reportedTakenAt, notes, sourceDevice } = req.body;

      const result = await DoseActionService.markTaken(occurrenceId, req.user._id, {
        reportedTakenAt: reportedTakenAt ? new Date(reportedTakenAt) : new Date(),
        notes,
        sourceDevice: sourceDevice || 'web',
      });

      res.status(200).json({
        message: 'Dose marked as taken',
        occurrence: result.occurrence,
        action: result.action,
      });
    } catch (err: unknown) {
      console.error('[DoseController.markTaken] Error:', err);
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async markSkipped(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const occurrenceId = req.params.occurrenceId as string;
      const { notes, sourceDevice } = req.body;

      const result = await DoseActionService.markSkipped(occurrenceId, req.user._id, {
        notes,
        sourceDevice: sourceDevice || 'web',
      });

      res.status(200).json({
        message: 'Dose marked as skipped',
        occurrence: result.occurrence,
        action: result.action,
      });
    } catch (err: unknown) {
      console.error('[DoseController.markSkipped] Error:', err);
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async snooze(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const occurrenceId = req.params.occurrenceId as string;
      const { snoozeMinutes } = req.body;

      const occurrence = await DoseActionService.snoozeReminder(
        occurrenceId,
        req.user._id,
        snoozeMinutes || 15
      );

      res.status(200).json({
        message: `Reminder snoozed for ${snoozeMinutes || 15} minutes`,
        occurrence,
      });
    } catch (err: unknown) {
      console.error('[DoseController.snooze] Error:', err);
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async correctDose(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const actionId = req.params.actionId as string;
      const { newActionType, reason } = req.body;

      const result = await DoseActionService.correctDoseAction(
        actionId,
        req.user._id,
        newActionType,
        reason
      );

      res.status(200).json({
        message: 'Dose action corrected with audit record',
        action: result.action,
        occurrence: result.occurrence,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '30', 10);
      const medicineId = req.query.medicineId as string;
      const actionType = req.query.actionType as string;

      const filter: Record<string, unknown> = { ownerId: req.user._id };
      if (medicineId) filter.medicineId = medicineId;
      if (actionType) filter.actionType = actionType;

      const skip = (page - 1) * limit;

      const total = await DoseAction.countDocuments(filter);
      const actions = await DoseAction.find(filter)
        .populate('medicineId', 'name formulation strength doseAmount doseUnit color icon')
        .populate('occurrenceId', 'scheduledAtUTC localScheduledDate localScheduledTime timeOfDaySlot')
        .sort({ recordedAtUTC: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        actions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve history', status: 500 } });
    }
  }
}
