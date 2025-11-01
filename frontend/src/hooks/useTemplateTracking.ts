/**
 * Template Tracking Hook
 * Tracks template applications and manages feedback prompts
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJSON } from '@/lib/api';

interface TemplateApplication {
  templateId: string;
  sessionId?: string;
  caseId?: string;
  sectionId?: string;
  modeId?: string;
  appliedAt: Date;
}

interface FeedbackPrompt {
  templateId: string;
  sessionId?: string;
  scheduledAt: Date;
}

export const useTemplateTracking = (sessionId?: string, caseId?: string) => {
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackPrompt | null>(null);
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
        const appliedAt = new Date();

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
          // Schedule client-side feedback prompt (2 minutes)
          const scheduledAt = new Date(appliedAt.getTime() + 2 * 60 * 1000);

          // Clear any existing timer for this template/session
          const timerKey = `${templateId}-${sessionId || 'no-session'}`;
          const existingTimer = timersRef.current.get(timerKey);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set new timer
          const timer = setTimeout(() => {
            setPendingFeedback({
              templateId,
              sessionId,
              scheduledAt,
            });
            setShowFeedbackBanner(true);
            timersRef.current.delete(timerKey);
          }, 2 * 60 * 1000); // 2 minutes

          timersRef.current.set(timerKey, timer);

          console.log('✅ Template application tracked:', templateId);
        } else {
          console.log('ℹ️ Template application not tracked (user opted out):', templateId);
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

          console.log('✅ Feedback submitted:', templateId, rating);
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
        await submitFeedback(templateId, 0, {
          wasDismissed: true,
          appliedAt,
        });
      } catch (error) {
        // Even if submission fails, hide the banner
        setPendingFeedback(null);
        setShowFeedbackBanner(false);
      }
    },
    [submitFeedback]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return {
    trackTemplateApplication,
    submitFeedback,
    dismissFeedback,
    pendingFeedback,
    showFeedbackBanner,
    setShowFeedbackBanner,
  };
};

