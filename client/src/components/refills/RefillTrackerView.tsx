import React, { useState } from 'react';
import { IInventoryRecord, IRefillTransaction } from '../../types';
import { apiClient } from '../../services/api';
import {
  Package,
  Plus,
  AlertTriangle,
  History,
  RotateCw,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { getFormulationIcon } from '../dashboard/DoseCard';

interface RefillTrackerViewProps {
  inventories: IInventoryRecord[];
  transactions: IRefillTransaction[];
  onRefresh: () => void;
}

export const RefillTrackerView: React.FC<RefillTrackerViewProps> = ({
  inventories,
  transactions,
  onRefresh,
}) => {
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  const [refillQuantity, setRefillQuantity] = useState<number>(30);
  const [refillNote, setRefillNote] = useState<string>('');

  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRefillSubmit = async () => {
    if (!selectedMedId || refillQuantity <= 0) return;
    try {
      setLoading(true);
      await apiClient.inventory.refill(selectedMedId, refillQuantity, refillNote);
      setRefillModalOpen(false);
      setRefillNote('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!selectedMedId || adjustQuantity < 0) return;
    try {
      setLoading(true);
      await apiClient.inventory.adjust(selectedMedId, adjustQuantity, adjustReason);
      setAdjustModalOpen(false);
      setAdjustReason('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = inventories.filter(
    (inv) => inv.currentQuantity <= inv.lowStockThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-heading font-bold text-sm text-rose-900 dark:text-rose-200">
              Low Stock Supply Notice ({lowStockCount} {lowStockCount === 1 ? 'medicine' : 'medicines'})
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              Your recorded supply is near or below your custom threshold. Check your physical bottle to confirm, and remember to obtain an authorized refill from your pharmacy.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Medicine Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventories.map((inv) => {
          const med = typeof inv.medicineId === 'object' ? (inv.medicineId as any) : null;
          const FormulationIcon = getFormulationIcon(med?.formulation);
          const isLow = inv.currentQuantity <= inv.lowStockThreshold;

          // Percentage of healthy 30-day stock
          const fillPercentage = Math.min(100, Math.round((inv.currentQuantity / 30) * 100));

          return (
            <div
              key={inv._id}
              className={`glass-card rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                isLow
                  ? 'border-rose-300 dark:border-rose-900/60 shadow-sm'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: med?.color || '#10B981' }}
                    >
                      <FormulationIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                        {med?.name || 'Medicine'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {med?.strength}
                      </p>
                    </div>
                  </div>

                  {isLow && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Stock Level Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      Remaining
                    </span>
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {inv.currentQuantity} {inv.quantityUnit}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow
                          ? 'bg-rose-500'
                          : 'bg-gradient-to-r from-brand-emerald to-brand-indigo'
                      }`}
                      style={{ width: `${Math.max(8, fillPercentage)}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 text-right">
                    Alert threshold: {inv.lowStockThreshold} {inv.quantityUnit}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedMedId(med?._id || inv.medicineId);
                    setRefillModalOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white text-xs font-bold shadow-bloom transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Log Refill
                </button>

                <button
                  onClick={() => {
                    setSelectedMedId(med?._id || inv.medicineId);
                    setAdjustQuantity(inv.currentQuantity);
                    setAdjustModalOpen(true);
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Manually reconcile stock"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Refill Transaction History */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-indigo/10 text-brand-indigo">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Recent Inventory Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of stock refills, confirmed dose deductions, and count adjustments.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-wider text-[10px] text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Medicine</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Change</th>
                <th className="py-2.5 px-4">New Balance</th>
                <th className="py-2.5 px-4">Note</th>
                <th className="py-2.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const med = typeof tx.medicineId === 'object' ? (tx.medicineId as any) : null;
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        {med?.name || 'Medicine'}
                      </td>
                      <td className="py-2.5 px-4 capitalize">
                        {tx.transactionType.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-4 font-bold">
                        <span
                          className={tx.quantityChange > 0 ? 'text-emerald-600' : 'text-slate-500'}
                        >
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {tx.remainingQuantity}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic max-w-xs truncate">
                        {tx.note || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {new Date(tx.recordedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400 italic">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Refill Modal */}
      {refillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Log Medicine Refill
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Units Added (e.g. 30 tablets)
              </label>
              <input
                type="number"
                min="1"
                value={refillQuantity}
                onChange={(e) => setRefillQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pharmacy / Purchase Note
              </label>
              <input
                type="text"
                placeholder="e.g., MedPlus Pharmacy, Invoice #1234"
                value={refillNote}
                onChange={(e) => setRefillNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefillModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefillSubmit}
                disabled={loading || refillQuantity <= 0}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-brand-emeraldDark disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Manual Stock Count Reconciliation
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Actual Physical Count
              </label>
              <input
                type="number"
                min="0"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Adjustment
              </label>
              <input
                type="text"
                placeholder="e.g., Physical pill bottle count verification"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustSubmit}
                disabled={loading || adjustQuantity < 0}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Reconcile Count'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
