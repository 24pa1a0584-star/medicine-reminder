import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 text-slate-700 dark:text-slate-300">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
          Terms of Service & Healthcare Disclaimer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Clear Boundaries for Safe Medication Organization
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* Prominent Disclaimer Callout */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>NON-NEGOTIABLE MEDICAL DISCLAIMER</span>
          </div>
          <p>
            DOSEBLOOM is strictly a <strong>reminder scheduling and self-reporting application</strong>. It is NOT a doctor, pharmacist, clinical diagnostic system, or automated medical decision-making tool.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>DOSEBLOOM does NOT prescribe medications.</li>
            <li>DOSEBLOOM does NOT recommend dosages or clinical changes to treatments.</li>
            <li>DOSEBLOOM does NOT automatically compensate for missed doses by doubling future doses.</li>
            <li>DOSEBLOOM is NOT an emergency life-support alerting device.</li>
          </ul>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-emerald" /> 1. User Responsibilities
          </h2>
          <p>
            All medication names, strengths, dosages, routes, and recurrence intervals must be entered or confirmed by the user based strictly on the user's authentic prescription and qualified medical instructions. The user is solely responsible for ensuring entered information is accurate and matches clinical guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-coral" /> 2. Safe Missed Dose Policy
          </h2>
          <p>
            If you realize you have missed a dose or are unsure what steps to take, DOSEBLOOM strongly advises you to consult your printed prescription instructions or immediately contact your pharmacist, physician, or local emergency health provider. Never take two doses simultaneously unless explicitly instructed by your physician.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-indigo" /> 3. Reminder Reliability Limitations
          </h2>
          <p>
            Push notification delivery depends on device operating system battery optimizations, browser background sleep policies, and active internet connectivity. DOSEBLOOM does not guarantee delivery under all conditions (such as device power-off, airplane mode, or network outages).
          </p>
        </section>
      </div>
    </div>
  );
};
