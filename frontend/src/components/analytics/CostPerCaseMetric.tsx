import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { DollarSign } from 'lucide-react';

// Mock cost per case - in production, this would come from API
const COST_PER_CASE = 150; // CAD
const REVENUE_PER_CASE = 450; // CAD

export const CostPerCaseMetric: React.FC = () => {
  const { t } = useI18n();

  const { averageCost, averageRevenue, totalCases, totalCost, totalRevenue, totalProfit } = useMemo(() => {
    const allCases = getAllAssignments();
    const submittedCases = allCases.filter((case_) => case_.status === 'submitted');

    return {
      averageCost: COST_PER_CASE,
      averageRevenue: REVENUE_PER_CASE,
      totalCases: submittedCases.length,
      totalCost: submittedCases.length * COST_PER_CASE,
      totalRevenue: submittedCases.length * REVENUE_PER_CASE,
      totalProfit: submittedCases.length * (REVENUE_PER_CASE - COST_PER_CASE),
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${averageCost.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('language') === 'fr' ? 'Coût moyen par cas' : 'Avg Cost per Case'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${averageRevenue.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('language') === 'fr' ? 'Revenu moyen par cas' : 'Avg Revenue per Case'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(averageRevenue - averageCost).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">
                  {t('language') === 'fr' ? 'Profit moyen par cas' : 'Avg Profit per Case'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            {t('language') === 'fr' ? 'Total des cas soumis' : 'Total Submitted Cases'}
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCases}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            {t('language') === 'fr' ? 'Coût total' : 'Total Cost'}
          </div>
          <div className="text-2xl font-bold text-red-600">${totalCost.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">
            {t('language') === 'fr' ? 'Revenu total' : 'Total Revenue'}
          </div>
          <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-gray-600 mb-1">
          {t('language') === 'fr' ? 'Profit total' : 'Total Profit'}
        </div>
        <div className="text-3xl font-bold text-blue-600">${totalProfit.toLocaleString()}</div>
      </div>
    </div>
  );
};

