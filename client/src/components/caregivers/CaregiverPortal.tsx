import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { ICaregiverInvitation, ICaregiverPermission } from '../../types';
import {
  HeartHandshake,
  UserPlus,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Eye,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CaregiverPortal: React.FC = () => {
  const [invitations, setInvitations] = useState<ICaregiverInvitation[]>([]);
  const [caregivers, setCaregivers] = useState<ICaregiverPermission[]>([]);
  const [lovedOnes, setLovedOnes] = useState<ICaregiverPermission[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite Form State
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState({
    viewSchedule: true,
    viewActivity: true,
    receiveAlerts: false,
    manageSchedule: false,
  });
  const [generatedInvite, setGeneratedInvite] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [invRes, cgRes, loRes] = await Promise.all([
        apiClient.caregivers.listSent(),
        apiClient.caregivers.listCaregivers(),
        apiClient.caregivers.listLovedOnes(),
      ]);
      setInvitations(invRes.data.invitations);
      setCaregivers(cgRes.data.caregivers);
      setLovedOnes(loRes.data.lovedOnes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      const res = await apiClient.caregivers.invite({
        caregiverEmail: email.trim(),
        permissions,
      });
      setGeneratedInvite(res.data.invitation);
      setEmail('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInvite) return;
    const fullUrl = `${window.location.origin}${generatedInvite.inviteLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (caregiverUserId: string) => {
    if (!confirm('Are you sure you want to revoke caregiver access for this user?')) return;
    try {
      await apiClient.caregivers.revoke(caregiverUserId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-brand-indigo/10 text-brand-indigo shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Family & Caregiver Support
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
              Explicit, opt-in caregiver sharing. Authorize a trusted family member or caregiver to monitor your daily medication routine with granular permissions.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setGeneratedInvite(null);
            setInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white text-xs font-bold shadow-bloom transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite Caregiver
        </button>
      </div>

      {/* Loved Ones Who Shared with You (Caregiver View) */}
      {lovedOnes.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-indigo" />
            <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
              Loved Ones You Care For ({lovedOnes.length})
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lovedOnes.map((lo) => {
              const primary = typeof lo.primaryUserId === 'object' ? (lo.primaryUserId as any) : null;
              return (
                <div
                  key={lo._id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {primary?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {primary?.email} • Time Zone: {primary?.timeZone}
                    </p>
                  </div>

                  <Link
                    to={`/caregiver/loved-one/${primary?._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/20 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Routine
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Authorized Caregivers Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Active Authorized Caregivers
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Users currently permitted to view or assist with your medication routine.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase tracking-wider text-[10px] text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Caregiver</th>
                <th className="py-2.5 px-4">Permissions</th>
                <th className="py-2.5 px-4">Authorized Since</th>
                <th className="py-2.5 px-4 text-right">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {caregivers.length > 0 ? (
                caregivers.map((cg) => {
                  const caregiverUser = typeof cg.caregiverUserId === 'object' ? (cg.caregiverUserId as any) : null;
                  return (
                    <tr key={cg._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {caregiverUser?.name} ({caregiverUser?.email})
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {cg.permissions.viewSchedule && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                              View Schedule
                            </span>
                          )}
                          {cg.permissions.viewActivity && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400">
                              View Activity
                            </span>
                          )}
                          {cg.permissions.receiveAlerts && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              Alerts
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(cg.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRevoke(caregiverUser?._id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Revoke caregiver access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic">
                    No active caregivers. Click "Invite Caregiver" to authorize a loved one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sent Invitations List */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white">
          Pending Invitations Sent
        </h4>

        <div className="space-y-2">
          {invitations.length > 0 ? (
            invitations.map((inv) => (
              <div
                key={inv._id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {inv.caregiverEmail}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Expires on {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    inv.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inv.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No invitations sent yet.</p>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Invite a Trusted Caregiver
            </h4>

            {!generatedInvite ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Caregiver Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="family.member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-emerald"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Authorized Permissions
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.viewSchedule}
                      onChange={(e) => setPermissions({ ...permissions, viewSchedule: e.target.checked })}
                      className="rounded text-brand-emerald"
                    />
                    View medication schedule & timing
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.viewActivity}
                      onChange={(e) => setPermissions({ ...permissions, viewActivity: e.target.checked })}
                      className="rounded text-brand-emerald"
                    />
                    View daily dose confirmation activity
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.receiveAlerts}
                      onChange={(e) => setPermissions({ ...permissions, receiveAlerts: e.target.checked })}
                      className="rounded text-brand-emerald"
                    />
                    Receive alerts when a reminder remains unconfirmed
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="px-5 py-2 rounded-xl bg-brand-emerald text-white text-xs font-bold hover:bg-brand-emeraldDark disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold">Invitation Created!</p>
                  <p className="mt-1">
                    Share this secure, time-limited link with <strong>{generatedInvite.caregiverEmail}</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[11px] break-all border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  {window.location.origin}{generatedInvite.inviteLink}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Link Copied!' : 'Copy Invite Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
