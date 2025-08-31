import React from 'react';
import { useI18n } from '@/lib/i18n';
import { DashboardCards } from '@/components/dashboard/DashboardCards';

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('dashboard')}
        </h1>
      </div>
      
      <DashboardCards />
    </div>
  );
};
