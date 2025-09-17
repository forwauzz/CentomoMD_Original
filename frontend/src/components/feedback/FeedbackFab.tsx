/**
 * Feedback Floating Action Button
 * Floating button in dictation page for quick feedback access
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/lib/featureFlags';
import { FEEDBACK_STRINGS } from '@/types/feedback';

interface FeedbackFabProps {
  onClick: () => void;
}

export const FeedbackFab: React.FC<FeedbackFabProps> = ({ onClick }) => {
  const featureFlags = useFeatureFlags();
  
  // Don't render if feature flag is disabled
  if (!featureFlags.feedbackModule) {
    return null;
  }

  const strings = FEEDBACK_STRINGS['en-CA']; // TODO: Use proper i18n

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 bg-blue-600 hover:bg-blue-700 text-white"
      aria-label={strings.fabTooltip}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
};
