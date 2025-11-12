import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';

const COLORS = {
  pending: '#f59e0b', // amber
  pending_review: '#f59e0b',
  in_progress: '#3b82f6', // blue
  completed: '#10b981', // green
  rejected: '#ef4444', // red
  submitted: '#8b5cf6', // purple
};

export const CaseStatusChart: React.FC = () => {
  const { t } = useI18n();

  const data = useMemo(() => {
    const allCases = getAllAssignments();
    const statusCounts: Record<string, number> = {};

    allCases.forEach((case_) => {
      const status = case_.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const getStatusLabel = (status: string): string => {
      switch (status) {
        case 'pending':
          return t('language') === 'fr' ? 'En attente' : 'Pending';
        case 'pending_review':
          return t('language') === 'fr' ? 'En attente de révision' : 'Pending Review';
        case 'in_progress':
          return t('language') === 'fr' ? 'En cours' : 'In Progress';
        case 'completed':
          return t('language') === 'fr' ? 'Complété' : 'Completed';
        case 'rejected':
          return t('language') === 'fr' ? 'Rejeté' : 'Rejected';
        case 'submitted':
          return t('language') === 'fr' ? 'Soumis' : 'Submitted';
        default:
          return status;
      }
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      status,
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
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

