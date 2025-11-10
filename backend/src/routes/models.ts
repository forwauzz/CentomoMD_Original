/**
 * Models API Routes
 * Handles model selection, availability, and allowlist checking
 */

import { Router } from 'express';
import { FLAGS, isAllowedForExperiment } from '../config/flags.js';
import { getEnabledModels, getModelVersion } from '../config/modelVersions.js';

const router = Router();

/**
 * GET /api/models/available
 * Returns available models for the current user with allowlist checking
 */
router.get('/available', async (req, res) => {
  try {
    // Check if feature is enabled
    if (!FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS) {
      return res.status(403).json({
        success: false,
        error: 'Model selection is not enabled',
      });
    }

    // Get user email from request (extract from auth if available)
    // For now, we'll check if email is provided in headers or query params
    // In production, this should come from authenticated session
    const userEmail = req.headers['x-user-email'] as string || 
                      (req.query['email'] as string) ||
                      undefined;

    // Check allowlist
    if (!isAllowedForExperiment(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to use model selection. Contact your administrator.',
        allowlist: false,
      });
    }

    // Get enabled models
    const enabledModels = getEnabledModels();

    // Format models for frontend
    const models = enabledModels.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      enabled: model.enabled,
      description: model.description,
    }));

    return res.json({
      success: true,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error('[Models] Error fetching available models:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available models',
    });
  }
});

/**
 * GET /api/models/:modelId
 * Returns information about a specific model
 */
router.get('/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const model = getModelVersion(modelId);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    return res.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        enabled: model.enabled,
        description: model.description,
      },
    });
  } catch (error) {
    console.error('[Models] Error fetching model:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch model information',
    });
  }
});

export default router;

