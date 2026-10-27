import React from 'react';
import { CaregiverPortal } from '../components/caregivers/CaregiverPortal';

export const CaregiversPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Caregiver & Family Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Share your medication schedule securely with trusted loved ones and caregivers.
        </p>
      </div>

      <CaregiverPortal />
    </div>
  );
};
