import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { useUIStore } from '@/stores/uiStore';

export const DictationPage: React.FC = () => {
  const { t } = useI18n();
  const { language } = useUIStore();
  const [sessionId, setSessionId] = useState<string | undefined>();

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
      
      {/* Use the existing TranscriptionInterface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TranscriptionInterface
          sessionId={sessionId}
          onSessionUpdate={handleSessionUpdate}
          language={language}
        />
      </div>
    </div>
  );
};
