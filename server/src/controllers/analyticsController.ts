import { Response } from 'express';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { DoseAction } from '../models/DoseAction';
import { InventoryRecord } from '../models/InventoryRecord';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DateTime } from 'luxon';

export class AnalyticsController {
  public static async getDashboardSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const timeZone = req.user.timeZone || 'Asia/Kolkata';
      const now = DateTime.now().setZone(timeZone);
      const thirtyDaysAgo = now.minus({ days: 30 }).startOf('day').toJSDate();

      // Total occurrences in last 30 days
      const totalOccurrences = await DoseOccurrence.countDocuments({
        ownerId: req.user._id,
        scheduledAtUTC: { $gte: thirtyDaysAgo },
        superseded: false,
      });

      const takenCount = await DoseOccurrence.countDocuments({
        ownerId: req.user._id,
        scheduledAtUTC: { $gte: thirtyDaysAgo },
        state: 'taken',
        superseded: false,
      });

      const skippedCount = await DoseOccurrence.countDocuments({
        ownerId: req.user._id,
        scheduledAtUTC: { $gte: thirtyDaysAgo },
        state: 'skipped',
        superseded: false,
      });

      const unconfirmedCount = await DoseOccurrence.countDocuments({
        ownerId: req.user._id,
        scheduledAtUTC: { $gte: thirtyDaysAgo, $lte: now.toJSDate() },
        state: 'unconfirmed',
        superseded: false,
      });

      // Refill alerts
      const inventories = await InventoryRecord.find({ ownerId: req.user._id });
      const lowStockCount = inventories.filter((i) => i.currentQuantity <= i.lowStockThreshold).length;

      // Adherence calculation: taken / (taken + skipped + unconfirmed)
      const denominator = takenCount + skippedCount + unconfirmedCount;
      const adherenceRate = denominator > 0 ? Math.round((takenCount / denominator) * 100) : 100;

      res.status(200).json({
        disclaimer: 'These metrics reflect your self-reported actions. DOSEBLOOM does not independently measure clinical medication adherence or health outcomes.',
        adherenceRate,
        period: 'Last 30 Days',
        stats: {
          totalScheduled: totalOccurrences,
          totalTaken: takenCount,
          totalSkipped: skippedCount,
          totalUnconfirmed: unconfirmedCount,
          lowStockAlerts: lowStockCount,
        },
      });
    } catch (err: unknown) {
      console.error('[AnalyticsController.getDashboardSummary] Error:', err);
      res.status(500).json({ error: { message: 'Failed to retrieve analytics', status: 500 } });
    }
  }

  public static async getWeeklyTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const timeZone = req.user.timeZone || 'Asia/Kolkata';
      const now = DateTime.now().setZone(timeZone);
      const days = [];

      for (let i = 6; i >= 0; i--) {
        const d = now.minus({ days: i });
        const dateStr = d.toFormat('yyyy-MM-dd');
        const dayLabel = d.toFormat('ccc'); // Mon, Tue, etc.

        const occurrences = await DoseOccurrence.find({
          ownerId: req.user._id,
          localScheduledDate: dateStr,
          superseded: false,
        });

        const scheduled = occurrences.length;
        const taken = occurrences.filter((o) => o.state === 'taken').length;
        const skipped = occurrences.filter((o) => o.state === 'skipped').length;
        const unconfirmed = occurrences.filter((o) => o.state === 'unconfirmed').length;

        days.push({
          date: dateStr,
          day: dayLabel,
          scheduled,
          taken,
          skipped,
          unconfirmed,
          completionRate: scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0,
        });
      }

      res.status(200).json({ weeklyTrends: days });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve trends', status: 500 } });
    }
  }

  public static async getTimeOfDayDistribution(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const slots = ['morning', 'afternoon', 'evening', 'night'] as const;
      const distribution = await Promise.all(
        slots.map(async (slot) => {
          const total = await DoseOccurrence.countDocuments({
            ownerId: req.user!._id,
            timeOfDaySlot: slot,
            superseded: false,
          });
          const taken = await DoseOccurrence.countDocuments({
            ownerId: req.user!._id,
            timeOfDaySlot: slot,
            state: 'taken',
            superseded: false,
          });
          return {
            slot: slot.charAt(0).toUpperCase() + slot.slice(1),
            total,
            taken,
            percentage: total > 0 ? Math.round((taken / total) * 100) : 0,
          };
        })
      );

      res.status(200).json({ distribution });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to calculate time distribution', status: 500 } });
    }
  }
}
