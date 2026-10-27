import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sumRes, trRes, distRes] = await Promise.all([
        apiClient.analytics.getSummary(),
        apiClient.analytics.getWeeklyTrends(),
        apiClient.analytics.getTimeDistribution(),
      ]);
      setSummary(sumRes.data);
      setTrends(trRes.data.weeklyTrends);
      setDistribution(distRes.data.distribution);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-white">
          Routine Consistency Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Review your self-reported medication habit trends, adherence scores, and time-of-day distribution.
        </p>
      </div>

      <AnalyticsDashboard
        summary={summary}
        trends={trends}
        distribution={distribution}
      />
    </div>
  );
};
