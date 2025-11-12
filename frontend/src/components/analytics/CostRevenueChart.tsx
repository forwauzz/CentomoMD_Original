import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

// Mock cost per case - in production, this would come from API
const COST_PER_CASE = 150; // CAD
const REVENUE_PER_CASE = 450; // CAD

// Mock doctor names - in production, this would come from API
const MOCK_DOCTORS: Record<string, string> = {
  'doctor-1': 'Dr. Harry Durusso',
  'doctor-2': 'Dr. Marie Dubois',
  'doctor-3': 'Dr. Jean Tremblay',
};

export const CostRevenueChart: React.FC = () => {
  const { t } = useI18n();

  const data = useMemo(() => {
    const allCases = getAllAssignments();
    const doctorStats: Record<string, { cases: number; cost: number; revenue: number }> = {};

    allCases.forEach((case_) => {
      if (!case_.assignedTo || case_.status !== 'submitted') return;

      const doctorId = case_.assignedTo;
      if (!doctorStats[doctorId]) {
        doctorStats[doctorId] = { cases: 0, cost: 0, revenue: 0 };
      }

      doctorStats[doctorId].cases++;
      doctorStats[doctorId].cost += COST_PER_CASE;
      doctorStats[doctorId].revenue += REVENUE_PER_CASE;
    });

    return Object.entries(doctorStats).map(([doctorId, stats]) => ({
      doctor: MOCK_DOCTORS[doctorId] || (t('language') === 'fr' ? 'Médecin inconnu' : 'Unknown Doctor'),
      [t('language') === 'fr' ? 'Coût' : 'Cost']: stats.cost,
      [t('language') === 'fr' ? 'Revenu' : 'Revenue']: stats.revenue,
      [t('language') === 'fr' ? 'Profit' : 'Profit']: stats.revenue - stats.cost,
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
        <Bar dataKey={t('language') === 'fr' ? 'Coût' : 'Cost'} fill="#ef4444" />
        <Bar dataKey={t('language') === 'fr' ? 'Revenu' : 'Revenue'} fill="#10b981" />
        <Bar dataKey={t('language') === 'fr' ? 'Profit' : 'Profit'} fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
};

