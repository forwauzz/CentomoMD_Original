import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllCalendarEvents } from '@/utils/calendarUtils';
import { useI18n } from '@/lib/i18n';

// Mock doctor names - in production, this would come from API
const MOCK_DOCTORS: Record<string, string> = {
  'doctor-1': 'Dr. Harry Durusso',
  'doctor-2': 'Dr. Marie Dubois',
  'doctor-3': 'Dr. Jean Tremblay',
};

export const CasesSeenByDoctorChart: React.FC = () => {
  const { t } = useI18n();

  const data = useMemo(() => {
    const allEvents = getAllCalendarEvents();
    const doctorStats: Record<string, { scheduled: number; completed: number }> = {};

    allEvents.forEach((event) => {
      if (!doctorStats[event.doctorId]) {
        doctorStats[event.doctorId] = { scheduled: 0, completed: 0 };
      }

      if (event.status === 'scheduled') {
        doctorStats[event.doctorId].scheduled++;
      } else if (event.status === 'completed') {
        doctorStats[event.doctorId].completed++;
      }
    });

    return Object.entries(doctorStats).map(([doctorId, stats]) => ({
      doctor: MOCK_DOCTORS[doctorId] || (t('language') === 'fr' ? 'Médecin inconnu' : 'Unknown Doctor'),
      [t('language') === 'fr' ? 'Planifiés' : 'Scheduled']: stats.scheduled,
      [t('language') === 'fr' ? 'Complétés' : 'Completed']: stats.completed,
      [t('language') === 'fr' ? 'Total' : 'Total']: stats.scheduled + stats.completed,
    }));
  }, [t]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">{t('language') === 'fr' ? 'Aucune donnée disponible' : 'No data available'}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="doctor" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={t('language') === 'fr' ? 'Planifiés' : 'Scheduled'} fill="#3b82f6" />
        <Bar dataKey={t('language') === 'fr' ? 'Complétés' : 'Completed'} fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  );
};

