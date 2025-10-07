import React from 'react';
// import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export const FormsCompletedCard: React.FC = () => {
  // const navigate = useNavigate();
  const { t } = useI18n();

  // Mock data - in real app this would come from API
  const stats = {
    completed: 24,
    thisMonth: 8,
    trend: '+12%',
  };

  const handleShowStatistics = () => {
    // TODO: Navigate to statistics page when implemented
    console.log('Show statistics clicked');
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('formsCompleted')}
          </CardTitle>
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.completed}</span>
            <span className="text-sm text-gray-500">{t('formsCompletedTotal')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>{stats.trend} {t('formsCompletedThisMonth')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <BarChart3 className="h-3 w-3" />
          <span>{stats.thisMonth} {t('formsCompletedCount')}</span>
        </div>
        <Button 
          onClick={handleShowStatistics}
          variant="outline"
          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {t('showStatistics')}
        </Button>
      </CardContent>
    </Card>
  );
};
