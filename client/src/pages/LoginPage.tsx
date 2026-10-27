import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-indigo text-white flex items-center justify-center mx-auto shadow-bloom p-2.5">
          <img src="/icons/logo.svg" alt="DOSEBLOOM" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign in to access your daily medication routine.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
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
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-emerald"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark active:scale-95 text-white font-heading font-bold text-xs sm:text-sm shadow-bloom transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Demo Accounts for Faculty Presentation */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Faculty Demo Quick Login
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('priya@dosebloom.app', 'DemoPass123!')}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-brand-emerald text-xs font-semibold text-left border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="block font-bold">Priya Sharma</span>
                <span className="text-[10px] text-slate-400">Demo User</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('admin@dosebloom.app', 'AdminPass123!')}
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-xs font-semibold text-left border border-purple-200 dark:border-purple-800/50 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="block font-bold">System Admin</span>
                <span className="text-[10px] text-slate-400">Audit & Ops</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Don't have an account yet?{' '}
        <Link to="/register" className="text-brand-emerald font-bold hover:underline">
          Create one now
        </Link>
      </p>
    </div>
  );
};
