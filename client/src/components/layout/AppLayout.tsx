import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <OfflineBanner />
      <Navbar />

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {isAuthenticated && <Sidebar />}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isAuthenticated ? 'pb-24 lg:pb-8' : ''} max-w-full overflow-x-hidden`}>
          <Outlet />
        </main>
      </div>

      {isAuthenticated && <BottomNav />}
    </div>
  );
};
