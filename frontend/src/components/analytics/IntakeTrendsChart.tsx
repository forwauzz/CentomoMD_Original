import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

export const IntakeTrendsChart: React.FC = () => {
  const { t, language } = useI18n();

  const data = useMemo(() => {
    const allCases = getAllAssignments();
    const trendsByDate: Record<string, number> = {};

    allCases.forEach((case_) => {
      const date = new Date(case_.assignedAt);
      const dateKey = date.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
        month: 'short',
        day: 'numeric',
      });
      trendsByDate[dateKey] = (trendsByDate[dateKey] || 0) + 1;
    });

    // Sort by date and get last 14 days
    const sortedEntries = Object.entries(trendsByDate)
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14);

    return sortedEntries.map(([date, count]) => ({
      date,
      [t('language') === 'fr' ? 'Cas' : 'Cases']: count,
    }));
  }, [t, language]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">{t('language') === 'fr' ? 'Aucune donnée disponible' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={t('language') === 'fr' ? 'Cas' : 'Cases'} 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

