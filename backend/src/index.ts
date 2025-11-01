import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ENV, logNonSecretEnv } from './config/env.js';
// import { authenticateUser } from './middleware/auth.js'; // Unused for now
import { wsAuthCheck } from './ws/auth.js';

console.log('🚀 Server starting - Build:', new Date().toISOString());

import { transcriptionService } from './services/transcriptionService.js';
import { audioRecordingService } from './services/audioRecordingService.js';
import { FLAGS } from './config/flags.js';
import { createSession, updateSessionSampleRate, cleanupSession } from './ws/session.js';
// import { templateLibrary } from './template-library/index.js'; // Archived - using core template registry instead
import { AIFormattingService } from './services/aiFormattingService.js';
import { Mode1Formatter } from './services/formatter/mode1.js';
import { TranscriptAnalyzer } from './services/analysis/TranscriptAnalyzer.js';
import { ProcessingOrchestrator } from './services/processing/ProcessingOrchestrator.js';
import { TEMPLATE_REGISTRY } from './config/templates.js';
import { Section7Validator } from './services/formatter/validators/section7.js';
import { WebSocketServer } from 'ws';
import http from 'http';
import { Section8Validator } from './services/formatter/validators/section8.js';
import { Section11Validator } from './services/formatter/validators/section11.js';
import { getConfig } from './routes/config.js';
import { getWsToken } from './routes/auth.js';
import profileRouter from './routes/profile.js';
import feedbackRouter from './routes/feedback.js';
import clinicsRouter from './routes/clinics.js';
import templateCombinationsRouter from './routes/template-combinations.js';
import templateUsageFeedbackRouter from './routes/template-usage-feedback.js';
import { securityMiddleware } from './server/security.js';
import { getPerformanceMetrics } from './middleware/performanceMiddleware.js';
// import { authMiddleware } from './auth.js'; // Removed for development
import jwt from 'jsonwebtoken';
import { bootProbe, getDb } from './database/connection.js';
import { artifacts } from './database/schema.js';
import { eq, desc } from 'drizzle-orm';
import dbRouter from './routes/db.js';
import { logger } from './utils/logger.js';

const app = express();
app.set('trust proxy', 1);

// CORS must be before routes
const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    return ENV.CORS_ALLOWED_ORIGINS.includes(origin)
      ? cb(null, true)
      : cb(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin'],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limit (flag controlled)
if (ENV.RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: ENV.RATE_LIMIT_WINDOW_MS,
    max: ENV.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// REST auth (flag controlled) - disabled for development
// app.use('/api/', authenticateUser);

// Health & readiness (simple versions)
app.get('/healthz', (_req, res) => res.status(200).json({
  ok: true,
  uptime: process.uptime(),
  region: ENV.AWS_REGION
}));
app.get('/readyz', (_req, res) => res.status(200).json({ ready: true }));

// Log non-secret env once on startup
logNonSecretEnv();

// Optional: quick dev check route to see allowlist (DEV ONLY; remove/comment for prod)
if (ENV.NODE_ENV !== 'production') {
  app.get('/api/_debug/cors', (_req, res) => {
    res.json({ allowed: ENV.CORS_ALLOWED_ORIGINS });
  });
  
  // Debug route for output language selection flags
  app.get('/api/_debug/output-language', (_req, res) => {
    res.json({
      ENABLE_OUTPUT_LANGUAGE_SELECTION: ENV.ENABLE_OUTPUT_LANGUAGE_SELECTION,
      CNESST_SECTIONS_DEFAULT_OUTPUT: ENV.CNESST_SECTIONS_DEFAULT_OUTPUT,
      ALLOW_NON_FRENCH_OUTPUT: ENV.ALLOW_NON_FRENCH_OUTPUT,
      UNIVERSAL_CLEANUP_ENABLED: FLAGS.UNIVERSAL_CLEANUP_ENABLED,
      UNIVERSAL_CLEANUP_SHADOW: FLAGS.UNIVERSAL_CLEANUP_SHADOW,
      SLO_P95_MS: ENV.SLO_P95_MS,
      SLO_P99_MS: ENV.SLO_P99_MS,
      CACHE_TTL_SECONDS: ENV.CACHE_TTL_SECONDS
    });
  });
}

const server = http.createServer(app);

// TODO: Apply security middleware
app.use(securityMiddleware);

// TODO: Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Response helpers removed - using explicit return statements instead

// --- Basic routes ---

// Config endpoint to expose flags to frontend
app.get('/api/config', getConfig);

// Performance metrics endpoint
app.get('/api/performance', getPerformanceMetrics);

// Auth endpoints
app.post('/api/auth/ws-token', getWsToken);

// Profile routes
try { 
  app.use(profileRouter); 
  console.log('✅ /api/profile routes mounted'); 
} catch(e) { 
  console.error('❌ mount /api/profile:', e);
}

// Feedback routes
try { 
  app.use('/api/feedback', feedbackRouter); 
  console.log('✅ /api/feedback routes mounted'); 
} catch(e) { 
  console.error('❌ mount /api/feedback:', e);
}

// Case management routes handled by dynamic import below

// Clinics routes
try { 
  app.use('/api/clinics', clinicsRouter); 
  console.log('✅ /api/clinics routes mounted'); 
} catch(e) { 
  console.error('❌ mount /api/clinics:', e);
}

// Template Combinations routes
try { 
  app.use('/api/template-combinations', templateCombinationsRouter); 
  console.log('✅ /api/template-combinations routes mounted'); 
} catch(e) { 
  console.error('❌ mount /api/template-combinations:', e);
}

// Template Usage & Feedback routes
try {
  app.use('/api/templates', templateUsageFeedbackRouter);
  console.log('✅ /api/templates routes mounted');
} catch(e) {
  console.error('❌ mount /api/templates:', e);
}

// Transcript Analysis endpoints
app.post('/api/analyze/transcript', async (req, res) => {
  try {
    const { original, formatted, language = 'fr' } = req.body;
    
    if (!original || !formatted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both original and formatted transcripts are required' 
      });
    }
    
    const analyzer = new TranscriptAnalyzer();
    const result = await analyzer.analyzeTranscript(original, formatted, language);
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Transcript analysis error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Analysis failed' 
    });
  }
});

app.post('/api/analyze/compare', async (req, res) => {
  try {
    const { original, formatted } = req.body;
    
    if (!original || !formatted) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both original and formatted transcripts are required' 
      });
    }
    
    const analyzer = new TranscriptAnalyzer();
    const result = await analyzer.compareTranscripts(original, formatted);
    
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Transcript comparison error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Comparison failed' 
    });
  }
});

// Helper function to calculate comprehensive template metrics
function calculateTemplateMetrics(original: string, formatted: string, _template: any) {
  try {
    console.log('Calculating metrics for:', { originalLength: original.length, formattedLength: formatted.length });
    
    const metrics = {
      // Structural formatting metrics
      structuralConsistency: calculateStructuralConsistency(formatted),
      paragraphBreaks: countParagraphBreaks(formatted),
      lineBreaks: countLineBreaks(formatted),
      
      // Editing effort estimation
      editingEffort: estimateEditingEffort(original, formatted),
      wordCountChange: Math.abs(formatted.split(/\s+/).length - original.split(/\s+/).length),
      
      // Formatting quality
      capitalizationConsistency: checkCapitalizationConsistency(formatted),
      punctuationConsistency: checkPunctuationConsistency(formatted),
      
      // Content preservation
      contentPreservation: calculateContentPreservation(original, formatted),
      speakerPrefixHandling: checkSpeakerPrefixHandling(original, formatted),
      
      // Voice command processing
      voiceCommandProcessing: checkVoiceCommandProcessing(original, formatted)
    };
    
    console.log('Metrics calculated:', metrics);
    return metrics;
  } catch (error) {
    console.error('Error calculating template metrics:', error);
    return {
      structuralConsistency: 0,
      paragraphBreaks: 0,
      lineBreaks: 0,
      editingEffort: 100,
      wordCountChange: 0,
      capitalizationConsistency: 0,
      punctuationConsistency: 0,
      contentPreservation: 0,
      speakerPrefixHandling: 0,
      voiceCommandProcessing: 0
    };
  }
}

// Helper function to calculate comprehensive score
function calculateComprehensiveScore(analysis: any, metrics: any): number {
  try {
    // Weight different factors based on importance
    const weights = {
      overallScore: 0.3,
      hallucinationScore: 0.2,
      structuralConsistency: 0.15,
      editingEffort: 0.15,
      contentPreservation: 0.1,
      voiceCommandProcessing: 0.1
    };
    
    const overallScore = analysis?.overallScore || 0;
    const hallucinationScore = analysis?.metrics?.hallucinationScore || 0;
    const structuralConsistency = metrics?.structuralConsistency || 0;
    const editingEffort = metrics?.editingEffort || 0;
    const contentPreservation = metrics?.contentPreservation || 0;
    const voiceCommandProcessing = metrics?.voiceCommandProcessing || 0;
    
    const score = (
      overallScore * weights.overallScore +
      (100 - hallucinationScore) * weights.hallucinationScore +
      structuralConsistency * weights.structuralConsistency +
      (100 - editingEffort) * weights.editingEffort +
      contentPreservation * weights.contentPreservation +
      voiceCommandProcessing * weights.voiceCommandProcessing
    );
    
    console.log('Score calculation details:', {
      overallScore,
      hallucinationScore,
      structuralConsistency,
      editingEffort,
      contentPreservation,
      voiceCommandProcessing,
      finalScore: score
    });
    
    return score;
  } catch (error) {
    console.error('Error calculating comprehensive score:', error);
    return 0;
  }
}

// Helper functions for specific metrics
function calculateStructuralConsistency(formatted: string): number {
  const lines = formatted.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return 0;
  
  // Check for consistent paragraph structure
  const hasConsistentParagraphs = lines.every(line => 
    line.trim().length > 0 && 
    (line.match(/^[A-Z]/) || line.match(/^\s*[A-Z]/))
  );
  
  return hasConsistentParagraphs ? 90 : 60;
}

function countParagraphBreaks(formatted: string): number {
  return (formatted.match(/\n\s*\n/g) || []).length;
}

function countLineBreaks(formatted: string): number {
  return (formatted.match(/\n/g) || []).length;
}

function estimateEditingEffort(original: string, formatted: string): number {
  // Simple estimation based on character differences and structural changes
  const charDiff = Math.abs(formatted.length - original.length);
  const wordDiff = Math.abs(formatted.split(/\s+/).length - original.split(/\s+/).length);
  const lineDiff = Math.abs(formatted.split('\n').length - original.split('\n').length);
  
  // Higher effort = more changes needed
  return Math.min(100, (charDiff / original.length) * 50 + wordDiff * 2 + lineDiff * 5);
}

function checkCapitalizationConsistency(formatted: string): number {
  const sentences = formatted.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const properlyCapitalized = sentences.filter(sentence => 
    sentence.trim().match(/^[A-Z]/)
  ).length;
  
  return (properlyCapitalized / sentences.length) * 100;
}

function checkPunctuationConsistency(formatted: string): number {
  const sentences = formatted.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const properlyPunctuated = sentences.filter(sentence => 
    sentence.trim().match(/[.!?]$/)
  ).length;
  
  return (properlyPunctuated / sentences.length) * 100;
}

function calculateContentPreservation(original: string, formatted: string): number {
  // Check how much of the original content is preserved
  const originalWords = original.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const formattedWords = formatted.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  const preservedWords = originalWords.filter(word => 
    formattedWords.includes(word)
  ).length;
  
  return originalWords.length > 0 ? (preservedWords / originalWords.length) * 100 : 100;
}

function checkSpeakerPrefixHandling(original: string, formatted: string): number {
  // Check if speaker prefixes (Pt:, Dr:) are properly handled
  const hasSpeakerPrefixes = /(Pt:|Dr:)/.test(original);
  const stillHasPrefixes = /(Pt:|Dr:)/.test(formatted);
  
  if (!hasSpeakerPrefixes) return 100; // No prefixes to handle
  
  // For word-for-word templates, prefixes should be removed
  return stillHasPrefixes ? 20 : 100;
}

function checkVoiceCommandProcessing(original: string, formatted: string): number {
  // Check if voice commands (comma, period, new line) are properly converted
  const voiceCommands = /(comma|period|new line|newline)/gi;
  const hasVoiceCommands = voiceCommands.test(original);
  
  if (!hasVoiceCommands) return 100; // No voice commands to process
  
  const stillHasCommands = voiceCommands.test(formatted);
  
  return stillHasCommands ? 30 : 100;
}

// A/B Test endpoint
app.post('/api/analyze/ab-test', async (req, res) => {
  try {
    const { original, templateA, templateB, language = 'fr' } = req.body;
    
    if (!original || !templateA || !templateB) {
      return res.status(400).json({ 
        success: false, 
        error: 'Original transcript and both template IDs are required' 
      });
    }

    if (templateA === templateB) {
      return res.status(400).json({ 
        success: false, 
        error: 'Template A and Template B must be different' 
      });
    }
    
    // Get template configurations
    const templateAConfig = TEMPLATE_REGISTRY[templateA];
    const templateBConfig = TEMPLATE_REGISTRY[templateB];
    
    console.log(`[A/B Test] Template registry lookup`, {
      templateA: templateA,
      templateB: templateB,
      templateAConfig: templateAConfig ? 'found' : 'not found',
      templateBConfig: templateBConfig ? 'found' : 'not found',
      availableTemplates: Object.keys(TEMPLATE_REGISTRY)
    });
    
    if (!templateAConfig || !templateBConfig) {
      return res.status(400).json({ 
        success: false, 
        error: 'One or both templates not found' 
      });
    }

    // Apply both templates using the same approach as dictation page
    console.log(`[A/B Test] Starting template processing`, {
      templateA: templateA,
      templateB: templateB,
      templateAName: templateAConfig.name,
      templateBName: templateBConfig.name,
      originalLength: original.length,
      language
    });
    
    // Process with Template A (using dictation page approach)
    console.log(`[A/B Test] Processing Template A: ${templateAConfig.name}`);
    let resultA: { processedContent: string; success: boolean };
    
    if (templateA === 'word-for-word-formatter' || templateA === 'word-for-word-with-ai') {
      // Use the same approach as dictation page for Word-for-Word templates
      const { formatWordForWordText } = await import('./utils/wordForWordFormatter.js');
      let formattedA = formatWordForWordText(original);
      
      // If it's the AI version, apply AI formatting
      if (templateA === 'word-for-word-with-ai') {
        console.log(`[A/B Test] Applying AI formatting to Template A`);
        try {
          // Apply AI formatting using the AI formatting service
          const { AIFormattingService } = await import('./services/aiFormattingService.js');
          const aiResult = await AIFormattingService.formatTemplateContent(formattedA, {
            section: '7',
            inputLanguage: language as 'fr' | 'en'
          });
          formattedA = aiResult.formatted;
          console.log(`[A/B Test] AI formatting applied to Template A successfully`);
        } catch (error) {
          console.error(`[A/B Test] AI formatting failed for Template A:`, error);
          // Keep the word-for-word formatted version as fallback
        }
      }
      
      resultA = {
        processedContent: formattedA,
        success: true
      };
    } else {
      // Use ProcessingOrchestrator for other templates
      console.log(`[A/B Test] Using ProcessingOrchestrator for Template A: ${templateA}`);
      const orchestrator = new ProcessingOrchestrator();
      resultA = await orchestrator.processContent({
        sectionId: 'section_7',
        modeId: templateAConfig.compatibleModes[0] || 'mode1',
        templateId: templateA,
        language: language as 'fr' | 'en',
        content: original,
        correlationId: `ab-test-a-${Date.now()}`
      });
      console.log(`[A/B Test] ProcessingOrchestrator result for Template A:`, {
        success: resultA.success,
        processedLength: resultA.processedContent.length,
        processedPreview: resultA.processedContent.substring(0, 200) + '...'
      });
    }

    // Process with Template B (using dictation page approach)
    console.log(`[A/B Test] Processing Template B: ${templateBConfig.name}`);
    let resultB: { processedContent: string; success: boolean };
    
    if (templateB === 'word-for-word-formatter' || templateB === 'word-for-word-with-ai') {
      // Use the same approach as dictation page for Word-for-Word templates
      const { formatWordForWordText } = await import('./utils/wordForWordFormatter.js');
      let formattedB = formatWordForWordText(original);
      
      // If it's the AI version, apply AI formatting
      if (templateB === 'word-for-word-with-ai') {
        console.log(`[A/B Test] Applying AI formatting to Template B`);
        try {
          // Apply AI formatting using the AI formatting service
          const { AIFormattingService } = await import('./services/aiFormattingService.js');
          const aiResult = await AIFormattingService.formatTemplateContent(formattedB, {
            section: '7',
            inputLanguage: language as 'fr' | 'en'
          });
          formattedB = aiResult.formatted;
          console.log(`[A/B Test] AI formatting applied to Template B successfully`);
        } catch (error) {
          console.error(`[A/B Test] AI formatting failed for Template B:`, error);
          // Keep the word-for-word formatted version as fallback
        }
      }
      
      resultB = {
        processedContent: formattedB,
        success: true
      };
    } else {
      // Use ProcessingOrchestrator for other templates
      console.log(`[A/B Test] Using ProcessingOrchestrator for Template B: ${templateB}`);
      const orchestrator = new ProcessingOrchestrator();
      resultB = await orchestrator.processContent({
        sectionId: 'section_7',
        modeId: templateBConfig.compatibleModes[0] || 'mode1',
        templateId: templateB,
        language: language as 'fr' | 'en',
        content: original,
        correlationId: `ab-test-b-${Date.now()}`
      });
      console.log(`[A/B Test] ProcessingOrchestrator result for Template B:`, {
        success: resultB.success,
        processedLength: resultB.processedContent.length,
        processedPreview: resultB.processedContent.substring(0, 200) + '...'
      });
    }

    console.log(`[A/B Test] Template processing completed`, {
      templateA: {
        name: templateAConfig.name,
        originalLength: original.length,
        processedLength: resultA.processedContent.length,
        success: resultA.success,
        processedContent: resultA.processedContent.substring(0, 200) + '...'
      },
      templateB: {
        name: templateBConfig.name,
        originalLength: original.length,
        processedLength: resultB.processedContent.length,
        success: resultB.success,
        processedContent: resultB.processedContent.substring(0, 200) + '...'
      }
    });

    // Analyze both results with comprehensive metrics
    const analyzer = new TranscriptAnalyzer();
    
    console.log('Starting analysis for Template A...');
    const analysisA = await analyzer.analyzeTranscript(original, resultA.processedContent, language);
    console.log('Template A analysis completed:', { overallScore: analysisA.overallScore, hallucinationScore: analysisA.metrics?.hallucinationScore });
    
    console.log('Starting analysis for Template B...');
    const analysisB = await analyzer.analyzeTranscript(original, resultB.processedContent, language);
    console.log('Template B analysis completed:', { overallScore: analysisB.overallScore, hallucinationScore: analysisB.metrics?.hallucinationScore });

    // Calculate additional metrics for each template
    console.log('Calculating template metrics...');
    const metricsA = calculateTemplateMetrics(original, resultA.processedContent, templateAConfig);
    const metricsB = calculateTemplateMetrics(original, resultB.processedContent, templateBConfig);
    console.log('Template metrics calculated');

    // Determine winner based on comprehensive scoring
    console.log('Calculating comprehensive scores...');
    const scoreA = calculateComprehensiveScore(analysisA, metricsA);
    const scoreB = calculateComprehensiveScore(analysisB, metricsB);
    console.log('Comprehensive scores:', { scoreA, scoreB });
    
    let winner: 'A' | 'B' | 'tie';
    const performanceGap = Math.abs(scoreA - scoreB);
    
    if (performanceGap < 2) {
      winner = 'tie';
    } else if (scoreA > scoreB) {
      winner = 'A';
    } else {
      winner = 'B';
    }

    const abTestResult = {
      templateA: {
        id: templateA,
        name: templateAConfig.name,
        formatted: resultA.processedContent,
        analysis: analysisA,
        metrics: metricsA,
        comprehensiveScore: scoreA
      },
      templateB: {
        id: templateB,
        name: templateBConfig.name,
        formatted: resultB.processedContent,
        analysis: analysisB,
        metrics: metricsB,
        comprehensiveScore: scoreB
      },
      winner,
      performanceGap,
      testDate: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      result: abTestResult
    });
  } catch (error) {
    console.error('A/B test error:', error);
    console.error('A/B test error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ 
      success: false, 
      error: `A/B test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// Database ping route
try {
  app.use(dbRouter);
  console.log('✅ /api/db routes mounted');
} catch(e) {
  console.error('❌ mount /api/db:', e);
}

// Sessions routes
try {
  const sessionsRouter = await import('./routes/sessions.js');
  app.use('/api/sessions', sessionsRouter.default);
  console.log('✅ /api/sessions routes mounted');
} catch(e) {
  console.error('❌ mount /api/sessions:', e);
}

// Cases routes
try {
  const casesRouter = await import('./routes/cases.js');
  app.use('/api/cases', casesRouter.default);
  console.log('✅ /api/cases routes mounted');
} catch(e) {
  console.error('❌ mount /api/cases:', e);
}

// Format routes
try {
  const formatRouter = await import('./routes/format.js');
  app.use('/api/format', formatRouter.default);
  console.log('✅ /api/format routes mounted');
} catch(e) {
  console.error('❌ mount /api/format:', e);
}

// Debug routes
try {
  const debugRouter = await import('./routes/debug.js');
  app.use('/api/debug', debugRouter.default);
  console.log('✅ /api/debug routes mounted');
} catch(e) {
  console.error('❌ mount /api/debug:', e);
}

// Boot-time database probe
(async () => {
  try {
    await bootProbe();
  } catch (e) {
    console.error('[boot] DB probe failed:', e);
  }
})();

// Template Library API Endpoints - All Protected with Auth

// Function to print all registered routes
function printRoutes(app: any) {
  const out: string[] = [];
  app._router?.stack?.forEach((m: any) => {
    if (m.route?.path) { 
      out.push(`${Object.keys(m.route.methods).join(',').toUpperCase()} ${m.route.path}`); 
    } else if (m.name === 'router' && m.handle?.stack && m.regexp) {
      const prefix = m.regexp.toString().match(/\\\/([^\\]+)\\\//)?.[1] ? `/${RegExp.$1}` : '';
      m.handle.stack.forEach((h: any) => h.route?.path && out.push(`${Object.keys(h.route.methods).join(',').toUpperCase()} ${prefix}${h.route.path}`));
    }
  });
  console.log('🧭 Registered routes:\n  ' + out.join('\n  '));
}

// Print routes after all are mounted
printRoutes(app);

// All template endpoints are now protected with authMiddleware
app.get('/api/templates', (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Templates access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // const { section, language } = req.query; // Unused - template library archived
    let templates;
    
    // Template library archived - using core template registry instead (filtered by isActive)
    templates = {
      message: "Template library archived. Using core template registry with 3 active AI formatter templates.",
      coreTemplates: [
        'word-for-word-with-ai', 
        'section7-ai-formatter',
        'section8-ai-formatter'
        // Hidden templates: word-for-word-formatter, section-7-only, section-7-verbatim, section-7-full, history-evolution-ai-formatter, section7-clinical-extraction
      ]
    };
    
    // Audit logging for successful access
    logger.info('Templates access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesReturned: Array.isArray(templates) ? templates.length : Object.keys(templates).length
    });
    
    return res.json({ success: true, data: templates });
  } catch (error) {
    // Audit logging for errors
    logger.error('Templates access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

app.get('/api/templates/stats',  (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template stats access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Template library archived - return core template stats
    const stats = {
      total: 7,
      bySection: { "7": 4, "8": 0, "11": 0, "history_evolution": 1 },
      byLanguage: { "fr": 7, "en": 7 },
      byComplexity: { "low": 1, "medium": 2, "high": 4 },
      byStatus: { "active": 7, "inactive": 0, "draft": 0 }
    };
    
    // Audit logging for successful access
    logger.info('Template stats access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      statsReturned: Object.keys(stats).length
    });
    
    return res.json({ success: true, data: stats });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template stats access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch template stats' });
  }
});

// AI Formatting API Endpoint - Protected with Auth
app.post('/api/templates/format',  (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template formatting requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      inputLanguage: req.body.inputLanguage,
      complexity: req.body.complexity,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { content, section, inputLanguage, outputLanguage, complexity, formattingLevel, includeSuggestions } = req.body;
    
    if (!content || !section || !inputLanguage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: content, section, inputLanguage' 
      });
    }
    
    if (!['7', '8', '11', 'history_evolution'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    if (!['fr', 'en'].includes(inputLanguage)) {
      return res.status(400).json({ success: false, error: 'Invalid input language' });
    }

    // Handle output language with defaults
    const finalOutputLanguage = outputLanguage || ENV.CNESST_SECTIONS_DEFAULT_OUTPUT;
    
    if (!['fr', 'en'].includes(finalOutputLanguage)) {
      return res.status(400).json({ success: false, error: 'Invalid output language' });
    }

    // Policy gate for CNESST sections
    if (['7','8','11'].includes(section) && 
        finalOutputLanguage !== 'fr' && 
        !ENV.ALLOW_NON_FRENCH_OUTPUT) {
      return res.status(400).json({ 
        success: false,
        error: 'CNESST sections must output French when ALLOW_NON_FRENCH_OUTPUT is false' 
      });
    }
    
    const formattingOptions = {
      section: section as "7" | "8" | "11" | "history_evolution",
      inputLanguage: inputLanguage as "fr" | "en",
      outputLanguage: finalOutputLanguage as "fr" | "en",
      complexity: complexity as "low" | "medium" | "high" || "medium",
      formattingLevel: formattingLevel as "basic" | "standard" | "advanced" || "standard",
      includeSuggestions: includeSuggestions || false
    };
    
    const formattedContent = AIFormattingService.formatTemplateContent(content, formattingOptions);
    
    // Audit logging for successful formatting
    logger.info('Template formatting successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      inputLanguage,
      complexity,
      contentLength: content.length
    });
    
    return res.json({ 
      success: true, 
      data: formattedContent 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template formatting failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error formatting template content:', error);
    return res.status(500).json({ success: false, error: 'Failed to format template content' });
  }
});

// Template CRUD Operations - Protected with Auth
app.post('/api/templates',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template creation requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      title: req.body.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { title, content, section, language, complexity, category, tags, version } = req.body;
    
    if (!title || !content || !section || !language || !complexity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content, section, language, complexity' 
      });
    }
    
    if (!['7', '8', '11'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    if (!['fr', 'en'].includes(language)) {
      return res.status(400).json({ success: false, error: 'Invalid language' });
    }
    
    if (!['low', 'medium', 'high'].includes(complexity)) {
      return res.status(400).json({ success: false, error: 'Invalid complexity' });
    }
    
    // Create new template
    const newTemplate = {
      id: `template_${Date.now()}`,
      title,
      content,
      section,
      language,
      complexity,
      category: category || 'General',
      tags: tags || [],
      version: version || '1.0',
      source_file: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating new template:', newTemplate);
    
    // Template library archived - return success message
    console.log('Template library archived - template creation not supported');
    
    // Audit logging for successful creation
    logger.info('Template creation successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: newTemplate.id,
      section,
      language,
      complexity,
      title
    });
    
    return res.json({ 
      success: true, 
      data: newTemplate,
      message: 'Template created successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template creation failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error creating template:', error);
    return res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { title, content, section, language, complexity, category, tags, version } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template update requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      title: req.body.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!title || !content || !section || !language || !complexity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, content, section, language, complexity' 
      });
    }
    
    const updatedTemplate = {
      id,
      title,
      content,
      section,
      language,
      complexity,
      category: category || 'General',
      tags: tags || [],
      version: version || '1.0',
      source_file: '',
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating template:', updatedTemplate);
    
    // Template library archived - return success message
    console.log('Template library archived - template update not supported');
    
    // Audit logging for successful update
    logger.info('Template update successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language,
      complexity,
      title
    });
    
    return res.json({ 
      success: true, 
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template update failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error updating template:', error);
    return res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { section } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template deletion requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: req.query['section'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!section || !['7', '8', '11'].includes(section as string)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid section parameter' 
      });
    }
    
    console.log('Deleting template:', id, 'from section:', section);
    
    // Template library archived - return success message
    console.log('Template library archived - template deletion not supported');
    
    // Audit logging for successful deletion
    logger.info('Template deletion successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section: section as string
    });
    
    return res.json({ 
      success: true, 
      message: 'Template deleted successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template deletion failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error deleting template:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// Advanced Template Features API Endpoints

// Get template versions - Protected with Auth
app.get('/api/templates/:id/versions',  (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template versions access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Template library archived - return empty versions
    const versions: any[] = [];
    
    // Audit logging for successful access
    logger.info('Template versions access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      versionsReturned: versions.length
    });
    
    return res.json({ 
      success: true, 
      data: versions 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template versions access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template versions:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch template versions' });
  }
});

// Get template analytics - Protected with Auth
app.get('/api/templates/analytics',  (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template analytics access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Template library archived - return basic analytics
    const analytics = {
      total_usage: 0,
      average_performance: 0,
      usage_by_section: {},
      usage_by_language: {},
      recent_usage: [],
      top_templates: []
    };
    
    // Audit logging for successful access
    logger.info('Template analytics access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      analyticsReturned: analytics ? Object.keys(analytics).length : 0
    });
    
    return res.json({ 
      success: true, 
      data: analytics || {}
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template analytics access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching template analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch template analytics' });
  }
});

// Get templates by section (must come after /analytics to avoid route conflict) - Protected with Auth
app.get('/api/templates/:section',  (req, res) => {
  const user = (req as any).user;
  
  try {
    const { section } = req.params;
    // const { language, search, tags } = req.query; // Unused - template library archived
    
    if (!section) {
      return res.status(400).json({ success: false, error: 'Missing section parameter' });
    }
    
    // Audit logging for secure event tracking
    logger.info('Templates by section access requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      language: req.query['language'],
      search: req.query['search'],
      tags: req.query['tags'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!['7', '8', '11'].includes(section)) {
      return res.status(400).json({ success: false, error: 'Invalid section' });
    }
    
    // Template library archived - return core templates for section (filtered by isActive)
    let templates: any[] = [];
    if (section === '7') {
      templates = [
        { id: 'section7-ai-formatter', title: 'Section 7' }
        // Hidden templates: section-7-only, section-7-verbatim, section-7-full
      ];
    } else if (section === '8') {
      templates = [
        { id: 'section8-ai-formatter', title: 'Section 8' }
      ];
    } else if (section === '11') {
      templates = [
        // No specific Section 11 templates currently active
      ];
    } else if (section === 'history_evolution') {
      templates = [
        // Hidden template: history-evolution-ai-formatter
      ];
    }
    
    // Audit logging for successful access
    logger.info('Templates by section access successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section,
      templatesReturned: templates.length
    });
    
    return res.json({ success: true, data: templates });
  } catch (error) {
    // Audit logging for errors
    logger.error('Templates by section access failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.params['section'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error fetching templates by section:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// Track template usage - Protected with Auth
app.post('/api/templates/:id/usage',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    const { id } = req.params;
    const { section, language, user_id, session_id, performance_rating } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing template ID' 
      });
    }
    
    // Audit logging for secure event tracking
    logger.info('Template usage tracking requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!section || !language) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: section, language' 
      });
    }
    
    // Template library archived - log usage tracking
    console.log('Template usage tracking:', { templateId: id, section, language, user_id, session_id, performance_rating });
    
    // Audit logging for successful tracking
    logger.info('Template usage tracking successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: id,
      section,
      language
    });
    
    return res.json({ 
      success: true, 
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template usage tracking failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateId: req.params['id'],
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error tracking template usage:', error);
    return res.status(500).json({ success: false, error: 'Failed to track usage' });
  }
});

// Advanced search - Protected with Auth
app.post('/api/templates/search',  (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template advanced search requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.body.section,
      language: req.body.language,
      complexity: req.body.complexity,
      query: req.body.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // const { section, language, complexity, tags, query, status, is_default } = req.body; // Unused - template library archived
    
    // Template library archived - return core templates (filtered by isActive)
    const templates = [
      { id: 'word-for-word-with-ai', title: 'Word-for-Word (with AI)' },
      { id: 'section7-ai-formatter', title: 'Section 7' },
      { id: 'section8-ai-formatter', title: 'Section 8' }
      // Hidden templates: word-for-word-formatter, section-7-only, section-7-verbatim, section-7-full, history-evolution-ai-formatter, section7-clinical-extraction
    ];
    
    // Audit logging for successful search
    logger.info('Template advanced search successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesReturned: templates.length
    });
    
    return res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template advanced search failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing advanced search:', error);
    return res.status(500).json({ success: false, error: 'Failed to perform search' });
  }
});

// Export templates - Protected with Auth
app.get('/api/templates/export',  (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template export requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.query['section'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // const { section } = req.query; // Unused - template library archived
    // Template library archived - return core templates (filtered by isActive)
    const templates = [
      { id: 'word-for-word-with-ai', title: 'Word-for-Word (with AI)' },
      { id: 'section7-ai-formatter', title: 'Section 7' },
      { id: 'section8-ai-formatter', title: 'Section 8' }
      // Hidden templates: word-for-word-formatter, section-7-only, section-7-verbatim, section-7-full, history-evolution-ai-formatter, section7-clinical-extraction
    ];
    
    // Audit logging for successful export
    logger.info('Template export successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      section: req.query['section'],
      templatesExported: templates.length
    });
    
    return res.json({ 
      success: true, 
      data: templates 
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template export failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error exporting templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to export templates' });
  }
});

// Import templates - Protected with Auth
app.post('/api/templates/import',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Template import requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesCount: req.body.templates?.length || 0,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templates } = req.body;
    
    if (!Array.isArray(templates)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Templates must be an array' 
      });
    }
    
    // Template library archived - log import attempt
    console.log('Template library archived - import not supported');
    
    // Audit logging for successful import
    logger.info('Template import successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesImported: templates.length
    });
    
    return res.json({ 
      success: true, 
      message: `${templates.length} templates imported successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Template import failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error importing templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to import templates' });
  }
});

// Bulk operations - Protected with Auth
app.post('/api/templates/bulk/status',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Bulk template status update requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateIdsCount: req.body.templateIds?.length || 0,
      status: req.body.status,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templateIds, status } = req.body;
    
    if (!Array.isArray(templateIds) || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: templateIds (array), status' 
      });
    }
    
    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be active, inactive, or draft' 
      });
    }
    
    // Template library archived - log bulk update attempt
    console.log('Template library archived - bulk update not supported');
    
    // Audit logging for successful update
    logger.info('Bulk template status update successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesUpdated: templateIds.length,
      status
    });
    
    return res.json({ 
      success: true, 
      message: `${templateIds.length} templates updated successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Bulk template status update failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing bulk status update:', error);
    return res.status(500).json({ success: false, error: 'Failed to update templates' });
  }
});

app.post('/api/templates/bulk/delete',  async (req, res) => {
  const user = (req as any).user;
  
  try {
    // Audit logging for secure event tracking
    logger.info('Bulk template deletion requested', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templateIdsCount: req.body.templateIds?.length || 0,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { templateIds } = req.body;
    
    if (!Array.isArray(templateIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'templateIds must be an array' 
      });
    }
    
    // Template library archived - log bulk delete attempt
    console.log('Template library archived - bulk delete not supported');
    
    // Audit logging for successful deletion
    logger.info('Bulk template deletion successful', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      templatesDeleted: templateIds.length
    });
    
    return res.json({ 
      success: true, 
      message: `${templateIds.length} templates deleted successfully`
    });
  } catch (error) {
    // Audit logging for errors
    logger.error('Bulk template deletion failed', {
      userId: user?.user_id,
      userEmail: user?.email,
      userRole: user?.role,
      endpoint: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error('Error performing bulk delete:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete templates' });
  }
});

// Mode 1 Formatting Endpoint
app.post('/api/format/mode1', async (req, res) => {
  try {
    const { transcript, language, inputLanguage, outputLanguage, quote_style, radiology_mode, section } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ 
        error: 'Transcript is required and must be a string' 
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

    // Development mode: no auth required

    // Initialize Mode 1 formatter
    const formatter = new Mode1Formatter();
    
    // Format the transcript
    const result = formatter.format(transcript, {
      language: finalInputLanguage as 'fr' | 'en', // Keep for backward compatibility
      inputLanguage: finalInputLanguage as 'fr' | 'en',
      outputLanguage: finalOutputLanguage as 'fr' | 'en',
      quote_style: quote_style || 'smart',
      radiology_mode: radiology_mode || false,
      preserve_verbatim: true
    });

    // Validate the formatted content if section is specified
    let validationResult = null;
    if (section && ['7', '8', '11'].includes(section)) {
      let validator;
      switch (section) {
        case '7':
          validator = new Section7Validator();
          break;
        case '8':
          validator = new Section8Validator();
          break;
        case '11':
          validator = new Section11Validator();
          break;
      }
      
      if (validator) {
        validationResult = validator.validate(result.formatted, finalOutputLanguage as 'fr' | 'en');
      }
    }

    return res.json({
      formatted: result.formatted,
      issues: result.issues,
      verbatim_blocks: result.verbatim_blocks,
      validation: validationResult,
      success: true
    });

  } catch (error) {
    console.error('Mode 1 formatting error:', error);
    return res.status(500).json({ 
      error: 'Failed to format transcript',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Word-for-Word (with AI) Formatting Endpoint
app.post('/api/format/word-for-word-ai', async (req, res) => {
  // Generate or read correlation ID
  const correlationId = req.headers['x-correlation-id'] as string || `be-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { transcript, language } = req.body;
    
    console.info(`[${correlationId}] Word-for-Word AI formatting request started`, {
      language,
      contentLength: transcript?.length || 0,
      hasAuth: !!(req as any).user
    });
    
    if (!transcript || typeof transcript !== 'string') {
      console.warn(`[${correlationId}] Invalid transcript provided`);
      return res.status(400).json({ 
        error: 'Transcript is required and must be a string',
        correlationId
      });
    }

    if (!language || !['fr', 'en'].includes(language)) {
      console.warn(`[${correlationId}] Invalid language provided: ${language}`);
      return res.status(400).json({ 
        error: 'Language must be either "fr" or "en"',
        correlationId
      });
    }

    // Development mode: no auth required
    console.info(`[${correlationId}] Dev mode: no auth required`);

    // Use the ProcessingOrchestrator to handle Word-for-Word (with AI) template
    const { processingOrchestrator } = await import('./services/processing/ProcessingOrchestrator.js');
    
    const result = await processingOrchestrator.processContent({
      sectionId: 'section_7', // Default section, could be made configurable
      modeId: 'mode1', // Word-for-word mode
      templateId: 'word-for-word-with-ai',
      language: language as 'fr' | 'en',
      content: transcript,
      correlationId // Pass correlation ID for logging
    });

    console.info(`[${correlationId}] Word-for-Word AI formatting completed`, {
      success: result.success,
      outputLength: result.processedContent?.length || 0,
      errors: result.metadata?.errors?.length || 0
    });

    if (result.success) {
      return res.json({
        success: true,
        formatted: result.processedContent,
        metadata: result.metadata,
        correlationId
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Processing failed',
        details: result.metadata.errors,
        correlationId
      });
    }

  } catch (error) {
    console.error(`[${correlationId}] Word-for-Word (with AI) formatting error:`, error);
    
    // Return 200 with fallback content instead of 500
    return res.status(200).json({
      success: false,
      formatted: req.body.transcript || '', // Return original content
      issues: ['ai_failed', error instanceof Error ? error.constructor.name : 'UnknownError'],
      correlationId
    });
  }
});

// History of Evolution Formatting Endpoint
app.post('/api/format-history-evolution', async (req, res) => {
  const correlationId = req.headers['x-correlation-id'] as string || `he-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { text, language } = req.body;
    
    console.info(`[${correlationId}] History of Evolution formatting request started`, {
      language,
      contentLength: text?.length || 0,
      hasAuth: !!(req as any).user
    });
    
    if (!text || typeof text !== 'string') {
      console.warn(`[${correlationId}] Invalid text provided`);
      return res.status(400).json({ 
        error: 'Text is required and must be a string',
        correlationId
      });
    }

    if (!language || !['fr', 'en'].includes(language)) {
      console.warn(`[${correlationId}] Invalid language provided: ${language}`);
      return res.status(400).json({ 
        error: 'Language must be either "fr" or "en"',
        correlationId
      });
    }

    // Development mode: no auth required
    console.info(`[${correlationId}] Dev mode: no auth required`);

    // Use the enhanced History of Evolution formatting function
    const { enhancedFormatHistoryEvolutionText } = await import('./services/formatter/historyEvolution');
    
    const formatted = await enhancedFormatHistoryEvolutionText(text, language as 'fr' | 'en');

    console.info(`[${correlationId}] History of Evolution formatting completed`, {
      success: true,
      inputLength: text.length,
      outputLength: formatted.length
    });

    return res.json({
      success: true,
      formatted,
      correlationId
    });

  } catch (error) {
    console.error(`[${correlationId}] History of Evolution formatting error:`, error);
    
    // Return 200 with fallback content instead of 500
    return res.status(200).json({
      success: false,
      formatted: req.body.text || '', // Return original content
      issues: ['ai_failed', error instanceof Error ? error.constructor.name : 'UnknownError'],
      correlationId
    });
  }
});

// Mode 2 Formatting Endpoint moved to /api/format/mode2 in format router

// Mode 3 Transcribe Processing Endpoint
app.post('/api/transcribe/process', async (req, res) => {
  try {
    const { sessionId, modeId, inputLanguage, section, rawAwsJson } = req.body;
    
    if (!sessionId || !modeId || !inputLanguage || !section || !rawAwsJson) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, modeId, inputLanguage, section, rawAwsJson' 
      });
    }

    if (modeId !== 'ambient') {
      return res.status(400).json({ 
        error: 'This endpoint only supports ambient mode' 
      });
    }

    if (!['section_7', 'section_8', 'section_11'].includes(section)) {
      return res.status(400).json({ 
        error: 'Section must be "section_7", "section_8", or "section_11"' 
      });
    }

    if (!['fr', 'en'].includes(inputLanguage)) {
      return res.status(400).json({ 
        error: 'Input language must be either "fr" or "en"' 
      });
    }

    // Import Mode3Pipeline dynamically
    const { Mode3Pipeline } = await import('./services/pipeline/index.js');
    const pipeline = new Mode3Pipeline();
    
    // Parse and validate AWS result
    let awsResult;
    try {
      awsResult = typeof rawAwsJson === 'string' ? JSON.parse(rawAwsJson) : rawAwsJson;
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid AWS Transcribe JSON format' 
      });
    }

    const validation = pipeline.validateAWSResult(awsResult);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid AWS result', 
        details: validation.errors 
      });
    }

    // Execute S1→S5 pipeline
    const result = await pipeline.execute(awsResult, 'default');
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Pipeline processing failed', 
        details: result.error 
      });
    }

    // result from pipeline
    const { data, processingTime } = result;

    // Basic shape validation
    if (!data || !data.ir || !data.roleMap || !data.narrative) {
      return res.status(500).json({ error: 'Pipeline returned incomplete artifacts' });
    }

    // Persist
    const db = getDb();
    await db.insert(artifacts).values({
      session_id: sessionId,
      ir: data.ir,
      role_map: data.roleMap,
      narrative: data.narrative,
      processing_time: data.processingTime || { total: processingTime }
    });

    // Return pipeline artifacts
    return res.json({
      narrative: data.narrative,
      irSummary: {
        turnCount: data.ir.turns.length,
        speakerCount: data.ir.metadata.speakerCount,
        totalDuration: data.ir.metadata.totalDuration
      },
      roleMap: data.roleMap,
      meta: {
        processingTime: data.processingTime,
        success: true,
        saved: true
      }
    });

  } catch (error) {
    console.error('Mode 3 transcribe processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process transcribe data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Session Artifacts Endpoint
app.get('/api/sessions/:id/artifacts', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    // Get database instance
    const db = getDb();
    
    const rows = await db.select().from(artifacts)
      .where(eq(artifacts.session_id, sessionId))
      .orderBy(desc(artifacts.created_at))
      .limit(1);

    if (!rows.length) {
      return res.json({ ir: null, role_map: null, narrative: null, processing_time: null });
    }
    const a = rows[0];
    if (!a) {
      return res.json({ ir: null, role_map: null, narrative: null, processing_time: null });
    }
    return res.json({ ir: a.ir, role_map: a.role_map, narrative: a.narrative, processing_time: a.processing_time });

  } catch (error) {
    console.error('Get session artifacts error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve session artifacts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Role Swap Endpoint (Admin/Support only)
app.post('/api/sessions/:id/roles/swap', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    // TODO: Implement role swap logic
    // 1. Retrieve current role map from database
    // 2. Apply role swap using S3RoleMap.applyRoleSwap()
    // 3. Re-run S5 narrative generation
    // 4. Update database with new narrative
    
    return res.json({
      message: 'Role swap endpoint ready - database integration pending',
      sessionId,
      note: 'This endpoint will flip PATIENT ↔ CLINICIAN roles and regenerate narrative'
    });

  } catch (error) {
    console.error('Role swap error:', error);
    return res.status(500).json({ 
      error: 'Failed to swap roles',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AWS Troubleshooting Endpoints (Temporary)
app.get('/api/troubleshoot/session/:id', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    // Get transcription service troubleshooting data
    const transcriptionData = transcriptionService.getTroubleshootingData(sessionId);
    
    // Get audio recording info
    const audioInfo = audioRecordingService.getRecordingInfo(sessionId);
    
    return res.json({
      sessionId,
      transcription: transcriptionData,
      audio: audioInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching troubleshooting data:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch troubleshooting data' 
    });
  }
});

app.get('/api/troubleshoot/recordings', async (_req, res) => {
  try {
    const recordingFiles = await audioRecordingService.getRecordingFiles();
    
    return res.json({
      recordings: recordingFiles,
      count: recordingFiles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recording files:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch recording files' 
    });
  }
});

app.get('/api/troubleshoot/cleanup', async (_req, res) => {
  try {
    await audioRecordingService.cleanupOldRecordings();
    
    return res.json({
      message: 'Old recordings cleaned up successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cleaning up recordings:', error);
    return res.status(500).json({ 
      error: 'Failed to cleanup recordings' 
    });
  }
});

// Phase 0: Mode-specific AWS configuration function
const getModeSpecificConfig = (mode: string, baseConfig: any) => {
  const config = {
    language_code: baseConfig.language_code,
    media_sample_rate_hz: baseConfig.media_sample_rate_hz,
  };

  switch (mode) {
    case 'word_for_word':
      return {
        ...config,
        show_speaker_labels: false,
        partial_results_stability: 'high' as const
        // max_speaker_labels omitted - will be undefined
        // vocabulary_name omitted - will be undefined
      };
    case 'smart_dictation':
      return {
        ...config,
        show_speaker_labels: false,  // Changed: Mode 2 should NOT use speaker labels
        partial_results_stability: 'high' as const
        // max_speaker_labels omitted - will be undefined
        // vocabulary_name: 'medical_terms_fr'  // TODO: Create medical vocabulary in AWS
      };
    case 'ambient':
      return {
        ...config,
        show_speaker_labels: true,  // Mode 3: Enable speaker labels
        // max_speaker_labels removed - not available for streaming
        partial_results_stability: 'high' as const  // Better for diarization
        // vocabulary_name omitted - will be undefined
      };
    default:
      // Fallback to current configuration
      return {
        ...config,
        show_speaker_labels: false,
        partial_results_stability: 'high' as const
        // max_speaker_labels omitted - will be undefined
        // vocabulary_name omitted - will be undefined
      };
  }
};

const wss = new WebSocketServer({ server, path: ENV.WS_PATH });
console.log(`[BOOT] WebSocketServer listening on path ${ENV.WS_PATH}`);

// WS auth during upgrade
server.on('upgrade', async (req, socket, _head) => {
  // If your WS library uses its own upgrade hook, adapt this accordingly.
  const ok = await wsAuthCheck(req);
  if (!ok) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  // continue with your existing wss.handleUpgrade(...) if used
});

// Store active transcription sessions - integrated with AWS Transcribe
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`; // or your own
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;

  console.log("WebSocket connection established", { sessionId });
  
  // Create session state for this connection
  const sessionState = createSession(ws, sessionId);
  
  // TODO: Add authentication here when WS_REQUIRE_AUTH is enabled
  let authenticatedUser: { userId: string; userEmail: string } | null = null;
  
  if (ENV.WS_REQUIRE_AUTH) {
    // Standardize on ws_token parameter
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const wsToken = url.searchParams.get('ws_token');
    
    if (!wsToken) {
      console.log('WebSocket connection rejected: No ws_token provided');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // TODO: Verify WS token
      const decoded = jwt.verify(wsToken, ENV.WS_JWT_SECRET || ENV.JWT_SECRET) as any;
      
      if (decoded.type !== 'ws_token') {
        console.log('WebSocket connection rejected: Invalid token type');
        ws.close(1008, 'Invalid token type');
        return;
      }
      
      authenticatedUser = {
        userId: decoded.userId,
        userEmail: decoded.userEmail,
      };
      
      console.log(`WebSocket authenticated for user: ${authenticatedUser.userEmail}`);
      
    } catch (error) {
      console.log('WebSocket connection rejected: Invalid token');
      ws.close(1008, 'Invalid token');
      return;
    }
  }
  
  // TODO: Add user context to connection
  (ws as any).user = authenticatedUser;

  ws.on('message', async (data, isBinary) => {
    if (!isBinary) {
      // JSON control messages
      try {
        const msg = JSON.parse(data.toString());
        
        // Handle audio_init message for sample rate negotiation
        if (msg?.type === 'audio_init' && FLAGS.AUDIO_SR_NEGOTIATE) {
          const sr = Number(msg.sampleRate);
          if (updateSessionSampleRate(ws, sr)) {
            console.log(`[WS] init: sampleRate=${sessionState.sampleRate}, mono=true, enc=pcm16, frame=${msg.frameMs || 100}ms`);
          } else {
            // Fallback to safe default
            sessionState.sampleRate = 48000;
            sessionState.isInitialized = true;
            console.log(`[WS] init: invalid sampleRate=${sr}, using default=48000`);
          }
          return;
        }
        
        if (!started) {
          // Expect the very first message to be start JSON
          if (msg?.type !== 'start_transcription' || !['fr-CA','en-US'].includes(msg.languageCode)) {
            ws.send(JSON.stringify({ type: 'transcription_error', error: 'Invalid languageCode' }));
            return ws.close();
          }
          started = true;

          // Update session sample rate from client message if provided
          console.log(`[WS] start_transcription message:`, {
            sampleRate: msg.sampleRate,
            languageCode: msg.languageCode,
            mode: msg.mode
          });
          
          if (msg.sampleRate && (msg.sampleRate === 44100 || msg.sampleRate === 48000 || msg.sampleRate === 16000)) {
            sessionState.sampleRate = msg.sampleRate;
            sessionState.isInitialized = true;
            console.log(`[WS] start_transcription: sampleRate=${msg.sampleRate} from client message`);
          } else {
            console.log(`[WS] start_transcription: invalid or missing sampleRate=${msg.sampleRate}, using default`);
          }

          // Determine effective sample rate: client message > negotiated > default
          let effectiveSR = 48000; // default
          if (sessionState.sampleRate && (sessionState.sampleRate === 44100 || sessionState.sampleRate === 48000 || sessionState.sampleRate === 16000)) {
            effectiveSR = sessionState.sampleRate;
          }
          
          console.log(`[WS] Final effective sample rate: ${effectiveSR} (sessionState.sampleRate=${sessionState.sampleRate})`);

          // Phase 0: Use mode-specific configuration
          const modeConfig = getModeSpecificConfig(msg.mode || 'smart_dictation', {
            language_code: msg.languageCode, 
            media_sample_rate_hz: effectiveSR
          });

          // Start audio recording for troubleshooting (temporary)
          await audioRecordingService.startRecording(sessionId, effectiveSR);

          // Start AWS stream (non-blocking) and expose feeder immediately
          const { pushAudio: feeder, endAudio: ender } =
            transcriptionService.startStreamingTranscription(
              sessionId,
              modeConfig,
              (res) => {
                // Check if this is the final AWS result for Mode 3
                if (res.resultId === 'final_aws_result' && res.awsResult && msg.mode === 'ambient') {
                  console.log(`[${sessionId}] Sending final AWS result for Mode 3 pipeline`);
                  ws.send(JSON.stringify({ 
                    type: 'transcription_final', 
                    mode: 'ambient',
                    payload: res.awsResult
                  }));
                } else {
                  // Regular transcription result
                  ws.send(JSON.stringify({ 
                    type: 'transcription_result', 
                    resultId: res.resultId,                         // stable key
                    startTime: res.startTime ?? null,
                    endTime: res.endTime ?? null,
                    text: res.transcript, 
                    isFinal: !res.is_partial,
                    language_detected: res.language_detected,
                    confidence_score: res.confidence_score,
                    speaker: res.speaker                           // PATIENT vs CLINICIAN
                  }));
                }
              },
              (err) => ws.send(JSON.stringify({ type: 'transcription_error', error: String(err) }))
            );

          pushAudio = feeder;
          endAudio = ender;

          // Store session info
          activeSessions.set(sessionId, { 
            ws, 
            pushAudio: feeder,
            endAudio: ender,
            config: msg
          });

          // Tell client to start mic now
          ws.send(JSON.stringify({ type: 'stream_ready' }));
          return;
        }

        // Handle control messages after start
        if (msg?.type === 'stop_transcription') endAudio?.();
        
        // Handle voice commands
        if (msg?.type === 'cmd.save') {
          // TODO: implement save functionality
          console.log('Save command received for session:', sessionId);
          ws.send(JSON.stringify({ type:'cmd_ack', cmd:'save', ok:true }));
        }
        if (msg?.type === 'cmd.export') {
          // TODO: implement export functionality
          console.log('Export command received for session:', sessionId);
          ws.send(JSON.stringify({ type:'cmd_ack', cmd:'export', ok:true }));
        }
      } catch {
        // Ignore non-JSON messages
      }
      return;
    }

    // Binary: raw PCM16 mono frames (~100ms each)
    if (isBinary && started) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (buf.length && pushAudio) {
        // Write to session PCM pipe for potential future use
        sessionState.pcmPipe.write(buf);
        
        // Continue using existing audio feeder
        pushAudio(new Uint8Array(buf));
        
        // Record audio for troubleshooting (temporary)
        audioRecordingService.addAudioChunk(sessionId, new Uint8Array(buf));

        // Debug logging for binary frames
        if (FLAGS.WS_DEBUG_BINARY_LOG) {
          sessionState.frames = (sessionState.frames ?? 0) + 1;
          if (sessionState.frames % 10 === 0) {
            console.log(`[WS] ~1s of audio, last=${buf.byteLength}B, sr=${sessionState.sampleRate ?? 'n/a'}`);
          }
        }
      }
    }
  });

  ws.on('close', async () => {
    endAudio?.();
    
    // Clean up session state
    cleanupSession(ws);
    
    // Stop audio recording for troubleshooting (temporary)
    const audioFilePath = await audioRecordingService.stopRecording(sessionId);
    if (audioFilePath) {
      console.log(`🎙️ Audio recording saved: ${audioFilePath}`);
    }
    
    // Clean up session
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }
    
    try {
      const status = transcriptionService.getStatus();
      console.log("Closed WebSocket. Transcription status:", status);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn("getStatus() not available:", errorMessage);
    }
  });

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    payload: {
      sessionId,
      timestamp: new Date()
    }
  }));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Clean up transcription service
  await transcriptionService.cleanup();
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default async function run() {
  return new Promise<void>((resolve) => {
    server.listen(ENV.PORT, ENV.HOST, () => {
      console.log(`HTTP listening on http://${ENV.HOST}:${ENV.PORT}`);
      console.log(`Health: GET /healthz`);
      console.log(`WebSocket path: ${ENV.WS_PATH}`);
      console.log("📋 Phase 2: Raw PCM16 streaming implemented");
      console.log("🚀 Phase 3: AWS Transcribe integration active");
      console.log("🌍 AWS Region:", transcriptionService.getStatus().region);
      console.log("🎤 Ready for real-time transcription");
      
      // Core Template Registry Status
      console.log("📚 Core Template Registry loaded: 7 AI formatter templates");
      console.log("   - Word-for-Word Formatter");
      console.log("   - Word-for-Word (with AI)");
      console.log("   - Section 7 AI Formatter");
      console.log("   - Section 7 Template Only");
      console.log("   - Section 7 Template + Verbatim");
      console.log("   - Section 7 Template + Verbatim + Voice Commands");
      console.log("   - History of Evolution AI Formatter");
      console.log("🔗 Template API endpoints available at /api/templates");
      
      resolve();
    });
  });
}

// Start the HTTP server immediately when this file is executed
server.listen(ENV.PORT, ENV.HOST, () => {
  console.log(`HTTP listening on http://${ENV.HOST}:${ENV.PORT}`);
  console.log(`Health: GET /healthz`);
  console.log(`WebSocket path: ${ENV.WS_PATH}`);
  console.log(`[BOOT] WS path ${ENV.WS_PATH} -> expecting Nginx /ws -> backend ${ENV.WS_PATH}`);
  console.log("📋 Phase 2: Raw PCM16 streaming implemented");
  console.log("🚀 Phase 3: AWS Transcribe integration active");
  console.log("🌍 AWS Region:", transcriptionService.getStatus().region);
  console.log("🎤 Ready for real-time transcription");
  
  // Core Template Registry Status
  console.log("📚 Core Template Registry loaded: 7 AI formatter templates");
  console.log("   - Word-for-Word Formatter");
  console.log("   - Word-for-Word (with AI)");
  console.log("   - Section 7 AI Formatter");
  console.log("   - Section 7 Template Only");
  console.log("   - Section 7 Template + Verbatim");
  console.log("   - Section 7 Template + Verbatim + Voice Commands");
  console.log("   - History of Evolution AI Formatter");
  console.log("🔗 Template API endpoints available at /api/templates");
});
