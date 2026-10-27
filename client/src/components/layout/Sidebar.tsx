import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  Pill,
  PlusCircle,
  CalendarDays,
  Package,
  BarChart3,
  BellRing,
  HeartHandshake,
  Settings,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: "Today's Routine", icon: Clock },
    { to: '/medicines', label: 'My Medicines', icon: Pill },
    { to: '/medicines/new', label: 'Add Medicine', icon: PlusCircle },
    { to: '/calendar', label: 'Calendar & History', icon: CalendarDays },
    { to: '/refills', label: 'Refill Tracker', icon: Package },
    { to: '/analytics', label: 'Routine Analytics', icon: BarChart3 },
    { to: '/notifications', label: 'Notifications & Devices', icon: BellRing },
    { to: '/caregivers', label: 'Caregiver Portal', icon: HeartHandshake },
    { to: '/settings', label: 'Settings & Privacy', icon: Settings },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin Dashboard', icon: ShieldAlert });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5 flex-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Daily Routine
        </p>

        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-emerald to-emerald-600 text-white shadow-bloom'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Safety Notice Badge in Sidebar */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>DOSEBLOOM</strong> is a reminder companion, not a medical or prescribing tool. Always consult your doctor.
          </p>
        </div>
      </div>
    </aside>
  );
};
