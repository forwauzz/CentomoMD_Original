/**
 * Benchmark API Routes
 * Handles benchmark comparison, statistical analysis, and evaluation runs
 */

import { Router } from 'express';
import { FLAGS, isAllowedForExperiment } from '../config/flags.js';
import { wilcoxonSignedRankTest, bootstrapConfidenceInterval, cohensD } from '../lib/statistics.js';
import { getDb } from '../database/connection.js';
import { eval_runs, eval_results } from '../database/schema.js';
import OpenAI from 'openai';

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

    const { original, reference, templates, config } = req.body;

    // Validate shared fields
    if (!original || !original.trim()) {
      return res.status(400).json({
        success: false,
        error: 'original transcript is required (shared for all templates)',
      });
    }

    if (!reference || !reference.trim()) {
      return res.status(400).json({
        success: false,
        error: 'reference/benchmark output is required (shared MD final version)',
      });
    }

    // Validate templates array
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'templates array is required and must contain at least one template output',
      });
    }

    // Support both single-template (simple comparison) and multi-template (statistical analysis)
    const isStatisticalMode = templates.length >= 3;

    const {
      templateRef = 'unknown',
      model = 'unknown',
      section = 'section_7',
      language = 'fr',
    } = config || {};

    console.log('[Benchmark] Processing template performance evaluation:', {
      templateCount: templates.length,
      templateRef,
      model,
      section,
      language,
    });

    // Calculate metrics for each template (all use same original and reference)
    const results = templates.map((template: any, index: number) => {
      const { name, output } = template;

      if (!name || !output || !output.trim()) {
        return {
          templateName: name || `Template ${index + 1}`,
          index,
          error: 'Missing required fields: template name or output',
        };
      }

      // Calculate comparison metrics for this template
      const metrics = calculateComparisonMetrics(original.trim(), output.trim(), reference.trim());
      
      // Extract missing phrases (compared to original)
      const missingPhrases = extractMissingPhrases(original.trim(), output.trim());

      return {
        templateName: name,
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
        const [run] = await db.insert(eval_runs).values({
          template_ref: templateRef,
          model: model,
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
      totalTemplates: templates.length,
      validTemplates: rankedResults.length,
      bestTemplate: bestTemplate?.templateName || null,
      bestScore: bestTemplate?.metrics?.overallScore || null,
      significant: statistics.significant,
      interpretation: statistics.significant
        ? 'Templates show significant performance differences'
        : 'No significant performance differences detected between templates',
    } : {
      totalTemplates: templates.length,
      validTemplates: rankedResults.length,
      bestTemplate: bestTemplate?.templateName || null,
      bestScore: bestTemplate?.metrics?.overallScore || null,
      mode: 'simple',
      interpretation: bestTemplate ? 
        `Best performing: ${bestTemplate.templateName} (${bestTemplate.metrics?.overallScore?.toFixed(1)}% overall score)` :
        'Evaluation completed',
    };

    // Generate AI-powered evaluation report
    let evaluationReport: string | null = null;
    try {
      evaluationReport = await generateEvaluationReport(
        original.trim(),
        reference.trim(),
        rankedResults
      );
      console.log('[Benchmark] AI evaluation report generated successfully');
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
 * Generate AI-powered evaluation report using OpenAI
 * Analyzes template performance, hallucinations, and provides improvement recommendations
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
  }>
): Promise<string> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey });

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

  const systemPrompt = `You are an expert medical transcription quality analyst specializing in template performance evaluation. Your role is to analyze template outputs against a gold standard reference and provide actionable insights.`;

  const userPrompt = `Evaluate the following template performance comparison:

ORIGINAL TRANSCRIPT:
${originalTranscript.substring(0, 2000)}${originalTranscript.length > 2000 ? '...' : ''}

REFERENCE/BENCHMARK (Gold Standard - MD Final):
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

Provide a comprehensive evaluation report in the following structure:

1. PERFORMANCE SUMMARY
   - Compare overall performance metrics
   - Identify which template performed best and why
   - Highlight key differences in scores

2. HALLUCINATION ANALYSIS
   - Analyze each template for potential hallucinations (content not in original)
   - Identify any fabricated or incorrectly inferred information
   - Compare hallucination risk across templates

3. CONTENT PRESERVATION ANALYSIS
   - Evaluate how well each template preserved original content
   - Analyze missing phrases and their impact
   - Identify patterns in what content is being lost

4. PERFORMANCE COMPARISON
   - Explain why the best-performing template scored higher
   - Compare strengths and weaknesses of each template
   - Highlight specific metrics that differentiate performance

5. IMPROVEMENT RECOMMENDATIONS
   - For each template, provide specific, actionable recommendations
   - Suggest prompt improvements, formatting rules, or processing steps
   - Recommend prioritization for template refinement

Write the report in clear, concise language. Focus on actionable insights and specific examples from the data provided.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using efficient model for evaluation
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
    });

    const report = completion.choices[0]?.message?.content;
    if (!report) {
      throw new Error('OpenAI returned empty response');
    }

    return report;
  } catch (error) {
    console.error('[Benchmark] OpenAI API error:', error);
    throw new Error(`Failed to generate evaluation report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default router;

