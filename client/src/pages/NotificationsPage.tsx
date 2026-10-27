import React from 'react';
import { NotificationManager } from '../components/notifications/NotificationManager';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Notifications & Connected Devices
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage Web Push subscriptions, test reminder alerts, and configure lock-screen privacy.
        </p>
      </div>

      <NotificationManager />
    </div>
  );
};
