import { Router } from 'express';
import { ENV } from '../config/env.js';
// Mode2Formatter may not exist in some environments; use dynamic import with fallback stub
import { ShadowModeHook } from '../services/shadow/ShadowModeHook.js';

const router = Router();

// POST /api/format/merge/section11 - Generate Section 11 from other sections
router.post('/merge/section11', async (req, res) => {
  try {
    const { caseId, sourceSections = ['section_7', 'section_8', 'section_9'] } = req.body;

    if (!caseId) {
      return res.status(400).json({ 
        error: 'Missing required field: caseId' 
      });
    }

    // TODO: Fetch actual section data from database
    // TODO: Implement AI formatting pipeline
    console.log('🤖 [Format] Generating Section 11 for case:', caseId);
    console.log('📋 [Format] Source sections:', sourceSections);

    // For now, return a stub response
    const autoSummary = `Conclusion générée automatiquement à partir des sections ${sourceSections.join(', ')}.

Ceci est un exemple de contenu généré par l'IA. Dans la version finale, ce contenu sera généré en analysant les données des sections sources et en appliquant les templates de formatage appropriés.

[STUB] - Pipeline de formatage IA à implémenter`;

    return res.json({
      success: true,
      caseId,
      sourceSections,
      autoSummary,
      generatedAt: new Date().toISOString(),
      message: 'Section 11 merge endpoint stub - AI pipeline pending'
    });
  } catch (error) {
    console.error('❌ [Format] Failed to generate Section 11:', error);
    return res.status(500).json({ error: 'Failed to generate Section 11' });
  }
});

// Mode 2 Formatting Endpoint (Smart Dictation)
router.post('/mode2', async (req, res) => {
  try {
    const { 
      transcript, 
      section, 
      language, // Legacy parameter for backward compatibility
      inputLanguage, 
      outputLanguage, 
      case_id, 
      selected_sections, 
      extra_dictation,
      // Template combination parameters
      templateCombo,
      verbatimSupport,
      voiceCommandsSupport,
      templateId
    } = req.body;
    
    console.log('[API] Mode2 request body:', {
      section,
      language,
      inputLanguage,
      outputLanguage,
      templateId,
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

    // Development mode: no auth required

    // Route to the decoupled ProcessingOrchestrator (minimal change, keeps existing contracts)
    const { processingOrchestrator } = await import('../services/processing/ProcessingOrchestrator.js');

    // Select template id: honor explicit templateId, else map by section (7/8). Section 11 is not supported by orchestrator handlers.
    const mappedTemplateId = templateId || (section === '7' ? 'section7-ai-formatter' : section === '8' ? 'section8-ai-formatter' : undefined);
    if (!mappedTemplateId) {
      return res.status(400).json({ error: 'No formatter available for the requested section' });
    }

    const correlationId = `mode2-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;

    const orchestrated = await processingOrchestrator.processContent({
      sectionId: `section_${section}`,
      modeId: 'mode2',
      templateId: mappedTemplateId,
      language: finalInputLanguage,
      content: transcript,
      correlationId
    });
    
    const result = {
      formatted: orchestrated.processedContent,
      issues: [],
      sources_used: [],
      confidence_score: 0.8,
      clinical_entities: []
    };

    // Run shadow mode comparison if enabled
    const shadowResult = await ShadowModeHook.runShadowComparison({
      transcript,
      section: section as '7' | '8' | '11',
      language: finalInputLanguage as 'fr' | 'en',
      inputLanguage: finalInputLanguage as 'fr' | 'en',
      outputLanguage: finalOutputLanguage as 'fr' | 'en',
      templateId: case_id || templateId
    });

    // Return the formatted result
    return res.json({
      formatted: result.formatted,
      issues: result.issues,
      sources_used: result.sources_used,
      confidence_score: result.confidence_score,
      clinical_entities: result.clinical_entities,
      success: true,
      ...(shadowResult && { shadowComparison: shadowResult })
    });

  } catch (error) {
    console.error('Mode 2 formatting error:', error);
    return res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
