import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { IInventoryRecord, IRefillTransaction } from '../types';
import { RefillTrackerView } from '../components/refills/RefillTrackerView';

export const RefillsPage: React.FC = () => {
  const [inventories, setInventories] = useState<IInventoryRecord[]>([]);
  const [transactions, setTransactions] = useState<IRefillTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [invRes, txRes] = await Promise.all([
        apiClient.inventory.get(),
        apiClient.inventory.getTransactions(),
      ]);
      setInventories(invRes.data.inventories);
      setTransactions(txRes.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Medicine Refill & Stock Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Monitor your remaining supplies, set low-stock thresholds, and log new purchases.
        </p>
      </div>

      <RefillTrackerView
        inventories={inventories}
        transactions={transactions}
        onRefresh={fetchInventoryData}
      />
    </div>
  );
};
