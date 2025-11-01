/**
 * Template Feedback Service
 * Handles template feedback (ratings, comments) storage and retrieval
 */

import { getDb, getSql } from '../database/connection.js';
import { templateFeedback, profiles, NewTemplateFeedbackRow } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export class TemplateFeedbackService {
  /**
   * Submit template feedback
   * Checks user consent before storing
   */
  static async submitFeedback(
    templateId: string,
    userId: string,
    rating: number,
    options: {
      sessionId?: string;
      caseId?: string;
      sectionId?: string;
      modeId?: string;
      transcriptId?: string;
      comment?: string;
      tags?: string[];
      wasDismissed?: boolean;
      appliedAt: Date; // When template was originally applied
    }
  ): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
    const db = getDb();

    try {
      // Check user consent before storing feedback
      const profile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.user_id, userId))
        .limit(1);

      if (!profile[0]?.consent_analytics) {
        logger.warn('User opted out of analytics', { userId, templateId });
        return {
          success: false,
          error: 'Analytics consent required',
        };
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          error: 'Rating must be between 1 and 5',
        };
      }

      // Calculate time to rate (in seconds)
      const ratedAt = new Date();
      const timeToRate = Math.floor((ratedAt.getTime() - options.appliedAt.getTime()) / 1000);

      // Create feedback record
      const feedback: NewTemplateFeedbackRow = {
        template_id: templateId,
        user_id: userId,
        session_id: options.sessionId || null,
        case_id: options.caseId || null,
        section_id: options.sectionId || null,
        mode_id: options.modeId || null,
        transcript_id: options.transcriptId || null,
        rating,
        comment: options.comment || null,
        tags: options.tags || [],
        applied_at: options.appliedAt,
        rated_at: ratedAt,
        time_to_rate: timeToRate,
        was_dismissed: options.wasDismissed || false,
        interaction_time: null, // Can be set later if needed
      };

      // Insert feedback (unique constraint handles duplicates)
      const [feedbackRecord] = await db
        .insert(templateFeedback)
        .values(feedback)
        .onConflictDoUpdate({
          target: [templateFeedback.template_id, templateFeedback.session_id, templateFeedback.user_id],
          set: {
            rating: feedback.rating ?? null,
            comment: feedback.comment ?? null,
            tags: feedback.tags ?? [],
            rated_at: feedback.rated_at ?? new Date(),
            time_to_rate: feedback.time_to_rate ?? null,
            was_dismissed: feedback.was_dismissed ?? false,
          },
        })
        .returning();

      if (!feedbackRecord) {
        throw new Error('Failed to create feedback record');
      }

      logger.info('Template feedback submitted', {
        feedbackId: feedbackRecord.id,
        templateId,
        userId,
        rating,
        sessionId: options.sessionId,
      });

      // Refresh materialized view to update aggregate stats
      try {
        const sql = getSql();
        await sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_template_stats`;
        logger.info('Materialized view refreshed after feedback submission', { templateId });
      } catch (refreshError) {
        // Don't fail the feedback submission if refresh fails
        logger.warn('Failed to refresh materialized view', {
          templateId,
          error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
        });
      }

      return {
        success: true,
        feedbackId: feedbackRecord.id,
      };
    } catch (error) {
      logger.error('Failed to submit template feedback', {
        templateId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get template feedback stats (aggregates only)
   */
  static async getTemplateFeedbackStats(templateId: string): Promise<{
    avgRating: number;
    ratingCount: number;
    successCount: number;
    dismissalCount: number;
  }> {
    const sql = getSql();

    try {
      // Query materialized view for fast aggregates
      const result = await sql`
        SELECT 
          avg_rating,
          rating_count,
          success_count,
          dismissal_count
        FROM mv_template_stats
        WHERE template_id = ${templateId}
        LIMIT 1
      `;

      if (!result || result.length === 0) {
        return {
          avgRating: 0,
          ratingCount: 0,
          successCount: 0,
          dismissalCount: 0,
        };
      }

      const stats = result[0] as {
        avg_rating: number | null;
        rating_count: number;
        success_count: number;
        dismissal_count: number;
      };

      return {
        avgRating: stats.avg_rating ? Number(stats.avg_rating) : 0,
        ratingCount: Number(stats.rating_count) || 0,
        successCount: Number(stats.success_count) || 0,
        dismissalCount: Number(stats.dismissal_count) || 0,
      };
    } catch (error) {
      logger.error('Failed to get template feedback stats', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

