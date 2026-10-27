import React, { useState } from 'react';
import { IDoseAction } from '../../types';
import { apiClient } from '../../services/api';
import {
  Check,
  SkipForward,
  Clock,
  Edit3,
  Search,
  Filter,
  ShieldCheck,
  FileDown,
} from 'lucide-react';
import { getFormulationIcon } from '../dashboard/DoseCard';

interface DoseHistoryTableProps {
  actions: IDoseAction[];
  onActionCorrected: () => void;
}

export const DoseHistoryTable: React.FC<DoseHistoryTableProps> = ({
  actions,
  onActionCorrected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'taken' | 'skipped'>('all');
  const [correctingAction, setCorrectingAction] = useState<IDoseAction | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = actions.filter((act) => {
    const medName = typeof act.medicineId === 'object' ? (act.medicineId as any).name : '';
    const matchesSearch = medName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || act.actionType === filterType;
    return matchesSearch && matchesType;
  });

  const handleCorrect = async () => {
    if (!correctingAction || !correctionReason.trim()) return;

    try {
      setSubmitting(true);
      const newType = correctingAction.actionType === 'taken' ? 'skipped' : 'taken';
      await apiClient.doses.correct(correctingAction._id, newType, correctionReason);
      setCorrectingAction(null);
      setCorrectionReason('');
      onActionCorrected();
    } catch (err) {
      console.error('Failed to correct dose log', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Medicine', 'Action', 'Recorded Date', 'Reported Taken Date', 'Device', 'Notes'];
    const rows = filtered.map((act) => {
      const medName = typeof act.medicineId === 'object' ? (act.medicineId as any).name : 'Medicine';
      return [
        `"${medName}"`,
        act.actionType,
        new Date(act.recordedAtUTC).toLocaleString(),
        act.reportedTakenAtUTC ? new Date(act.reportedTakenAtUTC).toLocaleString() : 'N/A',
        act.sourceDevice || 'web',
        `"${act.notes || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dosebloom_dose_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            Activity Log & Dose History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit log of user-confirmed dose actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by medicine name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['all', 'taken', 'skipped'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterType === type
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-wider text-[10px] text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
            <tr>
              <th className="py-3 px-4">Medicine</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Scheduled For</th>
              <th className="py-3 px-4">Recorded At</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4 text-right">Correct</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length > 0 ? (
              filtered.map((act) => {
                const med = typeof act.medicineId === 'object' ? (act.medicineId as any) : null;
                const occ = typeof act.occurrenceId === 'object' ? (act.occurrenceId as any) : null;
                const FormulationIcon = getFormulationIcon(med?.formulation);

                return (
                  <tr key={act._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: med?.color || '#10B981' }}
                        >
                          <FormulationIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {med?.name || 'Medicine'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {med?.strength}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {act.actionType === 'taken' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3 h-3" /> Taken
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <SkipForward className="w-3 h-3" /> Skipped
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {occ ? `${occ.localScheduledDate} at ${occ.localScheduledTime}` : 'Scheduled Dose'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(act.recordedAtUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(act.recordedAtUTC).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-slate-500 italic truncate max-w-[150px]">
                      {act.notes || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setCorrectingAction(act)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Correct accidental log"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">
                  No dose activity records found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dose Correction Audit Modal */}
      {correctingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Correct Dose Log
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Change status from{' '}
              <strong className="capitalize text-slate-900 dark:text-white">
                {correctingAction.actionType}
              </strong>{' '}
              to{' '}
              <strong className="capitalize text-brand-emerald">
                {correctingAction.actionType === 'taken' ? 'skipped' : 'taken'}
              </strong>
              . This correction will be permanently preserved in the audit history.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Correction *
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Accidentally tapped Skipped earlier, actually took it with lunch."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCorrectingAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCorrect}
                disabled={submitting || !correctionReason.trim()}
                className="px-4 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-brand-emeraldDark disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Apply Correction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
