/**
 * Template Combination Service
 * Handles database queries for template combinations
 */

import { getDb } from '../database/connection.js';
import { templateCombinations } from '../database/schema.js';
import { eq, and, sql, or } from 'drizzle-orm';
import { TemplateCombination } from '../database/schema.js';
import { logger } from '../utils/logger.js';

export class TemplateCombinationService {
  /**
   * Get all active template combinations
   */
  static async getActiveTemplates(): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const result = await db
        .select()
        .from(templateCombinations)
        .where(eq(templateCombinations.is_active, true))
        .orderBy(sql`${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`);
      
      logger.info('Fetched active templates', { count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch active templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all template combinations (active and inactive)
   */
  static async getAllTemplates(): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const result = await db
        .select()
        .from(templateCombinations)
        .orderBy(
          sql`${templateCombinations.is_active} DESC, ${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`
        );
      
      logger.info('Fetched all templates', { count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch all templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get template combination by ID
   */
  static async getTemplateById(id: string): Promise<TemplateCombination | null> {
    const db = getDb();
    
    try {
      const result = await db
        .select()
        .from(templateCombinations)
        .where(eq(templateCombinations.id, id))
        .limit(1);
      
      if (result.length === 0) {
        logger.info('Template not found', { templateId: id });
        return null;
      }
      
      logger.info('Fetched template by ID', { templateId: id });
      return result[0] ?? null;
    } catch (error) {
      logger.error('Failed to fetch template by ID', {
        templateId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get templates by section compatibility
   */
  static async getTemplatesBySection(section: string): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      // Use JSONB containment operator (@>) to check if section is in compatible_sections array
      const result = await db
        .select()
        .from(templateCombinations)
        .where(
          and(
            eq(templateCombinations.is_active, true),
            sql`${templateCombinations.compatible_sections} @> ${JSON.stringify([section])}::jsonb`
          )
        )
        .orderBy(sql`${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`);
      
      logger.info('Fetched templates by section', { section, count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch templates by section', {
        section,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get templates by mode compatibility
   */
  static async getTemplatesByMode(mode: string): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      // Use JSONB containment operator (@>) to check if mode is in compatible_modes array
      const result = await db
        .select()
        .from(templateCombinations)
        .where(
          and(
            eq(templateCombinations.is_active, true),
            sql`${templateCombinations.compatible_modes} @> ${JSON.stringify([mode])}::jsonb`
          )
        )
        .orderBy(sql`${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`);
      
      logger.info('Fetched templates by mode', { mode, count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch templates by mode', {
        mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get templates by section and mode compatibility
   */
  static async getTemplatesBySectionAndMode(
    section: string,
    mode: string
  ): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      // Use JSONB containment operator (@>) for both section and mode
      const result = await db
        .select()
        .from(templateCombinations)
        .where(
          and(
            eq(templateCombinations.is_active, true),
            sql`${templateCombinations.compatible_sections} @> ${JSON.stringify([section])}::jsonb`,
            sql`${templateCombinations.compatible_modes} @> ${JSON.stringify([mode])}::jsonb`
          )
        )
        .orderBy(sql`${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`);
      
      logger.info('Fetched templates by section and mode', {
        section,
        mode,
        count: result.length,
      });
      return result;
    } catch (error) {
      logger.error('Failed to fetch templates by section and mode', {
        section,
        mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get templates by language
   */
  static async getTemplatesByLanguage(language: 'fr' | 'en' | 'both'): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const conditions = [
        eq(templateCombinations.is_active, true),
        or(
          eq(templateCombinations.language, language),
          eq(templateCombinations.language, 'both')
        ),
      ];

      const result = await db
        .select()
        .from(templateCombinations)
        .where(and(...conditions))
        .orderBy(sql`${templateCombinations.is_default} DESC, ${templateCombinations.name} ASC`);
      
      logger.info('Fetched templates by language', { language, count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch templates by language', {
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get default templates
   */
  static async getDefaultTemplates(): Promise<TemplateCombination[]> {
    const db = getDb();
    
    try {
      const result = await db
        .select()
        .from(templateCombinations)
        .where(
          and(
            eq(templateCombinations.is_active, true),
            eq(templateCombinations.is_default, true)
          )
        )
        .orderBy(templateCombinations.name);
      
      logger.info('Fetched default templates', { count: result.length });
      return result;
    } catch (error) {
      logger.error('Failed to fetch default templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

