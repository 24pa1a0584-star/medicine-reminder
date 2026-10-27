import React from 'react';
import { Lock, Shield, Eye, Download, Trash2, Key } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 text-slate-700 dark:text-slate-300">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
          Privacy Policy & Data Protection
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last Updated: October 2026 • Compliant with Indian Digital Personal Data Protection (DPDP) Act Principles
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6 text-xs sm:text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-emerald" /> 1. Data Minimization
          </h2>
          <p>
            DOSEBLOOM collects only the minimum personal data required to operate persistent medication reminders: your name, email address, timezone, entered medications, schedules, and self-reported dose confirmations. We never collect clinical electronic medical records, insurance claims, or unnecessary biometric identifiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-indigo" /> 2. Security & Encryption
          </h2>
          <p>
            All network communication is strictly encrypted in transit using HTTPS (TLS 1.3). Passwords are cryptographically salted and hashed using bcrypt (cost factor 12). Web Push subscriptions are authenticated through public-key cryptography (VAPID) and stored with restricted database access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-coral" /> 3. Lock-Screen Notification Privacy
          </h2>
          <p>
            By default, DOSEBLOOM enables Lock Screen Privacy. Pushed notifications display a discreet generic message (<em>"You have a scheduled reminder"</em>) rather than broadcasting sensitive medication names or strengths to onlookers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-emerald" /> 4. Right to Data Portability
          </h2>
          <p>
            You have the right to download a complete, portable copy of all your records, medicines, schedules, and historical dose actions at any time via Settings &rarr; Export My Data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500" /> 5. Right to Erasure (Account Deletion)
          </h2>
          <p>
            You can delete your DOSEBLOOM account at any time. Account deletion immediately purges all associated medication entries, schedule configurations, dose occurrences, and refill transactions from our MongoDB database permanently.
          </p>
        </section>
      </div>
    </div>
  );
};
