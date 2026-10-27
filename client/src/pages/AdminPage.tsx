import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import {
  ShieldAlert,
  Server,
  Activity,
  Zap,
  Users,
  Pill,
  Send,
  Database,
  RotateCw,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [hRes, mRes, aRes] = await Promise.all([
        apiClient.admin.getHealth(),
        apiClient.admin.getMetrics(),
        apiClient.admin.getAuditLogs(),
      ]);
      setHealth(hRes.data);
      setMetrics(mRes.data.metrics);
      setAuditLogs(aRes.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleManualSweep = async () => {
    try {
      const res = await apiClient.admin.triggerSweep();
      setSweepResult(res.data.sweepResult);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
              System Administration
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              OPERATIONAL HEALTH
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Operational service telemetry, background scheduler state, and privacy-preserving metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Refresh metrics"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleManualSweep}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-heading font-bold text-xs shadow-md transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Trigger Worker Sweep
          </button>
        </div>
      </div>

      {sweepResult && (
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center justify-between">
          <span>
            <strong>Manual Sweep Result:</strong> Claimed {sweepResult.claimed} job(s), Delivered {sweepResult.delivered}, Failed {sweepResult.failed}.
          </span>
          <button onClick={() => setSweepResult(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Service Health Cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-emerald" /> Node Uptime
            </span>
            <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              {Math.floor(health.uptimeSeconds / 60)} min
            </p>
            <p className="text-[11px] text-slate-400">Node {health.nodeVersion}</p>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-brand-indigo" /> MongoDB Database
            </span>
            <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white capitalize">
              {health.database?.status}
            </p>
            <p className="text-[11px] text-slate-400">{health.database?.name}</p>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" /> Reminder Worker
            </span>
            <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              {health.worker?.running ? 'Running' : 'Idle'}
            </p>
            <p className="text-[11px] text-slate-400">
              Poll interval: {health.worker?.pollIntervalMs / 1000}s
            </p>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-brand-coral" /> Memory (RSS)
            </span>
            <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              {health.memory?.rssMB} MB
            </p>
            <p className="text-[11px] text-slate-400">Heap Used: {health.memory?.heapUsedMB} MB</p>
          </div>
        </div>
      )}

      {/* Aggregate Metrics Grid */}
      {metrics && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Aggregate System Metrics
              </h3>
              <p className="text-xs text-slate-400">
                Privacy-preserving counts across the platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-brand-emerald">
                {metrics.totalUsers}
              </span>
              <span className="text-[11px] text-slate-400">Active Users</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-brand-indigo">
                {metrics.totalActiveMedicines}
              </span>
              <span className="text-[11px] text-slate-400">Active Medicines</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-slate-900 dark:text-white">
                {metrics.totalDoseOccurrences}
              </span>
              <span className="text-[11px] text-slate-400">Total Doses</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-emerald-600">
                {metrics.successfulDeliveries}
              </span>
              <span className="text-[11px] text-slate-400">Sent Pushes</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-rose-500">
                {metrics.failedDeliveries}
              </span>
              <span className="text-[11px] text-slate-400">Failed / Cleaned</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
              <span className="block text-2xl font-heading font-bold text-purple-600">
                {metrics.pendingJobs}
              </span>
              <span className="text-[11px] text-slate-400">Queued Jobs</span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          System Security & Audit Trail
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-wider text-[10px] text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Resource ID</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 font-mono text-[11px]">
                    <td className="py-2.5 px-4 font-bold text-brand-indigo">{log.action}</td>
                    <td className="py-2.5 px-4">{log.resource}</td>
                    <td className="py-2.5 px-4 text-slate-400">{log.resourceId || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic font-sans">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
