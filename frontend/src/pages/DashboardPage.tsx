import React from 'react';
import { useI18n } from '@/lib/i18n';

export const DashboardPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('dashboard')}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {t('startNewCase')}
          </h3>
          <p className="text-gray-600 mb-4">
            Commencer un nouveau dossier CNESST
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + {t('newCase')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {t('formsCompleted')}
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">24</p>
          <p className="text-gray-600 mb-4">
            Ce mois-ci
          </p>
          <button className="text-blue-600 hover:text-blue-700">
            {t('showStatistics')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {t('aiTranscriptions')}
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">156</p>
          <p className="text-gray-600 mb-4">
            Transcriptions générées
          </p>
          <button className="text-blue-600 hover:text-blue-700">
            {t('viewTranscriptions')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {t('patients')}
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">89</p>
          <p className="text-gray-600 mb-4">
            Patients actifs
          </p>
          <button className="text-blue-600 hover:text-blue-700">
            {t('managePatients')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {t('startDictation')}
          </h3>
          <p className="text-gray-600 mb-4">
            Commencer une session de dictée
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {t('startDictation')}
          </button>
        </div>
      </div>
    </div>
  );
};
