/**
 * Feedback Service
 * Business logic for feedback operations with server sync capability
 */

import { eq, and, desc, gte, lte, count, isNull } from 'drizzle-orm';
import { getDb } from '../database/connection.js';
import { feedback } from '../database/schema.js';
import { logger } from '../utils/logger.js';
import { FLAGS } from '../config/flags.js';
import type {
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
  FeedbackResponse,
  FeedbackListResponse,
  FeedbackFilters,
  SyncRequest,
  SyncResponse,
} from '../types/feedback.js';

export class FeedbackService {
  private db = getDb();

  /**
   * Create new feedback item
   */
  async createFeedback(
    userId: string | null,
    data: CreateFeedbackRequest
  ): Promise<FeedbackResponse> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    try {
      // Validate input
      this.validateFeedbackData(data);

      // Create feedback record
      const [newFeedback] = await this.db
        .insert(feedback)
        .values({
          user_id: userId,
          session_id: data.session_id || null,
          meta: data.meta,
          ratings: data.ratings,
          artifacts: data.artifacts || {},
          highlights: data.highlights || [],
          comment: data.comment || null,
          attachments: data.attachments || [],
          ttl_days: data.ttl_days || 30,
        })
        .returning();

      logger.info('Feedback created successfully', {
        feedbackId: newFeedback?.id,
        userId,
        sessionId: data.session_id,
      });

      return this.mapToResponse(newFeedback!);
    } catch (error) {
      logger.error('Failed to create feedback', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get feedback by ID
   */
  async getFeedback(
    userId: string,
    feedbackId: string
  ): Promise<FeedbackResponse | null> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    try {
      const [result] = await this.db
        .select()
        .from(feedback)
        .where(and(eq(feedback.id, feedbackId), eq(feedback.user_id, userId)))
        .limit(1);

      if (!result) {
        return null;
      }

      return this.mapToResponse(result);
    } catch (error) {
      logger.error('Failed to get feedback', {
        feedbackId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List user's feedback with filters
   */
  async listFeedback(
    userId: string | null,
    filters: FeedbackFilters = {}
  ): Promise<FeedbackListResponse> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100); // Max 100 items per page
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = userId 
        ? [eq(feedback.user_id, userId)]
        : [isNull(feedback.user_id)];


      if (filters.status) {
        conditions.push(eq(feedback.status, filters.status));
      }

      if (filters.date_from) {
        conditions.push(gte(feedback.created_at, new Date(filters.date_from)));
      }

      if (filters.date_to) {
        conditions.push(lte(feedback.created_at, new Date(filters.date_to)));
      }

      // Get total count
      const [totalResult] = await this.db
        .select({ count: count() })
        .from(feedback)
        .where(and(...conditions));

      // Get items
      const items = await this.db
        .select()
        .from(feedback)
        .where(and(...conditions))
        .orderBy(desc(feedback.created_at))
        .limit(limit)
        .offset(offset);

      return {
        items: items.map(this.mapToResponse),
        total: totalResult?.count || 0,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to list feedback', {
        userId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update feedback item
   */
  async updateFeedback(
    userId: string,
    feedbackId: string,
    data: UpdateFeedbackRequest
  ): Promise<FeedbackResponse | null> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    try {
      // Validate input
      if (data.ratings) {
        this.validateRatings(data.ratings);
      }

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date(),
      };

      if (data.ratings !== undefined) updateData.ratings = data.ratings;
      if (data.artifacts !== undefined) updateData.artifacts = data.artifacts;
      if (data.highlights !== undefined) updateData.highlights = data.highlights;
      if (data.comment !== undefined) updateData.comment = data.comment || null;
      if (data.attachments !== undefined) updateData.attachments = data.attachments || null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.ttl_days !== undefined) updateData.ttl_days = data.ttl_days;

      // Update feedback record
      const [updatedFeedback] = await this.db
        .update(feedback)
        .set(updateData)
        .where(and(eq(feedback.id, feedbackId), eq(feedback.user_id, userId)))
        .returning();

      if (!updatedFeedback) {
        return null;
      }

      logger.info('Feedback updated successfully', {
        feedbackId,
        userId,
      });

      return this.mapToResponse(updatedFeedback);
    } catch (error) {
      logger.error('Failed to update feedback', {
        feedbackId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete feedback item
   */
  async deleteFeedback(userId: string, feedbackId: string): Promise<boolean> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    try {
      const result = await this.db
        .delete(feedback)
        .where(and(eq(feedback.id, feedbackId), eq(feedback.user_id, userId)));

      const deleted = result.length > 0;

      if (deleted) {
        logger.info('Feedback deleted successfully', {
          feedbackId,
          userId,
        });
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete feedback', {
        feedbackId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Sync multiple feedback items (for offline sync)
   */
  async syncFeedback(
    userId: string,
    syncData: SyncRequest
  ): Promise<SyncResponse> {
    if (!FLAGS.FEATURE_FEEDBACK_SERVER_SYNC) {
      throw new Error('Feedback server sync is disabled');
    }

    const synced: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const item of syncData.items) {
      try {
        await this.createFeedback(userId, item.data);
        synced.push(item.id);
      } catch (error) {
        failed.push({
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Feedback sync completed', {
      userId,
      synced: synced.length,
      failed: failed.length,
    });

    return { synced, failed };
  }

  /**
   * Validate feedback data
   */
  private validateFeedbackData(data: CreateFeedbackRequest): void {
    if (!data.meta) {
      throw new Error('Meta data is required');
    }

    if (!data.ratings) {
      throw new Error('Ratings are required');
    }

    this.validateMeta(data.meta);
    this.validateRatings(data.ratings);

    if (data.ttl_days && (data.ttl_days < 1 || data.ttl_days > 365)) {
      throw new Error('TTL days must be between 1 and 365');
    }
  }

  /**
   * Validate meta data
   */
  private validateMeta(meta: any): void {
    if (!meta.language || !['fr-CA', 'en-CA'].includes(meta.language)) {
      throw new Error('Valid language is required (fr-CA or en-CA)');
    }

    if (!meta.mode || !['smart', 'word-for-word', 'ambient'].includes(meta.mode)) {
      throw new Error('Valid mode is required');
    }

    if (typeof meta.diarization !== 'boolean') {
      throw new Error('Diarization must be a boolean');
    }

    if (typeof meta.custom_vocab !== 'boolean') {
      throw new Error('Custom vocab must be a boolean');
    }

    if (typeof meta.contains_phi !== 'boolean') {
      throw new Error('Contains PHI must be a boolean');
    }
  }

  /**
   * Validate ratings
   */
  private validateRatings(ratings: any): void {
    const validScores = ['dictation', 'transcription', 'hallucination', 'context', 'structure', 'overall'];
    
    for (const [key, rating] of Object.entries(ratings)) {
      if (!validScores.includes(key)) {
        throw new Error(`Invalid rating key: ${key}`);
      }

      if (rating && typeof rating === 'object' && 'score' in rating) {
        const ratingObj = rating as any;
        if (typeof ratingObj.score !== 'number' || ratingObj.score < 1 || ratingObj.score > 5) {
          throw new Error(`Rating score for ${key} must be between 1 and 5`);
        }
      }
    }
  }

  /**
   * Map database record to response format
   */
  private mapToResponse(record: any): FeedbackResponse {
    return {
      id: record.id,
      user_id: record.user_id,
      session_id: record.session_id,
      meta: record.meta,
      ratings: record.ratings,
      artifacts: record.artifacts,
      highlights: record.highlights,
      comment: record.comment,
      attachments: record.attachments,
      status: record.status,
      ttl_days: record.ttl_days,
      created_at: record.created_at.toISOString(),
      updated_at: record.updated_at.toISOString(),
    };
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
