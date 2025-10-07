/**
 * Global Feedback Button
 * Accessible from anywhere in the app with optional transcription context
 */

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './FeedbackModal';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useTranscriptionContext } from '@/contexts/TranscriptionContext';

interface GlobalFeedbackButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  position?: 'fixed' | 'inline';
}

export const GlobalFeedbackButton: React.FC<GlobalFeedbackButtonProps> = ({
  className = '',
  variant = 'default',
  size = 'default',
  showText = true,
  position = 'fixed'
}) => {
  const featureFlags = useFeatureFlags();
  const { transcriptionData } = useTranscriptionContext();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Don't render if feature flag is disabled
  if (!featureFlags.feedbackModule) {
    return null;
  }

  const handleClick = () => {
    setShowFeedbackModal(true);
  };

  const buttonContent = (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${className} ${position === 'fixed' ? 'fixed bottom-6 right-6 z-50 shadow-lg' : ''}`}
      aria-label="Provide feedback"
    >
      <MessageSquare className="h-4 w-4" />
      {showText && <span className="ml-2">Feedback</span>}
    </Button>
  );

  return (
    <>
      {buttonContent}
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        transcriptionContext={transcriptionData || undefined}
      />
    </>
  );
};
