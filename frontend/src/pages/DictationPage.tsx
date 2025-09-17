import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { useUIStore } from '@/stores/uiStore';
import { Mic, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DictationPage: React.FC = () => {
  const { t } = useI18n();
  const { language } = useUIStore();
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('dictation')}
        </h1>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'live' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('live')}
          className="flex items-center gap-2"
        >
          <Mic className="h-4 w-4" />
          {t('live')}
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          {t('history')}
        </Button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'live' ? (
        /* Live Tab - Use the existing TranscriptionInterface unchanged */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <TranscriptionInterface
            sessionId={sessionId}
            onSessionUpdate={handleSessionUpdate}
            language={language}
          />
        </div>
      ) : (
        /* History Tab - Stub implementation */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              {t('dictationHistory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('historyComingSoon')}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t('historyDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
