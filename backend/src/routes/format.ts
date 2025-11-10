import { Router } from 'express';
import { ENV } from '../config/env.js';
// Mode2Formatter may not exist in some environments; use dynamic import with fallback stub
import { ShadowModeHook } from '../services/shadow/ShadowModeHook.js';
import { FLAGS, isAllowedForExperiment } from '../config/flags.js';
import { createHash } from 'crypto';
import { ComplianceLayer } from '../lib/compliance.js';
import { addTraceId, metrics } from '../lib/metrics.js';

const router = Router();

// POST /api/format/merge/section11 - Generate Section 11 from structured JSON input
router.post('/merge/section11', async (req, res) => {
  const requestStartTime = Date.now();
  addTraceId(req, res);
  const traceId = (req as any).traceId as string;

  try {
    const { caseId, inputData, model, temperature, seed, templateVersion, templateId } = req.body;

    if (!caseId) {
      return res.status(400).json({ 
        error: 'Missing required field: caseId' 
      });
    }

    if (!inputData) {
      return res.status(400).json({ 
        error: 'Missing required field: inputData (Section11Input JSON)' 
      });
    }

    // Use provided templateId or default to section11-rd (logged but not used directly - service uses templateVersion)
    console.log(`[${traceId}] 🤖 [Format] Generating Section 11 for case: ${caseId} with template: ${templateId || 'section11-rd'}`);

    // Import Section 11 R&D service
    const { Section11RdService } = await import('../services/section11RdService.js');
    const section11Service = new Section11RdService();

    // Process input through Section 11 R&D pipeline
    // Note: templateId is logged but not used directly (service uses templateVersion for artifact resolution)
    const result = await section11Service.processInput(
      inputData,
      model,
      temperature,
      seed,
      templateVersion || 'current' // Use provided version or default to 'current'
    );

    if (!result.success) {
      console.error(`[${traceId}] ❌ Section 11 R&D pipeline failed`);
      return res.status(500).json({ 
        error: 'Failed to generate Section 11',
        details: result.formattedText // Contains error message
      });
    }

    const processingTime = Date.now() - requestStartTime;

    console.log(`[${traceId}] ✅ Section 11 generated successfully`, {
      caseId,
      processingTime,
      rulesScore: result.compliance.rulesScore,
      passedRules: result.compliance.passedRules.length,
      failedRules: result.compliance.failedRules.length
    });

    // Log compliance issues if any
    if (result.compliance.failedRules.length > 0) {
      console.warn(`[${traceId}] ⚠️ Section 11 compliance issues:`, result.compliance.failedRules);
    }

    return res.json({
      success: true,
      caseId,
      autoSummary: result.formattedText,
      compliance: result.compliance,
      quality: result.quality,
      metadata: {
        ...result.metadata,
        processingTime
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${traceId}] ❌ [Format] Failed to generate Section 11:`, error);
    return res.status(500).json({ 
      error: 'Failed to generate Section 11',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple in-memory idempotency cache (24h TTL)
const idempotencyCache = new Map<string, { result: any; expiresAt: number }>();

// Mode 2 Formatting Endpoint (Smart Dictation)
router.post('/mode2', async (req, res) => {
  const requestStartTime = Date.now();
  
  // Add trace ID for correlation
  addTraceId(req, res);
  const traceId = (req as any).traceId as string;
  
  try {
    // Idempotency key support
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`[API] Returning cached result for idempotency key: ${idempotencyKey.substring(0, 8)}...`);
        return res.json(cached.result);
      }
    }

    const { 
      transcript, 
      section, 
      language, // Legacy parameter for backward compatibility
      inputLanguage, 
      outputLanguage, 
      case_id,
      templateId, // Legacy (backward compatible)
      templateCombo, // Legacy (backward compatible)
      templateRef, // NEW: Unified template identifier
      model, // NEW: Model selection (feature-flagged)
      seed, // NEW: Reproducibility
      temperature, // NEW: Reproducibility
      prompt_hash, // NEW: Prompt version tracking
      templateVersion, // NEW: Template version selection (optional, backward compatible)
    } = req.body;
    
    console.log('[API] Mode2 request body:', {
      section,
      language,
      inputLanguage,
      outputLanguage,
      templateId,
      templateCombo,
      templateRef,
      model,
      transcriptLength: transcript?.length
    });
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
      });
    }

    if (!section || !['7', '8', '11'].includes(section)) {
      return res.status(400).json({ 
        error: 'Section must be "7", "8", or "11"' 
      });
    }

    // Handle backward compatibility and new language parameters
    const finalInputLanguage = inputLanguage || language || 'fr';
    const finalOutputLanguage = outputLanguage || ENV.CNESST_SECTIONS_DEFAULT_OUTPUT;

    if (!['fr', 'en'].includes(finalInputLanguage)) {
      return res.status(400).json({ 
        error: 'Input language must be either "fr" or "en"' 
      });
    }

    if (!['fr', 'en'].includes(finalOutputLanguage)) {
      return res.status(400).json({ 
        error: 'Output language must be either "fr" or "en"' 
      });
    }

    // Policy gate for CNESST sections
    if (['7','8','11'].includes(section) && 
        finalOutputLanguage !== 'fr' && 
        !ENV.ALLOW_NON_FRENCH_OUTPUT) {
      return res.status(400).json({ 
        error: 'CNESST sections must output French when ALLOW_NON_FRENCH_OUTPUT is false' 
      });
    }

    // SERVER-SIDE FLAG ENFORCEMENT
    const modelRequested = model;
    if (modelRequested && !FLAGS.FEATURE_MODEL_SELECTION) {
      // Ignore model param, use default
      console.warn(`[SECURITY] Model selection requested but FEATURE_MODEL_SELECTION disabled, using default`);
      // Don't set model = undefined here, just continue without it
    }

    // Check user allowlist if model selection requested
    const userEmail = req.headers['x-user-email'] as string || req.body.userEmail;
    if (modelRequested && FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS && !isAllowedForExperiment(userEmail)) {
      return res.status(403).json({ 
        error: 'Model selection not available. Contact administrator if you need access.' 
      });
    }

    // Resolve template identity (backward compatible)
    const { LayerManager } = await import('../services/layers/LayerManager.js');
    const layerManager = new LayerManager();
    
    let resolvedTemplate: {
      templateRef: string;
      deprecated?: boolean;
      warning?: string;
      baseTemplateId: string;
      layerStack: string[];
      stack_fingerprint: string;
    };
    
    try {
      resolvedTemplate = layerManager.resolveTemplateIdentity(
        templateRef,
        templateId,
        templateCombo
      );
    } catch (error) {
      // Fallback to section-based default if no template provided
      const mappedTemplateId = section === '7' ? 'section7-ai-formatter' : 
                                section === '8' ? 'section8-ai-formatter' : 
                                section === '11' ? 'section11-rd' : undefined;
      if (!mappedTemplateId) {
        return res.status(400).json({ error: 'No formatter available for the requested section' });
      }
      const resolved = layerManager.resolveTemplateRef(mappedTemplateId);
      resolvedTemplate = {
        templateRef: mappedTemplateId,
        deprecated: false,
        ...resolved,
      };
    }

    // Log deprecation warning if using old fields
    if (resolvedTemplate.deprecated && resolvedTemplate.warning) {
      console.warn(`[DEPRECATION] ${resolvedTemplate.warning}`);
    }

    // Generate prompt hash if not provided
    const finalPromptHash = prompt_hash || createHash('sha256')
      .update(JSON.stringify({ section, templateRef: resolvedTemplate.templateRef, finalInputLanguage }))
      .digest('hex')
      .substring(0, 16);

    // Compliance: Hash content for audit logging (no raw PHI)
    const contentHash = ComplianceLayer.hashContent(transcript);
    await ComplianceLayer.logRequest(
      userEmail || 'anonymous',
      resolvedTemplate.templateRef,
      model || 'default',
      contentHash,
      { section, language: finalInputLanguage }
    );

    // Route to the decoupled ProcessingOrchestrator
    const { processingOrchestrator } = await import('../services/processing/ProcessingOrchestrator.js');

    const correlationId = `mode2-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;

    // Enhanced processing request with new parameters
    const processingStartTime = Date.now();
    const orchestrated = await processingOrchestrator.processContent({
      sectionId: `section_${section}`,
      modeId: 'mode2',
      templateId: resolvedTemplate.baseTemplateId,
      layerStack: resolvedTemplate.layerStack, // NEW: Layer support
      model: modelRequested && FLAGS.FEATURE_MODEL_SELECTION ? modelRequested : undefined, // NEW: Model selection
      seed: seed, // NEW: Reproducibility
      temperature: temperature, // NEW: Reproducibility
      templateVersion: templateVersion, // NEW: Template version selection (optional, backward compatible)
      language: finalInputLanguage,
      content: transcript,
      correlationId,
      options: {
        prompt_hash: finalPromptHash, // NEW: Prompt version tracking
      }
    });
    const processingLatency = Date.now() - processingStartTime;
    
    // Record metrics
    if (modelRequested) {
      const provider = modelRequested.startsWith('gpt-') ? 'openai' : 
                      modelRequested.startsWith('claude-') ? 'anthropic' : 
                      modelRequested.startsWith('gemini-') ? 'google' : 'unknown';
      metrics.recordLatency(processingLatency, { provider, model: modelRequested, template: resolvedTemplate.templateRef });
      
      // Record token usage if available
      if (orchestrated.operational?.tokensIn && orchestrated.operational?.tokensOut) {
        metrics.recordTokens(orchestrated.operational.tokensIn, { provider, model: modelRequested, type: 'input' });
        metrics.recordTokens(orchestrated.operational.tokensOut, { provider, model: modelRequested, type: 'output' });
      }
      
      // Record cost if available
      if (orchestrated.operational?.costUsd) {
        metrics.recordCost(orchestrated.operational.costUsd, { provider, model: modelRequested });
      }
    }
    
    // Prepare operational metadata
    // Determine which model was actually used (explicit or default)
    const actualModelUsed = modelRequested || 
      (FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT ? 'claude-3-5-sonnet' : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini'));
    
    const operationalMetadata = orchestrated.operational || {
      latencyMs: processingLatency,
      model: actualModelUsed, // Include default model if none was explicitly requested
      deterministic: seed !== undefined,
    };
    
    // Ensure model is set even if orchestrated.operational exists but model is missing
    if (!operationalMetadata.model) {
      operationalMetadata.model = actualModelUsed;
    }

    // Determine if processing was deterministic (seed was used and provider supports it)
    const isDeterministic = seed !== undefined && (orchestrated.operational?.deterministic ?? true);

    // Run shadow mode comparison if enabled
    const shadowResult = await ShadowModeHook.runShadowComparison({
      transcript,
      section: section as '7' | '8' | '11',
      language: finalInputLanguage as 'fr' | 'en',
      inputLanguage: finalInputLanguage as 'fr' | 'en',
      outputLanguage: finalOutputLanguage as 'fr' | 'en',
      templateId: case_id || templateId || resolvedTemplate.templateRef
    });

    // Prepare response with operational fields (always included, optional for backward compatibility)
    const response = {
      formatted: orchestrated.processedContent,
      issues: [],
      sources_used: [],
      confidence_score: 0.8,
      clinical_entities: [],
      success: true,
      // Operational fields (always included, optional for backward compatibility)
      template_base: resolvedTemplate.baseTemplateId || undefined,
      layerStack: resolvedTemplate.layerStack || undefined,
      stack_fingerprint: resolvedTemplate.stack_fingerprint || undefined,
      prompt_hash: finalPromptHash || undefined,
      operational: operationalMetadata,
      deterministic: isDeterministic,
      ...(shadowResult && { shadowComparison: shadowResult })
    };

    // Cache result for idempotency (24h TTL)
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        result: response,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      });
      // Cleanup old entries periodically
      if (idempotencyCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of idempotencyCache.entries()) {
          if (value.expiresAt < now) {
            idempotencyCache.delete(key);
          }
        }
      }
    }

    return res.json(response);

  } catch (error) {
    const errorLatency = Date.now() - requestStartTime;
    console.error(`[${traceId}] Mode 2 formatting error:`, error);
    
    // Record failure metrics
    const modelRequested = req.body.model;
    if (modelRequested) {
      const provider = modelRequested.startsWith('gpt-') ? 'openai' : 
                      modelRequested.startsWith('claude-') ? 'anthropic' : 
                      modelRequested.startsWith('gemini-') ? 'google' : 'unknown';
      
      // Convert to standardized error if possible
      const { AIError } = await import('../lib/aiErrors.js');
      let errorType = 'UNKNOWN';
      let userMessage = 'Failed to format transcript';
      
      if (error instanceof AIError) {
        errorType = error.type;
        userMessage = error.getUserMessage();
      } else if (error instanceof Error) {
        errorType = error.name || 'UNKNOWN';
        userMessage = error.message || 'Failed to format transcript';
      }
      
      metrics.recordFailure({ provider, model: modelRequested, error_type: errorType });
      
      return res.status(500).json({ 
        error: userMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        traceId, // Include trace ID in error response
        operational: {
          latencyMs: errorLatency,
        }
      });
    }
    
    // Fallback for non-model errors
    return res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error',
      traceId,
      operational: {
        latencyMs: errorLatency,
      }
    });
  }
});

export default router;
