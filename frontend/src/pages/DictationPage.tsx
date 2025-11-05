import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';
import { useUIStore } from '@/stores/uiStore';

export const DictationPage: React.FC = () => {
  const { t } = useI18n();
  const { inputLanguage } = useUIStore();
  const [sessionId, setSessionId] = useState<string | undefined>();

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-slate-700">
          {t('dictation')}
        </h1>
      </div>
      
      {/* Transcription Interface - Direct, no tabs */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
          <TranscriptionInterface
            sessionId={sessionId}
            onSessionUpdate={handleSessionUpdate}
            language={inputLanguage}
          />
        </div>
      </div>
    </div>
  );
};
