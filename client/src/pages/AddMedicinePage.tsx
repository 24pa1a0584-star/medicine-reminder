import React from 'react';
import { AddMedicineWizard } from '../components/medicines/AddMedicineWizard';

export const AddMedicinePage: React.FC = () => {
  return (
    <div className="py-4 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Add New Medication
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Follow the 5 simple steps to set up your prescribed schedule and reminder preferences.
        </p>
      </div>

      <AddMedicineWizard />
    </div>
  );
};
