/**
 * Template Usage Service
 * Tracks template application events in the database
 */

import { getDb, getSql } from '../database/connection.js';
import { templateUsageEvents, profiles, NewTemplateUsageEvent } from '../database/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

export class TemplateUsageService {
  /**
   * Track template application (insert usage event)
   * Also checks user consent before tracking
   */
  static async trackTemplateApplication(
    templateId: string,
    userId: string,
    options: {
      caseId?: string;
      sessionId?: string;
      sectionId?: string;
      modeId?: string;
    } = {}
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const db = getDb();

    try {
      // Check user consent before tracking
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

      // Create usage event
      const usageEvent: NewTemplateUsageEvent = {
        template_id: templateId,
        user_id: userId,
        case_id: options.caseId || null,
        session_id: options.sessionId || null,
        section_id: options.sectionId || null,
        mode_id: options.modeId || null,
        applied_at: new Date(),
      };

      const [event] = await db
        .insert(templateUsageEvents)
        .values(usageEvent)
        .returning();

      if (!event) {
        throw new Error('Failed to create usage event');
      }

      logger.info('Template usage tracked', {
        eventId: event.id,
        templateId,
        userId,
        sessionId: options.sessionId,
      });

      return {
        success: true,
        eventId: event.id,
      };
    } catch (error) {
      logger.error('Failed to track template usage', {
        templateId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get usage events for a template
   * Note: Returns aggregates only (privacy-safe)
   */
  static async getTemplateUsageStats(templateId: string): Promise<{
    totalUsage: number;
    uniqueUsers: number;
    lastUsedAt: Date | null;
  }> {
    const sql = getSql();

    try {
      // Query materialized view for fast aggregates
      const result = await sql`
        SELECT 
          total_usage,
          unique_users,
          last_used_at
        FROM mv_template_stats
        WHERE template_id = ${templateId}
        LIMIT 1
      `;

      if (!result || result.length === 0) {
        return {
          totalUsage: 0,
          uniqueUsers: 0,
          lastUsedAt: null,
        };
      }

      const stats = result[0] as {
        total_usage: number;
        unique_users: number;
        last_used_at: Date | null;
      };

      return {
        totalUsage: Number(stats.total_usage) || 0,
        uniqueUsers: Number(stats.unique_users) || 0,
        lastUsedAt: stats.last_used_at ? new Date(stats.last_used_at) : null,
      };
    } catch (error) {
      logger.error('Failed to get template usage stats', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

