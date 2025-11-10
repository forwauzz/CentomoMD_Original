/**
 * Feedback Queue Service
 * Manages scheduled feedback prompts (2-minute delay after template application)
 */

import { getDb, getSql } from '../database/connection.js';
import { feedbackPromptsQueue } from '../database/schema.js';
import { eq, and, sql as drizzleSql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export class FeedbackQueueService {
  /**
   * Enqueue a feedback prompt (schedule for 2 minutes after template application)
   */
  static async enqueueFeedbackPrompt(
    templateId: string,
    userId: string,
    sessionId: string | null,
    appliedAt: Date
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    const db = getDb();

    try {
      // Schedule prompt for 2 minutes after template application
      const scheduledAt = new Date(appliedAt.getTime() + 2 * 60 * 1000); // 2 minutes

      const [queueRecord] = await db
        .insert(feedbackPromptsQueue)
        .values({
          template_id: templateId,
          user_id: userId,
          session_id: sessionId,
          scheduled_at: scheduledAt,
          created_at: new Date(),
        })
        .returning();

      if (!queueRecord) {
        throw new Error('Failed to create feedback prompt queue record');
      }

      logger.info('Feedback prompt enqueued', {
        queueId: queueRecord.id,
        templateId,
        userId,
        sessionId,
        scheduledAt: scheduledAt.toISOString(),
      });

      return {
        success: true,
        queueId: queueRecord.id,
      };
    } catch (error) {
      logger.error('Failed to enqueue feedback prompt', {
        templateId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get due feedback prompts (scheduled_at <= now)
   * Returns prompts ready to be shown to users
   */
  static async getDueFeedbackPrompts(): Promise<
    Array<{
      id: string;
      templateId: string;
      userId: string;
      sessionId: string | null;
      scheduledAt: Date;
    }>
  > {
    const sql = getSql();

    try {
      const now = new Date();
      const result = await sql`
        SELECT 
          id,
          template_id,
          user_id,
          session_id,
          scheduled_at
        FROM feedback_prompts_queue
        WHERE scheduled_at <= ${now}
        ORDER BY scheduled_at ASC
        LIMIT 100
      `;

      return result.map((row: any) => ({
        id: row.id,
        templateId: row.template_id,
        userId: row.user_id,
        sessionId: row.session_id,
        scheduledAt: new Date(row.scheduled_at),
      }));
    } catch (error) {
      logger.error('Failed to get due feedback prompts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Remove feedback prompt from queue (after feedback submitted or dismissed)
   */
  static async removeFeedbackPrompt(
    templateId: string,
    userId: string,
    sessionId: string | null
  ): Promise<{ success: boolean }> {
    const db = getDb();

    try {
      const conditions = [
        eq(feedbackPromptsQueue.template_id, templateId),
        eq(feedbackPromptsQueue.user_id, userId),
      ];

      if (sessionId) {
        conditions.push(eq(feedbackPromptsQueue.session_id, sessionId));
      } else {
        conditions.push(drizzleSql`${feedbackPromptsQueue.session_id} IS NULL`);
      }

      await db
        .delete(feedbackPromptsQueue)
        .where(and(...conditions));

      logger.info('Feedback prompt removed from queue', {
        templateId,
        userId,
        sessionId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to remove feedback prompt', {
        templateId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Clean up expired prompts (older than 24 hours)
   */
  static async cleanupExpiredPrompts(): Promise<number> {
    const sql = getSql();

    try {
      const expiredAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const result = await sql`
        DELETE FROM feedback_prompts_queue
        WHERE scheduled_at < ${expiredAt}
        RETURNING id
      `;

      const deletedCount = result.length;
      logger.info('Cleaned up expired feedback prompts', { deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired prompts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

