/**
 * Template Combinations API Routes
 * Endpoints for fetching template combinations from database
 */

import { Router } from 'express';
import { TemplateCombinationService } from '../services/TemplateCombinationService.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Enable authentication middleware
router.use(authenticateUser);

/**
 * GET /api/template-combinations
 * Get all active template combinations
 * Query params:
 *   - active: boolean (default: true) - only return active templates
 *   - section: string - filter by compatible section
 *   - mode: string - filter by compatible mode
 *   - language: 'fr' | 'en' | 'both' - filter by language
 *   - default: boolean - only return default templates
 */
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user found',
      });
    }

    const { active, section, mode, language, default: defaultOnly } = req.query;

    let templates;

    // Filter by section and mode
    if (section && mode) {
      templates = await TemplateCombinationService.getTemplatesBySectionAndMode(
        String(section),
        String(mode)
      );
    }
    // Filter by section only
    else if (section) {
      templates = await TemplateCombinationService.getTemplatesBySection(String(section));
    }
    // Filter by mode only
    else if (mode) {
      templates = await TemplateCombinationService.getTemplatesByMode(String(mode));
    }
    // Filter by language
    else if (language && ['fr', 'en', 'both'].includes(String(language))) {
      templates = await TemplateCombinationService.getTemplatesByLanguage(
        language as 'fr' | 'en' | 'both'
      );
    }
    // Get default templates only
    else if (defaultOnly === 'true') {
      templates = await TemplateCombinationService.getDefaultTemplates();
    }
    // Get active templates only (default)
    else if (active === 'false') {
      templates = await TemplateCombinationService.getAllTemplates();
    }
    // Default: get active templates
    else {
      templates = await TemplateCombinationService.getActiveTemplates();
    }

    console.log('✅ [Template Combinations] Fetched templates:', {
      userId: user.user_id,
      count: templates.length,
      filters: { section, mode, language, default: defaultOnly, active },
    });

    return res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('❌ [Template Combinations] Failed to fetch templates:', error);
    return res.status(500).json({
      error: 'Failed to fetch template combinations',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/template-combinations/:id
 * Get template combination by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.user_id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authenticated user found',
      });
    }

    const { id } = req.params;

    console.log('📖 [Template Combinations] Fetching template:', id);

    const template = await TemplateCombinationService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        error: 'Template combination not found',
        templateId: id,
      });
    }

    console.log('✅ [Template Combinations] Successfully fetched template:', id);

    return res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('❌ [Template Combinations] Failed to fetch template:', error);
    return res.status(500).json({
      error: 'Failed to fetch template combination',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

