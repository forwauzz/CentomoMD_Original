/**
 * Benchmark API Routes
 * Handles benchmark comparison, statistical analysis, and evaluation runs
 */

import { Router } from 'express';
import { FLAGS, isAllowedForExperiment } from '../config/flags.js';
import { wilcoxonSignedRankTest, bootstrapConfidenceInterval, cohensD } from '../lib/statistics.js';
import { getDb } from '../database/connection.js';
import { eval_runs, eval_results } from '../database/schema.js';
import { getAIProvider } from '../lib/aiProvider.js';

const router = Router();

/**
 * POST /api/benchmark
 * Compare template outputs against a shared original transcript and reference benchmark
 * 
 * Request body:
 * {
 *   original: string (shared for all templates)
 *   reference: string (shared benchmark - MD final version)
 *   templates: Array<{ name: string, output: string }>
 *   config: {
 *     templateRef?: string
 *     model?: string
 *     section?: string
 *     language?: string
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    // Check feature flag
    if (!FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS) {
      return res.status(403).json({
        success: false,
        error: 'Benchmark comparison is not enabled',
      });
    }

    // Check allowlist
    const userEmail = req.headers['x-user-email'] as string ||
                      (req.query['email'] as string) ||
                      undefined;

    if (!isAllowedForExperiment(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to use benchmark comparison. Contact your administrator.',
      });
    }

    const { original, reference, templates, combinations, autoGenerate, config } = req.body;

    // Validate shared fields
    if (!original || !original.trim()) {
      return res.status(400).json({
        success: false,
        error: 'original transcript is required (shared for all combinations)',
      });
    }

    if (!reference || !reference.trim()) {
      return res.status(400).json({
        success: false,
        error: 'reference/benchmark output is required (shared MD final version)',
      });
    }

    // Support both manual mode (templates with pre-formatted outputs) and auto-generate mode (combinations with model+template)
    let templateOutputs: Array<{ name: string; output: string; model?: string; templateId?: string; requestedModel?: string }> = [];
    
    if (autoGenerate && combinations && Array.isArray(combinations) && combinations.length > 0) {
      // Auto-generate mode: format transcript with each model+template combination
      console.log('[Benchmark] Auto-generating outputs for combinations:', combinations.length);
      
      // Import format router dynamically to avoid circular dependency
      const formatRouter = await import('./format.js').catch(() => null);
      if (!formatRouter) {
        return res.status(500).json({
          success: false,
          error: 'Failed to load format router for auto-generation',
        });
      }

      // Generate outputs for each combination
      for (const combination of combinations) {
        const { name, model, templateId, templateRef, templateVersion } = combination;
        
        if (!model || !templateId) {
          console.warn(`[Benchmark] Skipping combination "${name}": missing model or templateId`);
          continue;
        }

        try {
          // Import the processing orchestrator (same as format endpoint)
          const { processingOrchestrator } = await import('../services/processing/ProcessingOrchestrator.js');
          const { LayerManager } = await import('../services/layers/LayerManager.js');
          const layerManager = new LayerManager();
          
          // Resolve template identity (same logic as format endpoint)
          let resolvedTemplate: {
            templateRef: string;
            baseTemplateId: string;
            layerStack: string[];
            stack_fingerprint: string;
          };
          
          try {
            resolvedTemplate = layerManager.resolveTemplateIdentity(
              templateRef || templateId,
              templateId,
              undefined // No legacy templateCombo
            );
          } catch (error) {
            console.warn(`[Benchmark] Template not found: ${templateId}`, error);
            templateOutputs.push({
              name: name || `${model} + ${templateId}`,
              output: '',
              model,
              templateId,
            });
            continue;
          }

          // Determine section from template or config
          const section = config?.section?.replace('section_', '') || '7';
          
          // Process transcript with this model+template combination
          const correlationId = `benchmark-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
          
          // Build processing request (omit seed if not provided to avoid undefined)
          const processingRequest: {
            sectionId: string;
            modeId: string;
            templateId: string;
            layerStack: string[];
            model?: string;
            temperature?: number;
            templateVersion?: string; // NEW: Template version selection (optional, backward compatible)
            language: string;
            content: string;
            correlationId: string;
            options?: Record<string, any>;
          } = {
            sectionId: `section_${section}`,
            modeId: 'mode2', // Use mode2 (smart dictation)
            templateId: resolvedTemplate.baseTemplateId,
            layerStack: resolvedTemplate.layerStack,
            temperature: 0.1, // Use consistent temperature for comparison
            templateVersion: templateVersion, // NEW: Template version selection (optional, backward compatible)
            language: config?.language || 'fr',
            content: original.trim(),
            correlationId,
            options: {
              // Additional options if needed
            },
          };
          
          // Add model if provided
          if (model) {
            // Check if model is enabled
            try {
              const { isModelEnabled, getModelVersion } = await import('../config/modelVersions.js');
              if (!isModelEnabled(model)) {
                const modelInfo = getModelVersion(model);
                const errorMsg = modelInfo?.featureFlag 
                  ? `Model ${model} requires feature flag ${modelInfo.featureFlag}=true (currently disabled)`
                  : `Model ${model} is not enabled`;
                console.warn(`[Benchmark] ${errorMsg}`);
                // Continue anyway - the provider will handle the validation
                // But log which model was requested vs what will be used
              } else {
                console.log(`[Benchmark] Model ${model} is enabled and will be used`);
              }
            } catch (error) {
              console.warn(`[Benchmark] Could not check model enablement for ${model}:`, error);
            }
            processingRequest.model = model;
          }
          
          const processed = await processingOrchestrator.processContent(processingRequest);
          
          // Log the actual model used (from operational metadata if available)
          const actualModelUsed = processed.operational?.model || model || 'default';
          if (actualModelUsed !== model && model) {
            console.warn(`[Benchmark] Model requested: ${model}, but actual model used: ${actualModelUsed}`);
          } else {
            console.log(`[Benchmark] Model used: ${actualModelUsed} for ${templateId}`);
          }

          templateOutputs.push({
            name: name || `${actualModelUsed} + ${templateId}`,
            output: processed.processedContent || '',
            model: actualModelUsed, // Use actual model that was used
            templateId,
            requestedModel: model, // Keep track of what was requested
          });

          console.log(`[Benchmark] Generated output for ${actualModelUsed} + ${templateId}: ${processed.processedContent?.length || 0} chars`);
        } catch (error) {
          console.error(`[Benchmark] Failed to generate output for ${model} + ${templateId}:`, error);
          
          // PROOF: Log failure reason
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[PROOF] ⚠️ Benchmark - Model ${model} FAILED for ${templateId}: ${errorMessage}`, {
            requestedModel: model,
            templateId: templateId,
            errorType: error instanceof Error ? error.constructor.name : typeof error
          });
          
          // Store error in output for failed models
          templateOutputs.push({
            name: name || `${model} + ${templateId}`,
            output: `[ERROR] Model ${model} failed: ${errorMessage}`, // Store error in output
            model: 'FAILED', // Mark as failed
            templateId,
            requestedModel: model,
          });
        }
      }
    } else if (templates && Array.isArray(templates) && templates.length > 0) {
      // Manual mode: use pre-formatted outputs
      templateOutputs = templates.map((t: any) => ({
        name: t.name,
        output: t.output,
        model: t.model || 'unknown',
        templateId: t.templateId || 'unknown',
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either templates array (manual mode) or combinations array (auto-generate mode) is required',
      });
    }

    if (templateOutputs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No template outputs available for comparison',
      });
    }

    // Support both single-template (simple comparison) and multi-template (statistical analysis)
    const isStatisticalMode = templateOutputs.length >= 3;

    const {
      section = 'section_7',
      language = 'fr',
      evaluationModel: evaluationModelFromConfig,
    } = config || {};
    
    // Get evaluation model from config (for generating AI report)
    const evaluationModelForReport = evaluationModelFromConfig || 'gpt-4o-mini';

    console.log('[Benchmark] Processing template performance evaluation:', {
      templateCount: templateOutputs.length,
      autoGenerate,
      section,
      language,
    });

    // Calculate metrics for each template output (all use same original and reference)
    const results = templateOutputs.map((item: any, index: number) => {
      const { name, output, model, templateId, requestedModel } = item;

      // Check for failures (empty output or error message in output)
      if (!name || !output || !output.trim() || output.includes('[ERROR]') || model === 'FAILED') {
        const failureReason = output.includes('[ERROR]') 
          ? output.replace('[ERROR] ', '') 
          : 'Missing required fields: combination name or output';
        console.warn(`[PROOF] ⚠️ Benchmark Result - Model failed: ${model || requestedModel || 'unknown'}`, {
          templateId: templateId || 'unknown',
          failureReason: failureReason,
          outputLength: output?.length || 0
        });
        
        return {
          templateName: name || `Combination ${index + 1}`,
          model: model || 'FAILED',
          requestedModel: requestedModel || model || 'unknown',
          templateId: templateId || 'unknown',
          index,
          error: failureReason,
          failureInfo: {
            requestedModel: requestedModel || model,
            actualModel: model === 'FAILED' ? 'fallback or error' : model,
            reason: failureReason
          }
        };
      }

      // Calculate comparison metrics for this template
      const metrics = calculateComparisonMetrics(original.trim(), output.trim(), reference.trim());
      
      // Extract missing phrases (compared to original)
      const missingPhrases = extractMissingPhrases(original.trim(), output.trim());

      return {
        templateName: name,
        model: model || 'unknown',
        requestedModel: requestedModel || model || 'unknown', // Include requested model if different
        templateId: templateId || 'unknown',
        index,
        metrics,
        missingPhrases,
        outputLength: output.trim().length,
        outputPreview: output.trim().substring(0, 150) + (output.trim().length > 150 ? '...' : ''),
      };
    });

    // Rank templates by performance (overall score)
    const rankedResults = results
      .filter(r => !r.error && r.metrics)
      .sort((a, b) => (b.metrics?.overallScore || 0) - (a.metrics?.overallScore || 0))
      .map((r, rank) => ({
        ...r,
        rank: rank + 1,
      }));

    // Statistical analysis (only if 3+ templates)
    let statistics: any = null;
    if (isStatisticalMode) {
      // Extract scores for statistical analysis
      const templateScores = rankedResults
        .map(r => r.metrics?.overallScore || 0);

      if (templateScores.length >= 3) {
        // Statistical analysis
        const wilcoxon = wilcoxonSignedRankTest(templateScores.map(s => s - 100)); // Compare to perfect score
        const bootstrap = bootstrapConfidenceInterval(templateScores);

        // Calculate effect size
        const referenceScores = templateScores.map(() => 100); // Reference baseline
        const effectSize = cohensD(templateScores, referenceScores);

        statistics = {
          p_value: wilcoxon.pValue,
          ci_low: bootstrap.ciLow,
          ci_high: bootstrap.ciHigh,
          mean: bootstrap.mean,
          effect_size: effectSize,
          significant: wilcoxon.pValue < 0.05,
          wilcoxon_statistic: wilcoxon.statistic,
          sample_size: templateScores.length,
          mode: 'statistical',
        };
      }
    } else {
      // Single-template simple comparison
      const singleResult = rankedResults[0];
      if (singleResult && singleResult.metrics) {
        statistics = {
          overall_score: singleResult.metrics.overallScore,
          similarity: singleResult.metrics.similarity,
          word_count_diff: singleResult.metrics.wordCountDiff,
          sentence_count_diff: singleResult.metrics.sentenceCountDiff,
          content_preservation: singleResult.metrics.contentPreservation,
          formatting_accuracy: singleResult.metrics.formattingAccuracy,
          mode: 'simple',
        };
      }
    }

    // Store in database if available (only for statistical mode)
    let runId: string | undefined;
    try {
      const db = getDb();
      if (db && isStatisticalMode && statistics && statistics.mode === 'statistical') {
        // Use first combination's template/model for database entry (or 'unknown' if auto-generated)
        const firstValidResult = rankedResults.find(r => !r.error);
        const templateRefForDb = firstValidResult?.templateId || 'unknown';
        const modelForDb = firstValidResult?.model || evaluationModelForReport || 'unknown';
        
        const [run] = await db.insert(eval_runs).values({
          template_ref: templateRefForDb,
          model: modelForDb,
          section: section as 'section_7' | 'section_8' | 'section_11',
          lang: language as 'fr' | 'en',
          p_value: statistics.p_value?.toString(),
          ci_low: statistics.ci_low?.toString(),
          ci_high: statistics.ci_high?.toString(),
          success: true,
        }).returning({ id: eval_runs.id });

        if (run && run.id) {
          runId = run.id;

          // Store individual results
          for (const result of results) {
            if (!result.error && result.metrics) {
              await db.insert(eval_results).values({
                run_id: runId,
                metrics_json: result.metrics as any,
                overall_score: (result.metrics.overallScore || 0).toString(),
              });
            }
          }
        }
      }
    } catch (dbError) {
      console.warn('[Benchmark] Failed to store in database:', dbError);
      // Continue without database storage
    }

    // Best performing template
    const bestTemplate = rankedResults.length > 0 ? rankedResults[0] : null;

    const summary = isStatisticalMode && statistics ? {
      totalTemplates: templateOutputs.length,
      validTemplates: rankedResults.length,
      bestTemplate: bestTemplate?.templateName || null,
      bestScore: bestTemplate?.metrics?.overallScore || null,
      significant: statistics.significant,
      interpretation: statistics.significant
        ? (autoGenerate ? 'Model+template combinations show significant performance differences' : 'Templates show significant performance differences')
        : (autoGenerate ? 'No significant performance differences detected between model+template combinations' : 'No significant performance differences detected between templates'),
    } : {
      totalTemplates: templateOutputs.length,
      validTemplates: rankedResults.length,
      bestTemplate: bestTemplate?.templateName || null,
      bestScore: bestTemplate?.metrics?.overallScore || null,
      mode: 'simple',
      interpretation: bestTemplate ? 
        `Best performing: ${bestTemplate.templateName} (${bestTemplate.metrics?.overallScore?.toFixed(1)}% overall score)` :
        'Evaluation completed',
    };

    // Generate AI-powered evaluation report (using evaluationModel from config, default to gpt-4o-mini)
    let evaluationReport: string | null = null;
    try {
      evaluationReport = await generateEvaluationReport(
        original.trim(),
        reference.trim(),
        rankedResults,
        evaluationModelForReport // Pass model parameter
      );
      console.log('[Benchmark] AI evaluation report generated successfully', { model: evaluationModelForReport });
    } catch (reportError) {
      console.warn('[Benchmark] Failed to generate AI evaluation report:', reportError);
      // Continue without report - don't fail the entire request
    }

    return res.json({
      success: true,
      results: rankedResults, // Ranked by performance
      statistics,
      runId,
      summary,
      evaluationReport, // AI-generated evaluation report
      autoGenerated: autoGenerate || false, // Indicate if outputs were auto-generated
    });
  } catch (error) {
    console.error('[Benchmark] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process benchmark comparison',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper function to calculate comparison metrics
 */
function calculateComparisonMetrics(
  original: string,
  current: string,
  reference: string
): {
  overallScore: number;
  similarity: number;
  wordCountDiff: number;
  sentenceCountDiff: number;
  contentPreservation: number;
  formattingAccuracy: number;
} {
  // Calculate similarity (simple Jaccard-like metric)
  const currentWords = new Set(current.toLowerCase().split(/\s+/));
  const referenceWords = new Set(reference.toLowerCase().split(/\s+/));
  const intersection = new Set([...currentWords].filter(w => referenceWords.has(w)));
  const union = new Set([...currentWords, ...referenceWords]);
  const similarity = intersection.size / union.size;

  // Word count differences
  const wordCountDiff = Math.abs(current.split(/\s+/).length - reference.split(/\s+/).length);
  
  // Sentence count differences
  const sentenceCountDiff = Math.abs(
    current.split(/[.!?]+/).filter(s => s.trim()).length -
    reference.split(/[.!?]+/).filter(s => s.trim()).length
  );

  // Content preservation (how much of original is preserved in current vs reference)
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const currentPreserved = [...originalWords].filter(w => currentWords.has(w)).length;
  const contentPreservation = Math.min(100, (currentPreserved / originalWords.size) * 100);

  // Formatting accuracy (based on structural similarity)
  const formattingAccuracy = similarity * 100;

  // Overall score (weighted combination)
  const overallScore = (
    similarity * 40 +
    (1 - Math.min(wordCountDiff / 100, 1)) * 20 +
    contentPreservation / 100 * 30 +
    formattingAccuracy / 100 * 10
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    similarity: similarity * 100,
    wordCountDiff,
    sentenceCountDiff,
    contentPreservation,
    formattingAccuracy,
  };
}

/**
 * Extract missing phrases from template output compared to original transcript
 * Returns phrases (sentences or key phrases) that are in original but missing from template output
 */
function extractMissingPhrases(
  original: string,
  templateOutput: string
): string[] {
  // Simple sentence-based extraction
  // Split into sentences (considering common punctuation)
  const originalSentences = original
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Only meaningful sentences (min 10 chars)

  const templateSentences = templateOutput
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  // Convert to lowercase for comparison
  const templateLower = templateSentences.map(s => s.toLowerCase());
  
  // Find sentences in original that are not in template (using fuzzy matching)
  const missing: string[] = [];
  
  for (const origSentence of originalSentences) {
    const origLower = origSentence.toLowerCase();
    // Check if this sentence (or similar) exists in template
    const found = templateLower.some(templ => {
      // Exact match
      if (templ.includes(origLower) || origLower.includes(templ)) {
        return true;
      }
      // Check for significant word overlap (at least 50% of words)
      const origWords = origLower.split(/\s+/).filter(w => w.length > 3); // Skip very short words
      const templWords = templ.split(/\s+/).filter(w => w.length > 3);
      if (origWords.length === 0) return false;
      const overlap = origWords.filter(w => templWords.includes(w)).length;
      return overlap / origWords.length >= 0.5;
    });
    
    if (!found && origSentence.length > 20) { // Only include meaningful missing phrases
      missing.push(origSentence);
    }
  }

  // Limit to top 10 most significant missing phrases
  return missing.slice(0, 10);
}

/**
 * Generate AI-powered evaluation report using AIProvider abstraction
 * Analyzes template performance, hallucinations, and provides improvement recommendations
 * Supports multiple AI providers (OpenAI, Anthropic, Google) via model selection
 */
async function generateEvaluationReport(
  originalTranscript: string,
  referenceBenchmark: string,
  templateResults: Array<{
    templateName: string;
    rank?: number;
    metrics?: {
      overallScore: number;
      similarity: number;
      contentPreservation: number;
      formattingAccuracy: number;
      wordCountDiff: number;
    };
    missingPhrases?: string[];
    outputPreview?: string;
  }>,
  model: string = 'gpt-4o-mini' // Model selection parameter
): Promise<string> {
  // Use AIProvider abstraction to support multiple providers
  const provider = getAIProvider(model);

  // Build template comparison data for the prompt
  const templatesData = templateResults.map((result, index) => ({
    name: result.templateName || `Template ${index + 1}`,
    rank: result.rank || index + 1,
    overallScore: result.metrics?.overallScore || 0,
    similarity: result.metrics?.similarity || 0,
    contentPreservation: result.metrics?.contentPreservation || 0,
    formattingAccuracy: result.metrics?.formattingAccuracy || 0,
    wordCountDiff: result.metrics?.wordCountDiff || 0,
    missingPhrasesCount: result.missingPhrases?.length || 0,
    missingPhrases: result.missingPhrases?.slice(0, 3) || [], // Top 3 missing phrases
    outputPreview: result.outputPreview || '',
  }));

  const systemPrompt = `You are an expert medical transcription quality analyst. 

Your job is to compare multiple AI template outputs against a gold-standard reference written by a physician.

You identify strengths, weaknesses, and key areas for improvement in a clear, structured, and intuitive way — avoiding technical jargon.

Your tone is analytical but practical: focus on clarity, not theory.`;

  const userPrompt = `Evaluate the following template performance comparison:

ORIGINAL TRANSCRIPT:
${originalTranscript.substring(0, 2000)}${originalTranscript.length > 2000 ? '...' : ''}

REFERENCE (Gold Standard - MD Final):
${referenceBenchmark.substring(0, 2000)}${referenceBenchmark.length > 2000 ? '...' : ''}

TEMPLATE PERFORMANCE RESULTS:
${templatesData.map(t => `
${t.rank === 1 ? '🏆 BEST PERFORMING: ' : `#${t.rank}: `}${t.name}
- Overall Score: ${t.overallScore.toFixed(1)}%
- Similarity to Reference: ${t.similarity.toFixed(1)}%
- Content Preservation: ${t.contentPreservation.toFixed(1)}%
- Formatting Accuracy: ${t.formattingAccuracy.toFixed(1)}%
- Word Count Difference: ${t.wordCountDiff}
- Missing Phrases: ${t.missingPhrasesCount}
${t.missingPhrases.length > 0 ? `- Top Missing Phrases:\n${t.missingPhrases.map((p, i) => `  ${i + 1}. ${p.substring(0, 100)}${p.length > 100 ? '...' : ''}`).join('\n')}` : ''}
${t.outputPreview ? `- Output Preview: ${t.outputPreview.substring(0, 200)}${t.outputPreview.length > 200 ? '...' : ''}` : ''}
`).join('\n---\n')}

---

Generate a clear, structured evaluation using the format below:

==============================
🏁 OVERVIEW (Quick Summary)
- Rank templates from best to worst overall.
- State the top 3 reasons why the best template performed better.
- Summarize major differences in readability, accuracy, and completeness in one paragraph.

==============================
🔍 HALLUCINATION CHECK
- Identify any invented, distorted, or medically inaccurate content per template.
- Use ✅ None, ⚠️ Mild, or ❌ Major for each.
- Provide short examples of fabricated or exaggerated phrases if any.

==============================
🧩 CONTENT PRESERVATION
- Score and explain how well each template preserved original meaning and detail.
- Highlight **what types of details are commonly lost** (e.g., timelines, causes, follow-up plans).
- Note any consistent omissions or truncations.

==============================
🧱 STRUCTURE & FORMATTING
- Compare formatting fidelity and readability.
- Note if sentence flow or section organization aligns with the gold standard.
- Flag structural issues like missing headings, collapsed paragraphs, or merged sections.

==============================
📊 PERFORMANCE COMPARISON TABLE
| Template | Overall | Similarity | Hallucination | Content Preservation | Formatting | Key Strength | Key Weakness |
|----------|---------|------------|---------------|----------------------|------------|--------------|--------------|
${templatesData.map(t => `| ${t.name} | ${t.overallScore.toFixed(1)}% | ${t.similarity.toFixed(1)}% | ${t.missingPhrasesCount === 0 ? '✅ None' : t.missingPhrasesCount < 3 ? '⚠️ Mild' : '❌ Major'} | ${t.contentPreservation >= 90 ? 'Excellent' : t.contentPreservation >= 75 ? 'Good' : 'Poor'} | ${t.formattingAccuracy >= 85 ? 'Strong' : t.formattingAccuracy >= 70 ? 'Fair' : 'Weak'} | [AI to fill] | [AI to fill] |`).join('\n')}

==============================
🩺 INSIGHT SUMMARY
- Identify 3 biggest flaws across *all* templates (systemic issues).
- Identify 3 recurring strengths that can be reused in future templates.

==============================
🧭 IMPROVEMENT RECOMMENDATIONS
For each template:
1. Give 2–3 **specific, actionable** improvements (e.g., "Add symptom progression timeline after diagnosis" or "Preserve paragraph breaks from original").
2. Highlight which improvements would yield the highest scoring gain.

==============================
🎯 FINAL VERDICT
In one paragraph, summarize:
- Which template is best suited for clinical use now.
- Which has most potential after refinement.
- Which should be deprioritized or redesigned.

Write the report in clear, concise language. Focus on actionable insights and specific examples from the data provided.`;

  try {
    const response = await provider.createCompletion({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
    });

    const report = response.content;
    if (!report) {
      throw new Error('AI provider returned empty response');
    }

    console.log('[Benchmark] Evaluation report generated', {
      model: model,
      provider: provider.name,
      reportLength: report.length,
      cost: response.cost_usd,
    });

    return report;
  } catch (error) {
    console.error('[Benchmark] AI API error:', error);
    throw new Error(`Failed to generate evaluation report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default router;

