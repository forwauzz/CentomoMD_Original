import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CaseStatusChart } from '@/components/analytics/CaseStatusChart';
import { CompletionTimeMetric } from '@/components/analytics/CompletionTimeMetric';
import { DoctorPerformanceTable } from '@/components/analytics/DoctorPerformanceTable';
import { IntakeTrendsChart } from '@/components/analytics/IntakeTrendsChart';
import { CostRevenueChart } from '@/components/analytics/CostRevenueChart';
import { CostPerCaseMetric } from '@/components/analytics/CostPerCaseMetric';
import { CasesSeenByDoctorChart } from '@/components/analytics/CasesSeenByDoctorChart';
import { CasesSeenByDateChart } from '@/components/analytics/CasesSeenByDateChart';
import { useI18n } from '@/lib/i18n';
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('analytics')}</h1>
        <p className="text-white/80 mt-1">{t('caseAnalyticsAndInsights')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('doctors')}
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('trends')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('casesByStatus')}</CardTitle>
                <CardDescription>{t('distributionOfCasesByStatus')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CaseStatusChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('averageCompletionTime')}</CardTitle>
                <CardDescription>{t('timeFromCreationToSubmission')}</CardDescription>
              </CardHeader>
              <CardContent>
                <CompletionTimeMetric />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('costAndRevenue')}
              </CardTitle>
              <CardDescription>{t('costRevenueAndProfitMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CostPerCaseMetric />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('doctorPerformance')}</CardTitle>
              <CardDescription>{t('casesCompletedAndAverageTimePerDoctor')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorPerformanceTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('doctorRevenueGeneration')}
              </CardTitle>
              <CardDescription>{t('costRevenueAndProfitByDoctor')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CostRevenueChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('casesSeenByDoctor')}</CardTitle>
              <CardDescription>{t('scheduledAndCompletedCasesPerDoctor')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CasesSeenByDoctorChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('intakeTrends')}</CardTitle>
              <CardDescription>{t('casesPerDayOrWeek')}</CardDescription>
            </CardHeader>
            <CardContent>
              <IntakeTrendsChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('casesSeenByDate')}</CardTitle>
              <CardDescription>{t('completedAppointmentsOverTime')}</CardDescription>
            </CardHeader>
            <CardContent>
              <CasesSeenByDateChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

