/**
 * Template Usage & Feedback API Routes
 * Endpoints for tracking template usage and collecting feedback
 */

import { Router } from 'express';
import { TemplateUsageService } from '../services/TemplateUsageService.js';
import { TemplateFeedbackService } from '../services/TemplateFeedbackService.js';
import { FeedbackQueueService } from '../services/FeedbackQueueService.js';
import { authenticateUser } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

/**
 * POST /api/templates/:id/apply
 * Track template application and enqueue feedback prompt
 * Body: { sessionId?, caseId?, sectionId?, modeId?, idempotencyKey? }
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { id: templateId } = req.params;
    const { sessionId, caseId, sectionId, modeId } = req.body;
    // Note: idempotencyKey can be added later for deduplication if needed

    logger.info('Template application requested', {
      templateId,
      userId: user.user_id,
      sessionId,
      caseId,
    });

    // Track usage event
    const appliedAt = new Date();
    const trackResult = await TemplateUsageService.trackTemplateApplication(
      templateId,
      user.user_id,
      {
        caseId,
        sessionId,
        sectionId,
        modeId,
      }
    );

    if (!trackResult.success) {
      // User opted out of analytics - still return success (don't break UX)
      logger.info('Template usage not tracked (user opted out)', {
        templateId,
        userId: user.user_id,
      });
      return res.json({
        success: true,
        message: 'Template application logged (analytics opted out)',
        tracked: false,
      });
    }

    // Enqueue feedback prompt (2 minutes after application)
    const queueResult = await FeedbackQueueService.enqueueFeedbackPrompt(
      templateId,
      user.user_id,
      sessionId || null,
      appliedAt
    );

    logger.info('Template application tracked', {
      templateId,
      userId: user.user_id,
      eventId: trackResult.eventId,
      queueId: queueResult.queueId,
    });

    return res.json({
      success: true,
      message: 'Template application tracked',
      eventId: trackResult.eventId,
      queueId: queueResult.queueId,
    });
  } catch (error) {
    logger.error('Failed to track template application', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to track template application',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/templates/:id/feedback
 * Submit template feedback (rating, comment, etc.)
 * Body: { sessionId, rating, comment?, tags?, wasDismissed?, transcriptId?, appliedAt }
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { id: templateId } = req.params;
    const { sessionId, rating, comment, tags, wasDismissed, transcriptId, appliedAt } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    if (!appliedAt) {
      return res.status(400).json({
        success: false,
        error: 'appliedAt timestamp is required',
      });
    }

    logger.info('Template feedback submission requested', {
      templateId,
      userId: user.user_id,
      rating,
      sessionId,
    });

    // Submit feedback
    const feedbackResult = await TemplateFeedbackService.submitFeedback(
      templateId,
      user.user_id,
      rating,
      {
        sessionId,
        transcriptId,
        comment,
        tags,
        wasDismissed: wasDismissed || false,
        appliedAt: new Date(appliedAt),
      }
    );

    if (!feedbackResult.success) {
      if (feedbackResult.error === 'Analytics consent required') {
        return res.status(403).json({
          success: false,
          error: feedbackResult.error,
        });
      }
      return res.status(400).json({
        success: false,
        error: feedbackResult.error || 'Failed to submit feedback',
      });
    }

    // Remove feedback prompt from queue
    await FeedbackQueueService.removeFeedbackPrompt(
      templateId,
      user.user_id,
      sessionId || null
    );

    // Get updated aggregates
    const stats = await TemplateFeedbackService.getTemplateFeedbackStats(templateId);

    logger.info('Template feedback submitted', {
      templateId,
      userId: user.user_id,
      feedbackId: feedbackResult.feedbackId,
    });

    return res.json({
      success: true,
      message: 'Feedback submitted',
      feedbackId: feedbackResult.feedbackId,
      stats,
    });
  } catch (error) {
    logger.error('Failed to submit template feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/templates/:id/summary
 * Get template usage and feedback summary (aggregates only)
 */
router.get('/:id/summary', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const { id: templateId } = req.params;

    logger.info('Template summary requested', {
      templateId,
      userId: user.user_id,
    });

    // Get usage stats
    const usageStats = await TemplateUsageService.getTemplateUsageStats(templateId);

    // Get feedback stats
    const feedbackStats = await TemplateFeedbackService.getTemplateFeedbackStats(templateId);

    logger.info('Template summary fetched', {
      templateId,
      totalUsage: usageStats.totalUsage,
      avgRating: feedbackStats.avgRating,
    });

    return res.json({
      success: true,
      data: {
        usage: usageStats,
        feedback: feedbackStats,
      },
    });
  } catch (error) {
    logger.error('Failed to get template summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to get template summary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

