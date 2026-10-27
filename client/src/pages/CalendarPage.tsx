import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { IDoseOccurrence, IDoseAction } from '../types';
import { MedicationCalendar } from '../components/calendars/MedicationCalendar';
import { DoseHistoryTable } from '../components/calendars/DoseHistoryTable';
import { DoseCard } from '../components/dashboard/DoseCard';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [monthOccurrences, setMonthOccurrences] = useState<IDoseOccurrence[]>([]);
  const [dayOccurrences, setDayOccurrences] = useState<IDoseOccurrence[]>([]);
  const [historyActions, setHistoryActions] = useState<IDoseAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMonthAndHistory = async () => {
    try {
      setLoading(true);
      const dateObj = new Date(selectedDate);
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;

      const [monthRes, histRes, dayRes] = await Promise.all([
        apiClient.schedules.getMonthly(year, month),
        apiClient.doses.getHistory(1, 100),
        apiClient.schedules.getToday(selectedDate),
      ]);

      setMonthOccurrences(monthRes.data.occurrences);
      setHistoryActions(histRes.data.actions);
      setDayOccurrences(dayRes.data.all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthAndHistory();
  }, [selectedDate]);

  const handleTake = async (occurrenceId: string, notes?: string) => {
    await apiClient.doses.markTaken(occurrenceId, { notes });
    fetchMonthAndHistory();
  };

  const handleSkip = async (occurrenceId: string, notes?: string) => {
    await apiClient.doses.markSkipped(occurrenceId, { notes });
    fetchMonthAndHistory();
  };

  const handleSnooze = async (occurrenceId: string, minutes: number) => {
    await apiClient.doses.snooze(occurrenceId, minutes);
    fetchMonthAndHistory();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Medication Calendar & History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Review your upcoming scheduled doses and verify completed historical activity.
        </p>
      </div>

      {/* Grid: Calendar Left, Selected Day Doses Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar (7 cols) */}
        <div className="lg:col-span-7">
          <MedicationCalendar
            occurrences={monthOccurrences}
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        </div>

        {/* Selected Day Doses (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Doses on {selectedDate}
              </h3>
              <p className="text-[11px] text-slate-400">
                {dayOccurrences.length} {dayOccurrences.length === 1 ? 'dose' : 'doses'} scheduled
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {dayOccurrences.length > 0 ? (
              dayOccurrences.map((occ) => (
                <DoseCard
                  key={occ._id}
                  occurrence={occ}
                  onTake={handleTake}
                  onSkip={handleSkip}
                  onSnooze={handleSnooze}
                />
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                No medication doses scheduled on this day.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full Dose History Audit Table */}
      <DoseHistoryTable
        actions={historyActions}
        onActionCorrected={fetchMonthAndHistory}
      />
    </div>
  );
};
