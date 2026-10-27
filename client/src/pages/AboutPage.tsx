import React from 'react';
import { Heart, Compass, ShieldCheck, MapPin, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-slate-900 dark:text-white">
          About DOSEBLOOM
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A little reminder. A healthier routine.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
          Our Mission
        </h2>
        <p>
          Adhering to a prescribed medication routine is one of the most critical aspects of personal wellness, yet millions of individuals face daily challenges organizing multiple prescriptions, changing schedules, and refill logistics.
        </p>
        <p>
          DOSEBLOOM was created to eliminate organizational friction. Designed with vibrant, uplifting aesthetics and robust full-stack engineering, DOSEBLOOM makes it simple to configure schedules, receive dependable reminders, and review personal dose history without clinical ambiguity.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
            <div>
              <h4 className="font-heading font-bold text-slate-900 dark:text-white">
                Primary Market: India
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Default time zone anchored in Asia/Kolkata (IST), supporting standard formulations and Indian data protection practices under the Digital Personal Data Protection Act.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-indigo shrink-0 mt-0.5" />
            <div>
              <h4 className="font-heading font-bold text-slate-900 dark:text-white">
                Strict Healthcare Boundaries
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                We never prescribe, diagnose, suggest dosages, or automatically modify entered treatment regimens. Users always enter instructions confirmed with qualified medical professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
