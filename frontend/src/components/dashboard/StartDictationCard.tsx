import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Play, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';

export const StartDictationCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Mock data - in real app this would come from API
  const stats = {
    avgDuration: '15 min',
    sessionsToday: 3,
  };

  const handleStartDictation = () => {
    navigate(ROUTES.DICTATION);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('startDictation')}
          </CardTitle>
          <div className="p-2 bg-red-50 rounded-lg">
            <Mic className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">
          {t('dictationDescription')}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{t('dictationAvgDuration')}: {stats.avgDuration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            <span>{stats.sessionsToday} {t('dictationSessionsToday')}</span>
          </div>
        </div>
        <Button 
          onClick={handleStartDictation}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          <Mic className="h-4 w-4 mr-2" />
          {t('startDictation')}
        </Button>
      </CardContent>
    </Card>
  );
};
