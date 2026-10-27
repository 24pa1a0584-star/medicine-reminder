import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { FormulationType, RecurrenceType } from '../../types';
import {
  Pill,
  Droplet,
  Wind,
  Syringe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Package,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formulations: Array<{ type: FormulationType; label: string; icon: any; color: string }> = [
  { type: 'tablet', label: 'Tablet', icon: Pill, color: '#10B981' },
  { type: 'capsule', label: 'Capsule', icon: Pill, color: '#6366F1' },
  { type: 'liquid', label: 'Liquid / Syrup', icon: Droplet, color: '#F59E8B' },
  { type: 'drops', label: 'Drops', icon: Droplet, color: '#89D7F7' },
  { type: 'inhaler', label: 'Inhaler', icon: Wind, color: '#9B8AFB' },
  { type: 'injection', label: 'Injection', icon: Syringe, color: '#F43F5E' },
  { type: 'topical', label: 'Topical / Cream', icon: Sparkles, color: '#B7F7E4' },
  { type: 'other', label: 'Other', icon: Pill, color: '#64748B' },
];

const daysMap = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const AddMedicineWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Details
    name: '',
    genericName: '',
    brandName: '',
    formulation: 'tablet' as FormulationType,
    strength: '',
    doseAmount: 1,
    doseUnit: 'tablet',
    color: '#10B981',

    // Step 2: Directions
    route: 'oral',
    instructions: '',
    notes: '',

    // Step 3: Prescribed Schedule
    recurrenceType: 'daily' as RecurrenceType,
    timesOfDay: ['08:00'],
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    intervalDays: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',

    // Step 4: Inventory
    initialStock: 30,
    lowStockThreshold: 5,
    autoDeductOnDose: true,
  });

  const [previewOccurrences, setPreviewOccurrences] = useState<any[]>([]);

  // Step navigation validations
  const handleNext = async () => {
    setErrorMsg(null);

    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('Please enter a medicine name as instructed by your healthcare provider.');
        return;
      }
      if (!formData.strength.trim()) {
        setErrorMsg('Please enter the strength (e.g., 500 mg, 10 ml, 2 puffs).');
        return;
      }
    }

    if (step === 3) {
      if (formData.timesOfDay.length === 0) {
        setErrorMsg('Please specify at least one scheduled time of day.');
        return;
      }
      if (formData.recurrenceType === 'specific_days' && formData.daysOfWeek.length === 0) {
        setErrorMsg('Please select at least one day of the week.');
        return;
      }

      // Fetch occurrence preview from backend
      try {
        const res = await apiClient.schedules.preview({
          recurrenceType: formData.recurrenceType,
          timesOfDay: formData.timesOfDay,
          daysOfWeek: formData.daysOfWeek,
          intervalDays: formData.intervalDays,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
        });
        setPreviewOccurrences(res.data.occurrences);
      } catch (err) {
        console.error('Failed to preview schedule occurrences', err);
      }
    }

    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddTime = () => {
    setFormData((prev) => ({
      ...prev,
      timesOfDay: [...prev.timesOfDay, '12:00'],
    }));
  };

  const handleRemoveTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      timesOfDay: prev.timesOfDay.filter((_, i) => i !== index),
    }));
  };

  const handleTimeChange = (index: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.timesOfDay];
      updated[index] = val;
      return { ...prev, timesOfDay: updated };
    });
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((d) => d !== day)
          : [...prev.daysOfWeek, day].sort(),
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await apiClient.medicines.create({
        name: formData.name.trim(),
        genericName: formData.genericName.trim() || undefined,
        brandName: formData.brandName.trim() || undefined,
        formulation: formData.formulation,
        strength: formData.strength.trim(),
        doseAmount: Number(formData.doseAmount) || 1,
        doseUnit: formData.doseUnit.trim() || 'tablet',
        route: formData.route,
        instructions: formData.instructions.trim() || undefined,
        color: formData.color,
        icon: formData.formulation,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes.trim() || undefined,
        schedule: {
          recurrenceType: formData.recurrenceType,
          timesOfDay: formData.timesOfDay,
          daysOfWeek: formData.daysOfWeek,
          intervalDays: Number(formData.intervalDays) || 1,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
        },
        initialStock: Number(formData.initialStock) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        autoDeductOnDose: formData.autoDeductOnDose,
      });

      navigate('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as any)?.response?.data?.error?.message || 'Failed to save medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
          <span>Step {step} of 5</span>
          <span>
            {step === 1 && 'Medicine Details'}
            {step === 2 && 'Prescribed Directions'}
            {step === 3 && 'Schedule & Times'}
            {step === 4 && 'Refill & Inventory'}
            {step === 5 && 'Preview & Confirm'}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-emerald to-brand-indigo"
            initial={{ width: '20%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Panels */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 min-h-[420px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STEP 1: Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  What medication are you organizing?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the medication exactly as written on your prescription or packaging.
                </p>
              </div>

              {/* Formulation Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Formulation Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {formulations.map((f) => {
                    const Icon = f.icon;
                    const isSelected = formData.formulation === f.type;
                    return (
                      <button
                        key={f.type}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            formulation: f.type,
                            color: f.color,
                            doseUnit: f.type === 'tablet' ? 'tablet' : f.type === 'capsule' ? 'capsule' : f.type === 'liquid' ? 'ml' : 'dose',
                          })
                        }
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-brand-emerald bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald shadow-sm scale-102 ring-2 ring-brand-emerald/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" style={{ color: f.color }} />
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medicine Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Metformin, Amoxicillin, Calcirol"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  autoFocus
                />
              </div>

              {/* Strength & Dosage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Strength *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 500 mg, 10 ml"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dose Amount
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={formData.doseAmount}
                    onChange={(e) => setFormData({ ...formData, doseAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dose Unit
                  </label>
                  <input
                    type="text"
                    placeholder="tablet, puff, spoon"
                    value={formData.doseUnit}
                    onChange={(e) => setFormData({ ...formData, doseUnit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Instructions */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  Instructions & Route
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How and when should this dose be taken based on your prescription?
                </p>
              </div>

              {/* Quick Preset Tags for Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Meal Timings (Click to add)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Take before breakfast',
                    'Take after breakfast',
                    'Take with meals',
                    'Take after dinner',
                    'Take on empty stomach',
                    'Take with warm water',
                    'Take at bedtime',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, instructions: preset })}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User-Entered Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g., Take after breakfast with a full glass of water"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Notes / Doctor's Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Prescribed by Dr. Rajesh Sharma for 2 weeks."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 3: Schedule */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  Prescribed Schedule & Timing
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure the schedule confirmed with your doctor.
                </p>
              </div>

              {/* Recurrence Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Recurrence Frequency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'daily', label: 'Every Day' },
                    { type: 'specific_days', label: 'Selected Days' },
                    { type: 'interval', label: 'Every N Days' },
                    { type: 'as_needed', label: 'As Needed (PRN)' },
                  ].map((r) => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, recurrenceType: r.type as RecurrenceType })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        formData.recurrenceType === r.type
                          ? 'border-brand-indigo bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo ring-2 ring-brand-indigo/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Weekdays Selector */}
              {formData.recurrenceType === 'specific_days' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Repeat on Weekdays
                  </label>
                  <div className="flex gap-2">
                    {daysMap.map((d) => {
                      const isSelected = formData.daysOfWeek.includes(d.day);
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => handleDayToggle(d.day)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-brand-emerald text-white shadow-bloom'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Times of Day Dynamic Inputs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reminder Times (24-Hour Format)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-emerald hover:text-brand-emeraldDark"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Time
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.timesOfDay.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(idx, e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                      />
                      {formData.timesOfDay.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start & Optional End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Refills */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  Medicine Refill & Stock Tracker
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Keep track of your supply so you never run out unexpectedly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Quantity on Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Automatic Deduction Opt-In */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoDeduct"
                  checked={formData.autoDeductOnDose}
                  onChange={(e) => setFormData({ ...formData, autoDeductOnDose: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
                />
                <label htmlFor="autoDeduct" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
                  <strong>Automatically subtract stock only when I click "Mark Taken"</strong>.
                  <span className="block text-slate-500 dark:text-slate-400 mt-0.5">
                    DOSEBLOOM never subtracts stock merely because a reminder went off. You stay in control.
                  </span>
                </label>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Review & Preview */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                  Review & Confirm Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Verify your medication details and upcoming reminder times.
                </p>
              </div>

              {/* Medicine Card Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.color }}
                  >
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {formData.name} ({formData.strength})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Take {formData.doseAmount} {formData.doseUnit} • {formData.recurrenceType}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                  {formData.initialStock} {formData.doseUnit}s in stock
                </span>
              </div>

              {/* Calculated Occurrence Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Generated Occurrences (Next 7 Days Preview)
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {previewOccurrences.length > 0 ? (
                    previewOccurrences.map((occ, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {occ.localScheduledDate} ({occ.timeOfDaySlot})
                        </span>
                        <span className="font-bold text-brand-emerald">
                          {occ.localScheduledTime}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No fixed daily alarms generated (e.g. As-needed schedule).
                    </p>
                  )}
                </div>
              </div>

              {/* Medical Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety check:</strong> Confirm that all times, doses, and directions match your official prescription instructions.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Controls Bottom Bar */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark text-white text-xs font-bold shadow-bloom transition-all hover:scale-[1.02] active:scale-95"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-indigo hover:opacity-95 text-white text-xs font-bold shadow-bloom transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Saving Medicine...' : 'Confirm & Save Medicine'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
