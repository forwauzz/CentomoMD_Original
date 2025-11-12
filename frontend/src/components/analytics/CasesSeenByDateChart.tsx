import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllCalendarEvents } from '@/utils/calendarUtils';
import { useI18n } from '@/lib/i18n';

export const CasesSeenByDateChart: React.FC = () => {
  const { t, language } = useI18n();

  const data = useMemo(() => {
    const allEvents = getAllCalendarEvents();
    const casesByDate: Record<string, number> = {};

    allEvents
      .filter((e) => e.status === 'completed')
      .forEach((event) => {
        const dateKey = event.date;
        casesByDate[dateKey] = (casesByDate[dateKey] || 0) + 1;
      });

    // Get last 30 days
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates.map((date) => ({
      date: new Date(date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
        month: 'short',
        day: 'numeric',
      }),
      [t('language') === 'fr' ? 'Cas vus' : 'Cases Seen']: casesByDate[date] || 0,
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
          dataKey={t('language') === 'fr' ? 'Cas vus' : 'Cases Seen'}
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

