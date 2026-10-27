import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isPublicPage = ['/', '/features', '/about', '/privacy', '/terms'].includes(location.pathname);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-indigo flex items-center justify-center p-2 shadow-bloom transition-transform group-hover:scale-105 duration-200">
            <img src="/icons/logo.svg" alt="DOSEBLOOM Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                DOSE<span className="text-brand-emerald">BLOOM</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              A little reminder. A healthier routine.
            </p>
          </div>
        </Link>

        {/* Public Navigation Links */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link to="/features" className="hover:text-brand-emerald transition-colors">
              Features
            </Link>
            <Link to="/about" className="hover:text-brand-emerald transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-brand-emerald transition-colors">
              Privacy & Security
            </Link>
            <Link to="/terms" className="hover:text-brand-emerald transition-colors">
              Safety Boundaries
            </Link>
          </nav>
        )}

        {/* Right Action Icons & Auth Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {isAuthenticated ? (
            <>
              {/* Add Medicine Quick Link (Desktop) */}
              <Link
                to="/medicines/new"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald/20 text-xs font-semibold transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Add Medicine
              </Link>

              {/* Notification Center Link */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                title="Notifications & Settings"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-emerald" />
              </Link>

              {/* User Avatar Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-emerald to-brand-indigo text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold hidden md:inline text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl glass-card py-2 shadow-2xl z-50 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user?.email}
                        </p>
                        <span className="mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          {user?.role === 'admin' ? 'System Administrator' : 'Primary User'}
                        </span>
                      </div>

                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      >
                        <User className="w-4 h-4 text-brand-indigo" />
                        Account & Privacy Settings
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        >
                          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          System Health & Logs
                        </Link>
                      )}

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-emerald transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-brand-emerald hover:bg-brand-emeraldDark text-white text-xs font-semibold shadow-bloom transition-all hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger for public nav */}
          {!isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <Link
            to="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            Features
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            About
          </Link>
          <Link
            to="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            Privacy & Security
          </Link>
          <Link
            to="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            Safety Boundaries
          </Link>
        </div>
      )}
    </header>
  );
};
