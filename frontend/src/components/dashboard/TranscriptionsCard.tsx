import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Brain, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';

export const TranscriptionsCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Mock data - in real app this would come from API
  const stats = {
    total: 156,
    thisMonth: 23,
    accuracy: '98.5%',
  };

  const handleViewTranscriptions = () => {
    navigate(ROUTES.DICTATION);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('aiTranscriptions')}
          </CardTitle>
          <div className="p-2 bg-purple-50 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
            <span className="text-sm text-gray-500">transcriptions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mic className="h-4 w-4 text-purple-500" />
            <span>Précision: {stats.accuracy}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{stats.thisMonth} ce mois-ci</span>
        </div>
        <Button 
          onClick={handleViewTranscriptions}
          variant="outline"
          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          {t('viewTranscriptions')}
        </Button>
      </CardContent>
    </Card>
  );
};
