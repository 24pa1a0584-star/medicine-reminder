import React from 'react';
import { IDoseOccurrence } from '../../types';
import { DoseCard } from './DoseCard';
import { Sun, SunMedium, Sunset, Moon, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TimelineSlotProps {
  slot: 'morning' | 'afternoon' | 'evening' | 'night';
  occurrences: IDoseOccurrence[];
  onTake: (occurrenceId: string, notes?: string) => Promise<void>;
  onSkip: (occurrenceId: string, notes?: string) => Promise<void>;
  onSnooze: (occurrenceId: string, minutes: number) => Promise<void>;
}

const slotConfig = {
  morning: {
    label: 'Morning',
    timeRange: '05:00 AM – 11:59 AM',
    icon: Sun,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  afternoon: {
    label: 'Afternoon',
    timeRange: '12:00 PM – 04:59 PM',
    icon: SunMedium,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
  },
  evening: {
    label: 'Evening',
    timeRange: '05:00 PM – 08:59 PM',
    icon: Sunset,
    color: 'text-brand-coral',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
  },
  night: {
    label: 'Night',
    timeRange: '09:00 PM – 04:59 AM',
    icon: Moon,
    color: 'text-brand-indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
};

export const TimelineSlot: React.FC<TimelineSlotProps> = ({
  slot,
  occurrences,
  onTake,
  onSkip,
  onSnooze,
}) => {
  const config = slotConfig[slot];
  const Icon = config.icon;

  if (occurrences.length === 0) {
    return null; // Keep dashboard tight and uncluttered if no doses in this slot
  }

  return (
    <section className="space-y-3">
      {/* Slot Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${config.bg} ${config.color} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              {config.label}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {config.timeRange}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {occurrences.length} {occurrences.length === 1 ? 'dose' : 'doses'}
        </span>
      </div>

      {/* Doses List in Slot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {occurrences.map((occ) => (
          <DoseCard
            key={occ._id}
            occurrence={occ}
            onTake={onTake}
            onSkip={onSkip}
            onSnooze={onSnooze}
          />
        ))}
      </div>
    </section>
  );
};
