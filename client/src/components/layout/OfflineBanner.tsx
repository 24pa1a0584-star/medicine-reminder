import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500 text-amber-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-50 relative"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            <strong>Offline Mode:</strong> Internet connection lost. You can view cached schedules, but dose updates will sync once reconnected.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
