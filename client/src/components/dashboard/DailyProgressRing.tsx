import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock } from 'lucide-react';

interface DailyProgressRingProps {
  totalScheduled: number;
  totalTaken: number;
  percentage: number;
}

export const DailyProgressRing: React.FC<DailyProgressRingProps> = ({
  totalScheduled,
  totalTaken,
  percentage,
}) => {
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isComplete = totalScheduled > 0 && totalTaken >= totalScheduled;

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/80 dark:border-slate-800">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-brand-emerald/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-brand-indigo/10 blur-3xl pointer-events-none" />

      <div className="space-y-1.5 text-center md:text-left z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
          <Clock className="w-3.5 h-3.5" />
          Today's Adherence Routine
        </div>
        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
          {totalScheduled === 0
            ? 'No medicines scheduled today'
            : isComplete
            ? 'All daily doses completed!'
            : `${totalTaken} of ${totalScheduled} scheduled doses marked taken`}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
          {totalScheduled === 0
            ? 'Add your prescribed medicines to generate your personalized daily timeline.'
            : isComplete
            ? 'Wonderful consistency today! Keep following your healthcare provider’s instructions.'
            : 'Track each dose as you take it. Remember to always follow your physician’s exact directions.'}
        </p>
      </div>

      {/* Progress SVG Ring */}
      <div className="relative flex items-center justify-center shrink-0 z-10">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            className="text-slate-200 dark:text-slate-800"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke="url(#ringGrad)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          {isComplete ? (
            <CheckCircle2 className="w-8 h-8 text-brand-emerald animate-bounce" />
          ) : (
            <>
              <span className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                {percentage}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Done
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
