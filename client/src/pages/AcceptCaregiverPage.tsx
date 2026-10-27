import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { HeartHandshake, CheckCircle2, AlertCircle } from 'lucide-react';

export const AcceptCaregiverPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      await apiClient.caregivers.accept(token);
      setSuccess(true);
      setTimeout(() => navigate('/caregivers'), 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.response?.data?.error?.message ||
          'Failed to accept invitation. The invitation may be invalid, expired, or sent to a different email address.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center mx-auto shadow-sm">
        <HeartHandshake className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white">
          Caregiver Invitation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          You have been invited to support a loved one with their daily medication routine on DOSEBLOOM.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success ? (
        <div className="glass-card rounded-3xl p-8 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-brand-emerald mx-auto animate-bounce" />
          <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
            Invitation Accepted!
          </h3>
          <p className="text-xs text-slate-500">
            Redirecting to your Caregiver portal...
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-5">
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Please sign in to your DOSEBLOOM account to link this caregiver authorization.
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/login?redirect=/caregiver/accept?token=${token}`}
                  className="flex-1 py-2.5 rounded-xl bg-brand-emerald text-white font-bold text-xs shadow-bloom"
                >
                  Log In
                </Link>
                <Link
                  to={`/register?redirect=/caregiver/accept?token=${token}`}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Register
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Logged in as <strong>{user?.email}</strong>.
              </p>
              <button
                onClick={handleAccept}
                disabled={loading || !token}
                className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs sm:text-sm shadow-bloom transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Accept & Connect as Caregiver'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
