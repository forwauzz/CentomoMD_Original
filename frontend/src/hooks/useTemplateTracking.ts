/**
 * Template Tracking Hook
 * Tracks template applications and manages feedback prompts
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJSON } from '@/lib/api';

interface FeedbackPrompt {
  templateId: string;
  sessionId?: string;
  scheduledAt: Date;
}

export const useTemplateTracking = (sessionId?: string, caseId?: string) => {
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackPrompt | null>(null);
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Track template application
   * Called when a template is applied
   */
  const trackTemplateApplication = useCallback(
    async (
      templateId: string,
      options: {
        sectionId?: string;
        modeId?: string;
      } = {}
    ) => {
      try {
        // Track usage via API
        const response = await apiJSON<{
          success: boolean;
          eventId?: string;
          queueId?: string;
          tracked?: boolean;
        }>('/api/templates/' + templateId + '/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            caseId,
            sectionId: options.sectionId,
            modeId: options.modeId,
          }),
        });

        if (response.success && response.tracked !== false) {
          // Prompt is enqueued on server - polling will pick it up
          // No need for client-side timer anymore
          console.log('Γ£à Template application tracked:', templateId);
        } else {
          console.log('Γä╣∩╕Å Template application not tracked (user opted out):', templateId);
        }
      } catch (error) {
        // Silently fail - don't break UX
        console.warn('Failed to track template application:', error);
      }
    },
    [sessionId, caseId]
  );

  /**
   * Submit template feedback
   */
  const submitFeedback = useCallback(
    async (
      templateId: string,
      rating: number,
      options: {
        comment?: string;
        tags?: string[];
        wasDismissed?: boolean;
        transcriptId?: string;
        appliedAt: Date;
      }
    ) => {
      try {
        const response = await apiJSON<{
          success: boolean;
          feedbackId?: string;
          stats?: any;
        }>('/api/templates/' + templateId + '/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            rating,
            comment: options.comment,
            tags: options.tags,
            wasDismissed: options.wasDismissed || false,
            transcriptId: options.transcriptId,
            appliedAt: options.appliedAt.toISOString(),
          }),
        });

        if (response.success) {
          // Clear pending feedback
          setPendingFeedback(null);
          setShowFeedbackBanner(false);

          // Clear any timers
          const timerKey = `${templateId}-${sessionId || 'no-session'}`;
          const existingTimer = timersRef.current.get(timerKey);
          if (existingTimer) {
            clearTimeout(existingTimer);
            timersRef.current.delete(timerKey);
          }

          console.log('Γ£à Feedback submitted:', templateId, rating);
        }
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        throw error;
      }
    },
    [sessionId]
  );

  /**
   * Dismiss feedback banner
   */
  const dismissFeedback = useCallback(
    async (templateId: string, appliedAt: Date) => {
      try {
        // Submit dismissal with no rating (wasDismissed = true)
        await apiJSON<{
          success: boolean;
          feedbackId?: string;
          stats?: any;
        }>('/api/templates/' + templateId + '/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            wasDismissed: true,
            appliedAt: appliedAt.toISOString(),
          }),
        });

        // Clear pending feedback
        setPendingFeedback(null);
        setShowFeedbackBanner(false);

        // Clear any timers
        const timerKey = `${templateId}-${sessionId || 'no-session'}`;
        const existingTimer = timersRef.current.get(timerKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
          timersRef.current.delete(timerKey);
        }

        console.log('Γ£à Feedback dismissed:', templateId);
      } catch (error) {
        // Even if submission fails, hide the banner
        console.warn('Failed to dismiss feedback:', error);
        setPendingFeedback(null);
        setShowFeedbackBanner(false);
      }
    },
    [sessionId]
  );

  /**
   * Poll for due feedback prompts from the queue
   * This ensures prompts work even after navigation
   */
  useEffect(() => {
    const pollForDuePrompts = async () => {
      try {
        const response = await apiJSON<{
          success: boolean;
          data: Array<{
            id: string;
            templateId: string;
            sessionId?: string;
            scheduledAt: string;
          }>;
          count: number;
        }>('/api/templates/prompts/due');

        if (response.success && response.data && response.data.length > 0) {
          // Get the first due prompt (most recent)
          const duePrompt = response.data[0];

          // Only show if we don't already have pending feedback for this template
          if (!pendingFeedback || pendingFeedback.templateId !== duePrompt.templateId) {
            setPendingFeedback({
              templateId: duePrompt.templateId,
              sessionId: duePrompt.sessionId,
              scheduledAt: new Date(duePrompt.scheduledAt),
            });
            setShowFeedbackBanner(true);
            
            console.log('Γ£à Due feedback prompt found:', duePrompt.templateId);
            // Don't remove prompt from queue yet - wait for user to provide feedback or dismiss
            // The prompt will be removed when submitFeedback or dismissFeedback is called
          }
        }
      } catch (error) {
        // Silently fail - polling errors shouldn't break UX
        console.warn('Failed to poll for due prompts:', error);
      }
    };

    // Poll every 30 seconds for due prompts
    pollingIntervalRef.current = setInterval(pollForDuePrompts, 30000);

    // Initial poll
    pollForDuePrompts();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Cleanup timers on unmount
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [pendingFeedback]);

  return {
    trackTemplateApplication,
    submitFeedback,
    dismissFeedback,
    pendingFeedback,
    showFeedbackBanner,
    setShowFeedbackBanner,
  };
};

