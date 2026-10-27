import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { IMedicine } from '../types';
import { MedicineCard } from '../components/medicines/MedicineCard';
import { PlusCircle, Search, Pill, RotateCw } from 'lucide-react';

export const MedicinesPage: React.FC = () => {
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await apiClient.medicines.list(statusFilter);
      setMedicines(res.data.medicines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [statusFilter]);

  const handlePause = async (id: string) => {
    await apiClient.medicines.pause(id);
    fetchMedicines();
  };

  const handleResume = async (id: string) => {
    await apiClient.medicines.resume(id);
    fetchMedicines();
  };

  const handleArchive = async (id: string) => {
    if (confirm('Archive this medicine? Past dose history will be safely preserved.')) {
      await apiClient.medicines.archive(id);
      fetchMedicines();
    }
  };

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
            My Medications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View, manage, and configure your prescribed medication regimens.
          </p>
        </div>

        <Link
          to="/medicines/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs shadow-bloom transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add Medicine
        </Link>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['active', 'paused', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-brand-emerald text-white shadow-bloom'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => (
            <MedicineCard
              key={med._id}
              medicine={med}
              onPause={handlePause}
              onResume={handleResume}
              onArchive={handleArchive}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center mx-auto">
            <Pill className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            No {statusFilter} medications found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'active'
              ? 'Click "Add Medicine" to enter your first medication schedule.'
              : `You have no medications currently in the ${statusFilter} state.`}
          </p>
        </div>
      )}
    </div>
  );
};
