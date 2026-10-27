import { DateTime } from 'luxon';
import { RecurrenceType } from '../models/MedicineSchedule';
import { TimeOfDaySlot } from '../models/DoseOccurrence';

export interface GeneratedOccurrence {
  scheduledAtUTC: Date;
  localScheduledDate: string; // 'YYYY-MM-DD'
  localScheduledTime: string; // 'HH:mm'
  timeOfDaySlot: TimeOfDaySlot;
}

/**
 * Categorizes an HH:mm local time into a human-friendly slot
 */
export function getTimeOfDaySlot(hour: number): TimeOfDaySlot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export interface RecurrenceParams {
  recurrenceType: RecurrenceType;
  timesOfDay: string[]; // e.g. ['08:00', '20:00']
  daysOfWeek?: number[]; // [0, 2, 4] for Sun, Tue, Thu
  intervalDays?: number; // e.g. 2 for every 2 days
  startDate: Date;
  endDate?: Date;
  timeZone: string; // e.g. 'Asia/Kolkata'
  windowStart: Date;
  windowEnd: Date;
}

/**
 * Pure, deterministic calculation of dose occurrences in a given time window.
 * Strictly respects timezone boundaries and daylight saving shifts.
 */
export function generateOccurrencesForWindow(params: RecurrenceParams): GeneratedOccurrence[] {
  const {
    recurrenceType,
    timesOfDay,
    daysOfWeek = [],
    intervalDays = 1,
    startDate,
    endDate,
    timeZone,
    windowStart,
    windowEnd,
  } = params;

  if (recurrenceType === 'as_needed') {
    return []; // As-needed medicines do not generate fixed recurring timeline occurrences
  }

  const occurrences: GeneratedOccurrence[] = [];
  const startDt = DateTime.fromJSDate(startDate, { zone: timeZone }).startOf('day');
  const endDt = endDate ? DateTime.fromJSDate(endDate, { zone: timeZone }).endOf('day') : null;
  const winStartDt = DateTime.fromJSDate(windowStart, { zone: timeZone }).startOf('day');
  const winEndDt = DateTime.fromJSDate(windowEnd, { zone: timeZone }).endOf('day');

  // Effective calculation start is max(startDate, windowStart)
  let currentDay = winStartDt < startDt ? startDt : winStartDt;
  const effectiveEnd = endDt && endDt < winEndDt ? endDt : winEndDt;

  while (currentDay <= effectiveEnd) {
    let dayQualifies = false;

    if (recurrenceType === 'daily') {
      dayQualifies = true;
    } else if (recurrenceType === 'specific_days') {
      // Luxon weekday: 1=Mon, 7=Sun. Convert to 0=Sun, 1=Mon, ..., 6=Sat
      const luxonWeekday = currentDay.weekday;
      const jsDay = luxonWeekday === 7 ? 0 : luxonWeekday;
      if (daysOfWeek.includes(jsDay)) {
        dayQualifies = true;
      }
    } else if (recurrenceType === 'interval') {
      const daysDiff = Math.floor(currentDay.diff(startDt, 'days').days);
      if (daysDiff >= 0 && daysDiff % intervalDays === 0) {
        dayQualifies = true;
      }
    }

    if (dayQualifies) {
      for (const timeStr of timesOfDay) {
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        const occurrenceLocal = currentDay.set({
          hour,
          minute,
          second: 0,
          millisecond: 0,
        });

        const scheduledAtUTC = occurrenceLocal.toUTC().toJSDate();

        // Ensure occurrence is within the schedule start and end dates
        if (scheduledAtUTC < startDate) continue;
        if (endDate && scheduledAtUTC > endDate) continue;

        // Ensure occurrence falls within [windowStart, windowEnd]
        if (scheduledAtUTC >= windowStart && scheduledAtUTC <= windowEnd) {
          occurrences.push({
            scheduledAtUTC,
            localScheduledDate: currentDay.toFormat('yyyy-MM-dd'),
            localScheduledTime: timeStr,
            timeOfDaySlot: getTimeOfDaySlot(hour),
          });
        }
      }
    }

    currentDay = currentDay.plus({ days: 1 });
  }

  // Sort by scheduled timestamp ascending
  return occurrences.sort((a, b) => a.scheduledAtUTC.getTime() - b.scheduledAtUTC.getTime());
}
