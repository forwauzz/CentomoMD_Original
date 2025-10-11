/**
 * Feedback Modal
 * Main modal shell with tabs for Quick Note | Full Case | Review
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedbackStore } from '@/stores/feedbackStore';
import { useFeatureFlags } from '@/lib/featureFlags';
import { FEEDBACK_STRINGS } from '@/types/feedback';
import { QuickNoteForm } from './QuickNoteForm';
import { FullCaseForm } from './FullCaseForm';
import { ReviewTab } from './ReviewTab';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface TranscriptionContext {
  currentTranscript: string;
  mode: string;
  inputLanguage: 'fr' | 'en';
  templateName: string;
  diarization: boolean;
  customVocab: boolean;
  sessionId?: string;
  paragraphs: string[];
  segments: any[];
  orthopedicNarrative?: any;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptionContext?: TranscriptionContext;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  transcriptionContext
}) => {
  const featureFlags = useFeatureFlags();
  const { init } = useFeedbackStore();
  const [activeTab, setActiveTab] = useState('quick-note');

  // Initialize store when modal opens
  useEffect(() => {
    if (isOpen && featureFlags.feedbackModule) {
      init(true);
    }
  }, [isOpen, featureFlags.feedbackModule, init]);

  // Don't render if feature flag is disabled
  if (!featureFlags.feedbackModule) {
    return null;
  }

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-xl font-semibold">
              {strings.modalTitle}
            </CardTitle>
            <SyncStatusIndicator showDetails={true} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
              <TabsTrigger value="quick-note" className="text-sm">
                {strings.quickNote}
              </TabsTrigger>
              <TabsTrigger value="full-case" className="text-sm">
                {strings.fullCase}
              </TabsTrigger>
              <TabsTrigger value="review" className="text-sm">
                {strings.review}
              </TabsTrigger>
            </TabsList>
            
            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="quick-note" className="mt-0">
                <QuickNoteForm onClose={onClose} transcriptionContext={transcriptionContext} />
              </TabsContent>
              
              <TabsContent value="full-case" className="mt-0">
                <FullCaseForm onClose={onClose} transcriptionContext={transcriptionContext} />
              </TabsContent>
              
              <TabsContent value="review" className="mt-0">
                <ReviewTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
