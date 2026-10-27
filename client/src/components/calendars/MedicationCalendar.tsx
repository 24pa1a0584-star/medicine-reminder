import React, { useState } from 'react';
import { IDoseOccurrence } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  SkipForward,
} from 'lucide-react';

interface MedicationCalendarProps {
  occurrences: IDoseOccurrence[];
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
}

export const MedicationCalendar: React.FC<MedicationCalendarProps> = ({
  occurrences,
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Map occurrences by local date string
  const occurrencesByDate: Record<string, IDoseOccurrence[]> = {};
  for (const occ of occurrences) {
    if (!occurrencesByDate[occ.localScheduledDate]) {
      occurrencesByDate[occ.localScheduledDate] = [];
    }
    occurrencesByDate[occ.localScheduledDate].push(occ);
  }

  // Generate grid cells
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Month Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            {monthName}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonthDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100 dark:border-slate-800">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="min-h-[50px] sm:min-h-[64px]" />
        ))}

        {days.map((dayNum) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dayOccs = occurrencesByDate[dateStr] || [];

          const hasTaken = dayOccs.some((o) => o.state === 'taken');
          const hasSkipped = dayOccs.some((o) => o.state === 'skipped');
          const hasDue = dayOccs.some((o) => o.state === 'due' || o.state === 'snoozed');

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`p-1.5 sm:p-2 min-h-[50px] sm:min-h-[64px] rounded-2xl flex flex-col items-center justify-between transition-all border ${
                isSelected
                  ? 'border-brand-emerald bg-emerald-50 dark:bg-emerald-950/40 shadow-sm ring-2 ring-brand-emerald/30'
                  : isToday
                  ? 'border-slate-400 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                  : 'border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span
                className={`text-xs font-bold ${
                  isSelected
                    ? 'text-brand-emerald'
                    : isToday
                    ? 'text-brand-indigo font-extrabold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {dayNum}
              </span>

              {/* Status Indicator Dots */}
              <div className="flex items-center gap-1 mt-1">
                {hasTaken && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Taken doses" />}
                {hasDue && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Due doses" />}
                {hasSkipped && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Skipped doses" />}
                {!hasTaken && !hasDue && !hasSkipped && dayOccs.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" title="Scheduled doses" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
