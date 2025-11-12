import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { Clock } from 'lucide-react';

export const CompletionTimeMetric: React.FC = () => {
  const { t } = useI18n();

  const { averageDays, totalCases } = useMemo(() => {
    const allCases = getAllAssignments();
    const completedCases = allCases.filter(
      (case_) => case_.status === 'submitted' && case_.assignedAt && case_.submittedAt
    );

    if (completedCases.length === 0) {
      return { averageDays: 0, totalCases: 0 };
    }

    const totalDays = completedCases.reduce((sum, case_) => {
      const assignedDate = new Date(case_.assignedAt);
      const submittedDate = new Date(case_.submittedAt!);
      const days = Math.ceil((submittedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return {
      averageDays: Math.round(totalDays / completedCases.length),
      totalCases: completedCases.length,
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <Clock className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">{averageDays}</div>
          <div className="text-sm text-gray-600">
            {t('language') === 'fr' ? 'jours en moyenne' : 'days on average'}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {t('language') === 'fr'
          ? `Basé sur ${totalCases} cas soumis`
          : `Based on ${totalCases} submitted cases`}
      </div>
    </div>
  );
};

