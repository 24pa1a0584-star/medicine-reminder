import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Clock,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Heart,
  Package,
  Users,
  Smartphone,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-6 md:py-12 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-emerald/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-brand-indigo/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-brand-emerald shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>A little reminder. A healthier routine.</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4 max-w-4xl mx-auto"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Never lose track of your{' '}
            <span className="gradient-bloom-text">medicine routine.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Organize your user-prescribed medication schedule, receive helpful persistent reminders across Windows and Android, and keep a simple record of your daily doses.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-sm shadow-bloom transition-all hover:scale-105"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
          >
            Explore Features
          </Link>
        </motion.div>

        {/* ANIMATED HERO DEMONSTRATION ORGANIZER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-8 max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Ambient inner gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-mint/30 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Organizer Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-emerald text-white flex items-center justify-center shadow-bloom">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Today's Medication Organizer
                  </h3>
                  <p className="text-xs text-slate-400">
                    Asia/Kolkata Timezone • Live Daily Routine Preview
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                2 of 3 Completed
              </span>
            </div>

            {/* Sample Routine Cards */}
            <div className="pt-6 space-y-3">
              {/* Card 1 - Taken */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-left shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Metformin Hydrochloride (500 mg)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Take 1 tablet after breakfast with water
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-slate-400">08:30 AM</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                  </span>
                </div>
              </div>

              {/* Card 2 - Due Now */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-brand-emerald shadow-bloom flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-indigo text-white flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Cholecalciferol Vitamin D3 (60,000 IU)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Weekly Sunday dose after meal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-brand-emerald animate-pulse">
                    10:00 AM (Due)
                  </span>
                  <button className="px-3 py-1.5 rounded-xl bg-brand-emerald text-white text-xs font-bold shadow-sm">
                    Mark Taken
                  </button>
                </div>
              </div>

              {/* Card 3 - Upcoming */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-left opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-coral text-white flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Zincovit Multivitamin (10 ml)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Take measuring cup once daily after lunch
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-slate-500">02:00 PM</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CORE VALUE PILLARS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 dark:text-white">
            Designed for genuine adherence, built for everyday ease.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything you need to organize your routine without fake timers or clinical overreach.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 text-brand-emerald flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Persistent Scheduling Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              MongoDB-backed schedule recurrence supporting daily, specific weekdays, and custom intervals in your exact local timezone (Asia/Kolkata).
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Web Push & Installable PWA
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard VAPID-authenticated push notification engine with atomic worker claiming, honest delivery limitations, and offline cache support.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Refill & Inventory Tracker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatic stock deduction only when you explicitly confirm taking a dose. Visual remaining supply bars and proactive low-stock warnings.
            </p>
          </div>
        </div>
      </section>

      {/* CRITICAL HEALTHCARE BOUNDARY BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-6 md:p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 text-left">
            <h4 className="font-heading font-bold text-base text-amber-950 dark:text-amber-200">
              Essential Healthcare Boundary
            </h4>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              DOSEBLOOM is a <strong>reminder and self-reporting companion</strong>. It does not prescribe medications, recommend dosages, diagnose health conditions, or automatically alter treatment plans. All schedules and doses are entered and confirmed directly by you based on instructions from your qualified healthcare professional.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-slate-900 dark:text-white">
          Ready for a healthier, stress-free routine?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Join DOSEBLOOM today to organize your medication schedule and stay consistently on track.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-sm shadow-bloom transition-all hover:scale-105"
        >
          Create Your Free Account <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
