import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import {
  User,
  Clock,
  Phone,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [timeZone, setTimeZone] = useState(user?.timeZone || 'Asia/Kolkata');
  const [emergencyContactName, setEmergencyContactName] = useState(
    user?.profile?.emergencyContactName || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user?.profile?.emergencyContactPhone || ''
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await apiClient.auth.updateProfile({
        name: name.trim(),
        timeZone,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      updateUser(res.data.user);
      setStatusMsg({ type: 'success', text: 'Profile preferences updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.error?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMsg(null);
      await apiClient.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setStatusMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error?.message || 'Password update failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.auth.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dosebloom_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Personal data export generated and downloaded.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      setLoading(true);
      await apiClient.auth.deleteAccount();
      await logout();
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Account & Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your profile, time zone, security credentials, and data rights.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Profile & Emergency Contact */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-emerald/10 text-brand-emerald">
            <User className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Profile & Emergency Details
          </h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Time Zone
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - India)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Sharma"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Contact Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs shadow-bloom transition-all disabled:opacity-50"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-indigo/10 text-brand-indigo">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Security & Password
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* DPDP Act Data Portability & Right to Erasure */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-coral/10 text-brand-coral">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Personal Data Rights (DPDP Act India / GDPR)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Data */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-emerald" /> Export All Personal Data
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download a full machine-readable JSON archive of your medicines, schedules, dose action history, and refill logs.
            </p>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Download JSON Export
            </button>
          </div>

          {/* Delete Account */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
            <h4 className="font-heading font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Right to Erasure (Delete Account)
            </h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80">
              Permanently delete your account and wipe all stored medication entries, dose occurrences, and refill history.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-rose-200 dark:border-rose-900 shadow-2xl space-y-4">
            <h4 className="font-heading font-bold text-base text-rose-600">
              Permanent Account Deletion
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action <strong>cannot be undone</strong>. All your scheduled medications, dose confirmations, and inventory transactions will be permanently deleted from the database.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || loading}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40"
              >
                {loading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
