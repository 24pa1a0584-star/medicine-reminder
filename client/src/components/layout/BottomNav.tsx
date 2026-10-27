import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Pill, Plus, Package, BarChart3 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-2 max-w-lg mx-auto">
        {/* Today */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-brand-emerald font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Clock className="w-5 h-5" />
          <span>Today</span>
        </NavLink>

        {/* Medicines */}
        <NavLink
          to="/medicines"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-brand-emerald font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Pill className="w-5 h-5" />
          <span>Medicines</span>
        </NavLink>

        {/* Floating Add Center Button */}
        <div className="flex justify-center -mt-5">
          <NavLink
            to="/medicines/new"
            aria-label="Add New Medicine"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-emerald to-emerald-600 text-white flex items-center justify-center shadow-bloom hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>
        </div>

        {/* Refills */}
        <NavLink
          to="/refills"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-brand-emerald font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Package className="w-5 h-5" />
          <span>Refills</span>
        </NavLink>

        {/* Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-brand-emerald font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span>Insights</span>
        </NavLink>
      </div>
    </nav>
  );
};
