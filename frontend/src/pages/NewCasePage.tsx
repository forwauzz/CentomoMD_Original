import React from 'react';
import { useI18n } from '@/lib/i18n';

export const NewCasePage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('newCase')}
        </h1>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <p className="text-lg text-gray-600">
          Nouveau dossier CNESST - Page en cours de développement
        </p>
        <p className="text-gray-500 mt-2">
          Cette page contiendra le workspace avec la navigation secondaire et les formulaires de sections.
        </p>
      </div>
    </div>
  );
};
