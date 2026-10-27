import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  Heart,
  Info,
  Calendar,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  summary: any;
  trends: any[];
  distribution: any[];
}

const COLORS = ['#10B981', '#6366F1', '#F59E8B', '#9B8AFB'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  trends,
  distribution,
}) => {
  const adherenceRate = summary?.adherenceRate ?? 100;
  const stats = summary?.stats || {
    totalScheduled: 0,
    totalTaken: 0,
    totalSkipped: 0,
    totalUnconfirmed: 0,
  };

  return (
    <div className="space-y-6">
      {/* Supportive Banner & Medical Boundary */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
        <div className="p-2.5 rounded-2xl bg-brand-emerald/10 text-brand-emerald shrink-0">
          <Heart className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Personal Routine & Consistency Insights
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Every step counts towards building a dependable wellness routine. This dashboard summarizes your self-reported logs over time.
          </p>
          <p className="text-[11px] text-slate-400 italic">
            <strong>Important notice:</strong> DOSEBLOOM metrics represent user self-reporting. They do not independently measure clinical medication adherence, therapeutic drug levels, or healthcare outcomes.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence Rate */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            30-Day Routine Score
          </span>
          <div className="my-2">
            <span className="text-3xl font-heading font-extrabold text-brand-emerald">
              {adherenceRate}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Self-reported consistency
          </span>
        </div>

        {/* Total Taken */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Confirmed Taken
          </span>
          <div className="my-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              {stats.totalTaken}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Logged with timestamps
          </span>
        </div>

        {/* Total Skipped */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Reported Skipped
          </span>
          <div className="my-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              {stats.totalSkipped}
            </span>
          </div>
          <span className="text-[11px] text-rose-500 font-semibold">
            Deliberately skipped
          </span>
        </div>

        {/* Unconfirmed Reminders */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Unconfirmed
          </span>
          <div className="my-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              {stats.totalUnconfirmed}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            No action was recorded
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                7-Day Dose Completion
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily scheduled doses compared to confirmed taken doses.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="taken" name="Confirmed Taken" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="scheduled" name="Total Scheduled" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time-of-Day Distribution Donut Chart (1 col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Time-of-Day Routine
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of scheduled reminders across daily slots.
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="slot"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Slot Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {distribution.map((slot, idx) => (
              <div key={slot.slot} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {slot.slot} ({slot.total})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
