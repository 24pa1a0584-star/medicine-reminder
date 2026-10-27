import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { urlBase64ToUint8Array } from '../../utils/push';
import {
  Bell,
  BellRing,
  Smartphone,
  Laptop,
  Send,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const NotificationManager: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDevicesAndLogs = async () => {
    try {
      const [devRes, logRes] = await Promise.all([
        apiClient.notifications.listDevices(),
        apiClient.notifications.getLogs(),
      ]);
      setDevices(devRes.data.devices);
      setLogs(logRes.data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDevicesAndLogs();
  }, []);

  const handleEnablePush = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatusMsg({
          type: 'error',
          text: 'Push notifications are not supported on this browser or environment.',
        });
        return;
      }

      // Request permission explicitly
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setStatusMsg({
          type: 'error',
          text: 'Notification permission was denied. You can re-enable it in your browser settings.',
        });
        return;
      }

      // Register / retrieve service worker
      const registration = await navigator.serviceWorker.ready;

      // Fetch server VAPID key
      const keyRes = await apiClient.notifications.getVapidKey();
      const vapidKey = keyRes.data.publicKey;

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });

      // Save to backend
      const deviceIdentifier = navigator.userAgent.includes('Android')
        ? 'Android Mobile'
        : navigator.userAgent.includes('Windows')
        ? 'Windows Desktop'
        : 'Web Browser';

      await apiClient.notifications.subscribe(subscription, deviceIdentifier);

      setStatusMsg({
        type: 'success',
        text: 'This device is now registered to receive scheduled medication reminders!',
      });
      fetchDevicesAndLogs();
    } catch (err: any) {
      console.error('Push registration error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.error?.message || err.message || 'Failed to enable push notifications',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await apiClient.notifications.sendTest();
      setStatusMsg({
        type: 'success',
        text: `Test notification sent! Dispatched to ${res.data.result.sent} active device(s).`,
      });
      fetchDevicesAndLogs();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to send test push' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSweep = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await apiClient.notifications.demoSweep();
      const { claimed, delivered, failed } = res.data.sweepResult;
      setStatusMsg({
        type: 'success',
        text: `Demo Sweep Executed! Claimed: ${claimed}, Delivered: ${delivered}, Failed/Retrying: ${failed}. Check today's routine timeline.`,
      });
      fetchDevicesAndLogs();
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to run demo sweep' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (enabled: boolean) => {
    if (!user) return;
    try {
      const res = await apiClient.auth.updateProfile({
        notificationPreferences: {
          ...user.notificationPreferences,
          lockScreenPrivacy: enabled,
        },
      });
      updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Main Push Activation Card */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-indigo flex items-center justify-center text-white shrink-0 shadow-bloom">
            <BellRing className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                Browser Medication Reminders
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {permission === 'granted' ? 'ACTIVE' : 'PERMISSION NEEDED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Receive timely push reminders for your prescribed medicines even when this tab is in the background. DOSEBLOOM uses the standard Web Push API with VAPID authentication.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 w-full sm:w-auto">
          {permission !== 'granted' ? (
            <button
              onClick={handleEnablePush}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white text-xs font-bold shadow-bloom transition-all disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              Enable Reminders on this Device
            </button>
          ) : (
            <button
              onClick={handleSendTest}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Send Test Notification
            </button>
          )}

          {/* Academic Demonstration Mode Button */}
          <button
            onClick={handleDemoSweep}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-brand-indigo hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
            title="Immediately scans and dispatches any due reminders for demonstration without waiting 24 hours"
          >
            <Zap className="w-3.5 h-3.5" />
            Sweep Reminders Now (Demo)
          </button>
        </div>
      </div>

      {/* Privacy on Lock Screen Setting */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Lock Screen Notification Privacy
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              When enabled, notifications will read <em>"You have a scheduled reminder"</em> instead of displaying the medicine name and dosage on public lock screens.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={user?.notificationPreferences?.lockScreenPrivacy ?? true}
            onChange={(e) => handleTogglePrivacy(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-emerald"></div>
        </label>
      </div>

      {/* Connected Devices Grid */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Active Push Notification Devices
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Devices currently registered to receive reminder dispatches for this account.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {devices.length > 0 ? (
            devices.map((dev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3"
              >
                <div className="p-2.5 rounded-xl bg-brand-indigo/10 text-brand-indigo">
                  {dev.deviceIdentifier?.includes('Mobile') || dev.deviceIdentifier?.includes('Android') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {dev.deviceIdentifier}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Last active: {new Date(dev.lastUsedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              No registered devices yet. Click "Enable Reminders" above on Windows or Android.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
