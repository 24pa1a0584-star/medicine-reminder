import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { IDoseOccurrence } from '../types';
import { DailyProgressRing } from '../components/dashboard/DailyProgressRing';
import { TimelineSlot } from '../components/dashboard/TimelineSlot';
import {
  PlusCircle,
  Calendar,
  Package,
  RotateCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayData, setTodayData] = useState<{
    date: string;
    stats: {
      totalScheduled: number;
      totalTaken: number;
      totalSkipped: number;
      totalDue: number;
      totalUnconfirmed: number;
      completionPercentage: number;
    };
    grouped: {
      morning: IDoseOccurrence[];
      afternoon: IDoseOccurrence[];
      evening: IDoseOccurrence[];
      night: IDoseOccurrence[];
    };
    all: IDoseOccurrence[];
  } | null>(null);

  const fetchTodaySchedule = async () => {
    try {
      setLoading(true);
      const res = await apiClient.schedules.getToday();
      setTodayData(res.data);
    } catch (err) {
      console.error('Error fetching today schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const handleTake = async (occurrenceId: string, notes?: string) => {
    await apiClient.doses.markTaken(occurrenceId, { notes });
    await fetchTodaySchedule();
  };

  const handleSkip = async (occurrenceId: string, notes?: string) => {
    await apiClient.doses.markSkipped(occurrenceId, { notes });
    await fetchTodaySchedule();
  };

  const handleSnooze = async (occurrenceId: string, minutes: number) => {
    await apiClient.doses.snooze(occurrenceId, minutes);
    await fetchTodaySchedule();
  };

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            {getGreeting()},{' '}
            <span className="gradient-bloom-text">{user?.name?.split(' ')[0] || 'Friend'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your personalized medication routine for today.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchTodaySchedule}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh routine"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/medicines/new"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs shadow-bloom transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Medicine
          </Link>
        </div>
      </div>

      {/* Circular Animated Progress Ring Card */}
      {todayData && (
        <DailyProgressRing
          totalScheduled={todayData.stats.totalScheduled}
          totalTaken={todayData.stats.totalTaken}
          percentage={todayData.stats.completionPercentage}
        />
      )}

      {/* Routine Slots Timeline */}
      {todayData && (
        <div className="space-y-6 pt-2">
          {todayData.all.length === 0 ? (
            /* Friendly Empty State */
            <div className="glass-card rounded-3xl p-10 text-center space-y-4 border border-slate-200/80 dark:border-slate-800">
              <div className="w-16 h-16 rounded-3xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  No medications scheduled for today
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Add your prescribed daily or weekly medicines to automatically populate your daily routine timeline.
                </p>
              </div>
              <Link
                to="/medicines/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-emerald hover:bg-brand-emeraldDark text-white text-xs font-bold shadow-bloom transition-all hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                Add Your First Medicine
              </Link>
            </div>
          ) : (
            <>
              {/* Morning Slot */}
              <TimelineSlot
                slot="morning"
                occurrences={todayData.grouped.morning}
                onTake={handleTake}
                onSkip={handleSkip}
                onSnooze={handleSnooze}
              />

              {/* Afternoon Slot */}
              <TimelineSlot
                slot="afternoon"
                occurrences={todayData.grouped.afternoon}
                onTake={handleTake}
                onSkip={handleSkip}
                onSnooze={handleSnooze}
              />

              {/* Evening Slot */}
              <TimelineSlot
                slot="evening"
                occurrences={todayData.grouped.evening}
                onTake={handleTake}
                onSkip={handleSkip}
                onSnooze={handleSnooze}
              />

              {/* Night Slot */}
              <TimelineSlot
                slot="night"
                occurrences={todayData.grouped.night}
                onTake={handleTake}
                onSkip={handleSkip}
                onSnooze={handleSnooze}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
