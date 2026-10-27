import { Response } from 'express';
import { MedicineSchedule } from '../models/MedicineSchedule';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { Medicine } from '../models/Medicine';
import { ScheduleService } from '../scheduling/scheduleService';
import { generateOccurrencesForWindow } from '../scheduling/recurrence';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';

export class ScheduleController {
  /**
   * Preview occurrences without saving (used by the Add Medicine multi-step wizard)
   */
  public static async previewOccurrences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { recurrenceType, timesOfDay, daysOfWeek, intervalDays, startDate, endDate } = req.body;
      const timeZone = req.user?.timeZone || 'Asia/Kolkata';

      const now = new Date();
      const start = startDate ? new Date(startDate) : now;
      const windowEnd = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day preview

      const occurrences = generateOccurrencesForWindow({
        recurrenceType: recurrenceType || 'daily',
        timesOfDay: timesOfDay || ['08:00'],
        daysOfWeek: daysOfWeek || [],
        intervalDays: intervalDays || 1,
        startDate: start,
        endDate: endDate ? new Date(endDate) : undefined,
        timeZone,
        windowStart: start,
        windowEnd,
      });

      res.status(200).json({ occurrences });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to preview occurrences', status: 500 } });
    }
  }

  /**
   * Retrieves today's schedule organized by time of day slots (Morning, Afternoon, Evening, Night)
   */
  public static async getTodaySchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const timeZone = req.user.timeZone || 'Asia/Kolkata';
      // If date query parameter is passed (e.g. 'YYYY-MM-DD'), use that; otherwise current local date
      const dateParam = req.query.date as string;
      const localTodayStr = dateParam || DateTime.now().setZone(timeZone).toFormat('yyyy-MM-dd');

      const occurrences = await DoseOccurrence.find({
        ownerId: req.user._id,
        localScheduledDate: localTodayStr,
        superseded: false,
      })
        .populate('medicineId')
        .populate('actionId')
        .sort({ scheduledAtUTC: 1 });

      // Group into slots
      const grouped = {
        morning: occurrences.filter((o) => o.timeOfDaySlot === 'morning'),
        afternoon: occurrences.filter((o) => o.timeOfDaySlot === 'afternoon'),
        evening: occurrences.filter((o) => o.timeOfDaySlot === 'evening'),
        night: occurrences.filter((o) => o.timeOfDaySlot === 'night'),
      };

      const totalScheduled = occurrences.length;
      const totalTaken = occurrences.filter((o) => o.state === 'taken').length;
      const totalSkipped = occurrences.filter((o) => o.state === 'skipped').length;
      const totalDue = occurrences.filter((o) => o.state === 'due' || o.state === 'snoozed').length;
      const totalUnconfirmed = occurrences.filter((o) => o.state === 'unconfirmed').length;

      res.status(200).json({
        date: localTodayStr,
        timeZone,
        stats: {
          totalScheduled,
          totalTaken,
          totalSkipped,
          totalDue,
          totalUnconfirmed,
          completionPercentage: totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0,
        },
        grouped,
        all: occurrences,
      });
    } catch (err: unknown) {
      console.error('[ScheduleController.getTodaySchedule] Error:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve today schedule', status: 500 } });
    }
  }

  /**
   * Retrieves weekly timeline occurrences
   */
  public static async getWeeklySchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const timeZone = req.user.timeZone || 'Asia/Kolkata';
      const startDateStr = req.query.startDate as string;
      const startDt = startDateStr
        ? DateTime.fromISO(startDateStr, { zone: timeZone })
        : DateTime.now().setZone(timeZone).startOf('week');

      const endDt = startDt.plus({ days: 6 }).endOf('day');

      const occurrences = await DoseOccurrence.find({
        ownerId: req.user._id,
        scheduledAtUTC: {
          $gte: startDt.toUTC().toJSDate(),
          $lte: endDt.toUTC().toJSDate(),
        },
        superseded: false,
      })
        .populate('medicineId')
        .populate('actionId')
        .sort({ scheduledAtUTC: 1 });

      res.status(200).json({
        startDate: startDt.toFormat('yyyy-MM-dd'),
        endDate: endDt.toFormat('yyyy-MM-dd'),
        occurrences,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve weekly schedule', status: 500 } });
    }
  }

  /**
   * Retrieves monthly occurrences for calendar view
   */
  public static async getMonthlySchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const timeZone = req.user.timeZone || 'Asia/Kolkata';
      const year = parseInt((req.query.year as string) || DateTime.now().year.toString(), 10);
      const month = parseInt((req.query.month as string) || DateTime.now().month.toString(), 10);

      const startOfMonth = DateTime.fromObject({ year, month, day: 1 }, { zone: timeZone }).startOf('month');
      const endOfMonth = startOfMonth.endOf('month');

      const occurrences = await DoseOccurrence.find({
        ownerId: req.user._id,
        scheduledAtUTC: {
          $gte: startOfMonth.toUTC().toJSDate(),
          $lte: endOfMonth.toUTC().toJSDate(),
        },
        superseded: false,
      })
        .populate('medicineId')
        .populate('actionId')
        .sort({ scheduledAtUTC: 1 });

      res.status(200).json({
        year,
        month,
        occurrences,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve monthly schedule', status: 500 } });
    }
  }

  /**
   * Safely updates an existing schedule with version increment and future occurrence replacement
   */
  public static async updateSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const id = req.params.id as string;
      const { recurrenceType, timesOfDay, daysOfWeek, intervalDays, startDate, endDate, changeReason } = req.body;

      const updated = await ScheduleService.updateScheduleSafely(
        id,
        {
          recurrenceType,
          timesOfDay,
          daysOfWeek,
          intervalDays,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        req.user._id,
        changeReason
      );

      res.status(200).json({
        message: 'Schedule successfully updated (future occurrences replaced, history preserved)',
        schedule: updated,
      });
    } catch (err: unknown) {
      console.error('[ScheduleController.updateSchedule] Error:', err);
      res.status(500).json({ error: { message: (err as Error).message, status: 500 } });
    }
  }
}
