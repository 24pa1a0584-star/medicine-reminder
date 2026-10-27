import React from 'react';
import {
  Clock,
  Bell,
  Package,
  HeartHandshake,
  ShieldCheck,
  Smartphone,
  CalendarDays,
  LineChart,
  Lock,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Precision Recurrence Engine',
      description:
        'Supports Daily, Multiple-Times-Daily, Selected Weekdays, Interval-based (Every N Days), and As-Needed regimens. Fully anchored in unambiguous UTC with localized IANA timezone projection (Asia/Kolkata).',
      color: '#10B981',
    },
    {
      icon: Bell,
      title: 'Web Push & Dual-Worker Architecture',
      description:
        'Features both an Academic Demonstration Mode for immediate evaluations and an Always-On Background Worker with atomic lease claiming, bounded exponential backoff, and automatic invalid subscription cleanup.',
      color: '#6366F1',
    },
    {
      icon: CalendarDays,
      title: 'Interactive Daily & Monthly Timeline',
      description:
        'Organizes medications into intuitive Morning, Afternoon, Evening, and Night slots. Features monthly and weekly calendar overviews with quick date navigation.',
      color: '#89D7F7',
    },
    {
      icon: Package,
      title: 'Inventory & Refill Management',
      description:
        'Only automatically deducts pill inventory when a dose is explicitly confirmed taken. Provides visual fill gauges, customizable low-stock warning thresholds, and full transaction history.',
      color: '#F59E8B',
    },
    {
      icon: HeartHandshake,
      title: 'Authorized Caregiver Sharing',
      description:
        'Explicit, opt-in caregiver access with cryptographic invitation tokens. Primary users maintain full control and can inspect or revoke caregiver access at any time.',
      color: '#9B8AFB',
    },
    {
      icon: LineChart,
      title: 'Self-Reported Consistency Insights',
      description:
        'Helpful Recharts visualizations of 7-day completion and time-of-day distribution. Uses neutral, supportive language without shaming streaks.',
      color: '#10B981',
    },
    {
      icon: Smartphone,
      title: 'Responsive Windows & Android PWA',
      description:
        'Installable Progressive Web App with service worker caching, offline shell fallback, and thumb-friendly mobile bottom navigation.',
      color: '#6366F1',
    },
    {
      icon: Lock,
      title: 'DPDP Act & Healthcare Privacy',
      description:
        'Lock-screen notification privacy option (hides sensitive medicine names), full JSON data export, and 1-click complete account erasure.',
      color: '#162238',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-slate-900 dark:text-white">
          Engineered for Reliability
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A comprehensive breakdown of DOSEBLOOM’s full-stack architecture, scheduling invariants, and privacy protections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm"
                  style={{ backgroundColor: feat.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-6">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-emerald hover:bg-brand-emeraldDark text-white font-heading font-bold text-sm shadow-bloom transition-all hover:scale-105"
        >
          Try DOSEBLOOM Today
        </Link>
      </div>
    </div>
  );
};
