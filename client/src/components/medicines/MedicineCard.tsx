import React, { useState } from 'react';
import { IMedicine } from '../../types';
import { getFormulationIcon } from '../dashboard/DoseCard';
import {
  Clock,
  Package,
  PauseCircle,
  PlayCircle,
  Archive,
  MoreVertical,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicineCardProps {
  medicine: IMedicine;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onPause,
  onResume,
  onArchive,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const FormulationIcon = getFormulationIcon(medicine.formulation);
  const schedule = medicine.schedule;
  const inventory = medicine.inventory;

  const isLowStock = inventory ? inventory.currentQuantity <= inventory.lowStockThreshold : false;
  const isPaused = medicine.status === 'paused';

  const handleAction = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      setMenuOpen(false);
      await action();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass-card rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
        isPaused
          ? 'border-slate-300 dark:border-slate-800 opacity-75'
          : 'border-slate-200/80 dark:border-slate-800 hover:shadow-bloom'
      }`}
    >
      {/* Top row: Icon, Name & Menu */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white"
              style={{ backgroundColor: medicine.color || '#10B981' }}
            >
              <FormulationIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  {medicine.name}
                </h3>
                {isPaused && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                    PAUSED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {medicine.strength} • {medicine.doseAmount} {medicine.doseUnit}
              </p>

              {medicine.genericName && medicine.genericName !== medicine.name && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Generic: {medicine.genericName}
                </p>
              )}
            </div>
          </div>

          {/* Action Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 mt-1 w-44 rounded-2xl glass-card py-1.5 shadow-xl z-20 border border-slate-200 dark:border-slate-800"
                >
                  {isPaused ? (
                    <button
                      onClick={() => handleAction(() => onResume(medicine._id))}
                      disabled={loading}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left"
                    >
                      <PlayCircle className="w-4 h-4" /> Resume Reminders
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(() => onPause(medicine._id))}
                      disabled={loading}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left"
                    >
                      <PauseCircle className="w-4 h-4" /> Pause Reminders
                    </button>
                  )}

                  <button
                    onClick={() => handleAction(() => onArchive(medicine._id))}
                    disabled={loading}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                  >
                    <Archive className="w-4 h-4" /> Archive Medicine
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Instructions */}
        {medicine.instructions && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
            "{medicine.instructions}"
          </p>
        )}
      </div>

      {/* Bottom details: Schedule Times & Stock */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs gap-2 flex-wrap">
        {/* Schedule Chip */}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-brand-emerald" />
          <span className="font-semibold">
            {schedule?.timesOfDay?.join(', ') || 'As Needed'}
          </span>
          <span className="text-[11px] text-slate-400 capitalize">
            ({schedule?.recurrenceType?.replace('_', ' ') || 'Daily'})
          </span>
        </div>

        {/* Inventory Badge */}
        {inventory && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isLowStock
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isLowStock ? <AlertTriangle className="w-3 h-3" /> : <Package className="w-3 h-3" />}
            <span>
              {inventory.currentQuantity} {inventory.quantityUnit}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
