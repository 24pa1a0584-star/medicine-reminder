import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timeZone, setTimeZone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch (e) {
      return 'Asia/Kolkata';
    }
  });
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (!disclaimerAgreed) {
      setErrorMsg('You must acknowledge the healthcare disclaimer to proceed.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        timeZone,
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.response?.data?.error?.message ||
          'Registration failed. This email may already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-indigo text-white flex items-center justify-center mx-auto shadow-bloom p-2.5">
          <img src="/icons/logo.svg" alt="DOSEBLOOM" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Create an Account
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Start organizing your prescribed medication routine in minutes.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password * (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Time Zone
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST - India)</option>
              <option value="UTC">UTC (Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>

          {/* Medical Disclaimer Checkbox */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="disclaimer"
              checked={disclaimerAgreed}
              onChange={(e) => setDisclaimerAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
            />
            <label htmlFor="disclaimer" className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug cursor-pointer">
              I understand that <strong>DOSEBLOOM is a reminder companion, not a doctor or pharmacist</strong>. I am solely responsible for entering medications and doses according to my official doctor’s instructions.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !disclaimerAgreed}
            className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs sm:text-sm shadow-bloom transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="text-brand-emerald font-bold hover:underline">
          Sign In here
        </Link>
      </p>
    </div>
  );
};
