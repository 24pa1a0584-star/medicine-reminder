import React, { useState } from 'react';
import { IDoseOccurrence, IMedicine } from '../../types';
import {
  Check,
  Clock,
  RotateCcw,
  SkipForward,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Droplet,
  Wind,
  Syringe,
  Pill,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface DoseCardProps {
  occurrence: IDoseOccurrence;
  onTake: (occurrenceId: string, notes?: string) => Promise<void>;
  onSkip: (occurrenceId: string, notes?: string) => Promise<void>;
  onSnooze: (occurrenceId: string, minutes: number) => Promise<void>;
}

export const getFormulationIcon = (formulation?: string) => {
  switch (formulation) {
    case 'capsule':
      return Pill;
    case 'liquid':
      return Droplet;
    case 'drops':
      return Droplet;
    case 'inhaler':
      return Wind;
    case 'injection':
      return Syringe;
    case 'topical':
      return Sparkles;
    case 'tablet':
    default:
      return Pill;
  }
};

export const DoseCard: React.FC<DoseCardProps> = ({ occurrence, onTake, onSkip, onSnooze }) => {
  const [loading, setLoading] = useState(false);
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);

  const medicine = typeof occurrence.medicineId === 'object' ? (occurrence.medicineId as IMedicine) : null;
  const FormulationIcon = getFormulationIcon(medicine?.formulation);

  const handleTake = async () => {
    try {
      setLoading(true);
      await onTake(occurrence._id);

      // Trigger celebratory confetti burst!
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#6366F1', '#F59E8B', '#B7F7E4'],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await onSkip(occurrence._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (mins: number) => {
    try {
      setLoading(true);
      setSnoozeMenuOpen(false);
      await onSnooze(occurrence._id, mins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // State styling helper
  const getStateBadge = () => {
    switch (occurrence.state) {
      case 'taken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Check className="w-3.5 h-3.5" /> Taken
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <SkipForward className="w-3.5 h-3.5" /> Skipped
          </span>
        );
      case 'snoozed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Snoozed ({occurrence.snoozeCount})
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Due Now
          </span>
        );
      case 'unconfirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            <HelpCircle className="w-3.5 h-3.5" /> Unconfirmed
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
    }
  };

  const isActionable = ['upcoming', 'due', 'snoozed', 'unconfirmed'].includes(occurrence.state);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass-card rounded-2xl p-4 sm:p-5 transition-all duration-200 border ${
        occurrence.state === 'due'
          ? 'border-brand-emerald shadow-bloom'
          : occurrence.state === 'taken'
          ? 'border-slate-200/50 dark:border-slate-800/50 opacity-90'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon & Details */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white"
            style={{ backgroundColor: medicine?.color || '#10B981' }}
          >
            <FormulationIcon className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white truncate">
                {medicine?.name || 'Medication'}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {medicine?.strength}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Dose: <strong className="font-semibold text-slate-900 dark:text-white">{occurrence.doseAmount} {occurrence.doseUnit}</strong>
              {medicine?.route ? ` • ${medicine.route}` : ''}
            </p>

            {medicine?.instructions && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
                "{medicine.instructions}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Scheduled Time & State */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            {occurrence.localScheduledTime}
          </span>
          {getStateBadge()}
        </div>
      </div>

      {/* Action Controls (if not already taken or skipped) */}
      {isActionable && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Mark Taken Button */}
            <button
              onClick={handleTake}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white text-xs font-bold shadow-bloom transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Mark Taken
            </button>

            {/* Snooze Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSnoozeMenuOpen(!snoozeMenuOpen)}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                Snooze
              </button>

              {snoozeMenuOpen && (
                <div className="absolute left-0 mt-1 w-32 rounded-xl glass-card py-1 shadow-lg z-20 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleSnooze(15)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    15 minutes
                  </button>
                  <button
                    onClick={() => handleSnooze(30)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    30 minutes
                  </button>
                  <button
                    onClick={() => handleSnooze(60)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    1 hour
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs font-medium transition-colors"
            title="Record as intentionally skipped"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>
      )}
    </motion.div>
  );
};
