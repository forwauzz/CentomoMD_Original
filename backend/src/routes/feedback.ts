/**
 * Feedback API Routes
 * RESTful endpoints for feedback operations with feature flag gating
 */

import { Router } from 'express';
import { feedbackService } from '../services/feedbackService.js';
import { FLAGS } from '../config/flags.js';
import { logger } from '../utils/logger.js';
import type {
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackFilters,
  SyncRequest,
} from '../types/feedback.js';

const router = Router();

/**
 * Middleware to check if feedback server sync is enabled
 */
const requireFeedbackSync = (_req: any, res: any, next: any) => {
  if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
    return res.status(503).json({
      success: false,
      error: 'Feedback server sync is disabled',
      code: 'FEATURE_DISABLED',
    });
  }
  next();
};

/**
 * Middleware to extract user ID (supports anonymous users)
 * TODO: Replace with actual authentication middleware
 */
const extractUserId = (req: any, _res: any, next: any) => {
  const hdr = (req.headers['x-user-id'] ?? '').toString().trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  (req as any).userId = uuidRegex.test(hdr) ? hdr : null;
  next();
};

/**
 * POST /api/feedback
 * Create new feedback
 */
router.post('/', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const data: CreateFeedbackRequest = req.body;
    const userId = (req as any).userId;

    // Validate required fields
    if (!data.meta || !data.ratings) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: meta, ratings',
        code: 'VALIDATION_ERROR',
      });
    }

    const feedback = await feedbackService.createFeedback(userId, data);

    logger.info('Feedback created via API', {
      feedbackId: feedback.id,
      userId,
      endpoint: req.path,
      method: req.method,
    });

    return res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Failed to create feedback via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/feedback
 * List user's feedback with optional filters
 */
router.get('/', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const filters: FeedbackFilters = {
      status: req.query['status'] as any,
      mode: req.query['mode'] as string,
      template: req.query['template'] as string,
      date_from: req.query['date_from'] as string,
      date_to: req.query['date_to'] as string,
      page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : undefined,
    };

    const result = await feedbackService.listFeedback(userId, filters);

    logger.info('Feedback listed via API', {
      userId,
      total: result.total,
      page: result.page,
      endpoint: req.path,
      method: req.method,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to list feedback via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/feedback/:id
 * Get specific feedback by ID
 */
router.get('/:id', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const feedback = await feedbackService.getFeedback(userId, id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
        code: 'NOT_FOUND',
      });
    }

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Failed to get feedback via API', {
      feedbackId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * PUT /api/feedback/:id
 * Update feedback
 */
router.put('/:id', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const data: UpdateFeedbackRequest = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const feedback = await feedbackService.updateFeedback(userId, id, data);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
        code: 'NOT_FOUND',
      });
    }

    logger.info('Feedback updated via API', {
      feedbackId: id,
      userId,
      endpoint: req.path,
      method: req.method,
    });

    return res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Failed to update feedback via API', {
      feedbackId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback
 */
router.delete('/:id', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Feedback ID is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const deleted = await feedbackService.deleteFeedback(userId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found',
        code: 'NOT_FOUND',
      });
    }

    logger.info('Feedback deleted via API', {
      feedbackId: id,
      userId,
      endpoint: req.path,
      method: req.method,
    });

    return res.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete feedback via API', {
      feedbackId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/feedback/sync
 * Sync multiple feedback items (for offline sync)
 */
router.post('/sync', requireFeedbackSync, extractUserId, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const syncData: SyncRequest = req.body;

    if (!syncData.items || !Array.isArray(syncData.items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
        code: 'VALIDATION_ERROR',
      });
    }

    if (syncData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required for sync',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await feedbackService.syncFeedback(userId, syncData);

    logger.info('Feedback sync completed via API', {
      userId,
      synced: result.synced.length,
      failed: result.failed.length,
      endpoint: req.path,
      method: req.method,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Failed to sync feedback via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
    });

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
