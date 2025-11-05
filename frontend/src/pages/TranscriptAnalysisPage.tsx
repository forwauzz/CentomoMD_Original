import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
// Using TemplateContext for standardized template loading
import { TemplatePreview } from '@/components/transcription/TemplatePreview';
import { useTemplates } from '@/contexts/TemplateContext';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { VersionSelector } from '@/components/ui/VersionSelector';
import { useFeatureFlags } from '@/lib/featureFlags';
import { safeLogger } from '@/lib/safeLogger';

// Using TemplateContext for standardized template loading

// Helper function to detect language from content
const detectLanguage = (content: string): 'fr' | 'en' => {
  if (!content) return 'fr'; // Default to French
  
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'avec', 'pour', 'dans', 'sur', 'par', 'travailleur', 'travailleuse', 'accident', 'blessure', 'douleur', 'traitement'];
  const englishWords = ['the', 'and', 'or', 'with', 'for', 'in', 'on', 'by', 'worker', 'patient', 'accident', 'injury', 'pain', 'treatment'];
  
  const contentLower = content.toLowerCase();
  const frenchCount = frenchWords.filter(word => contentLower.includes(word)).length;
  const englishCount = englishWords.filter(word => contentLower.includes(word)).length;
  
  return englishCount > frenchCount ? 'en' : 'fr';
};
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  BarChart3,
  Brain,
  Shield,
  Clock,
  Target,
  Zap,
  GitCompare,
  Trophy,
  History
} from 'lucide-react';

interface AnalysisResult {
  overallScore: number;
  metrics: {
    hallucinationScore: number;
    accuracyScore: number;
    completenessScore: number;
    consistencyScore: number;
    medicalAccuracyScore: number;
  };
  issues: {
    hallucinations: string[];
    errors: string[];
    inconsistencies: string[];
    missingContent: string[];
    medicalErrors: string[];
  };
  suggestions: string[];
  confidence: number;
  processingTime: number;
  checklist: {
    contentPreservation: boolean;
    medicalAccuracy: boolean;
    dateConsistency: boolean;
    terminologyConsistency: boolean;
    noHallucinations: boolean;
    properFormatting: boolean;
    completeness: boolean;
    readability: boolean;
  };
  comparisonTable: {
    type: 'addition' | 'deletion' | 'modification' | 'hallucination' | 'error';
    originalText: string;
    formattedText: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    suggestion?: string;
    lineNumber?: number;
  }[];
}

interface ComparisonResult {
  similarity: number;
  additions: string[];
  deletions: string[];
  modifications: string[];
  wordCountChange: number;
  sentenceCountChange: number;
}

interface TemplateMetrics {
  structuralConsistency: number;
  paragraphBreaks: number;
  lineBreaks: number;
  editingEffort: number;
  wordCountChange: number;
  capitalizationConsistency: number;
  punctuationConsistency: number;
  contentPreservation: number;
  speakerPrefixHandling: number;
  voiceCommandProcessing: number;
}

interface ABTestResult {
  templateA: {
    id: string;
    name: string;
    formatted: string;
    analysis: AnalysisResult;
    metrics: TemplateMetrics;
    comprehensiveScore: number;
  };
  templateB: {
    id: string;
    name: string;
    formatted: string;
    analysis: AnalysisResult;
    metrics: TemplateMetrics;
    comprehensiveScore: number;
  };
  winner: 'A' | 'B' | 'tie';
  performanceGap: number;
  testDate: string;
}

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  wins: number;
  losses: number;
  ties: number;
  averageScore: number;
  totalTests: number;
  lastTestDate: string;
}

interface TemplateAnalysisResult {
  templateId: string;
  templateName: string;
  aiFormattingQuality: number;
  cnesstCompliance: number;
  formattingAccuracy: number;
  templateSpecificIssues: string[];
  processingTime: number;
  wordCountChange: number;
  medicalTermAccuracy: number;
  structuralConsistency: number;
}

export const TranscriptAnalysisPage: React.FC = () => {
  // Use template context for standardized template loading
  const { getAllTemplates } = useTemplates();
  
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<'quality' | 'comparison' | 'hallucination' | 'ab-test' | 'single-template' | 'benchmark' | 'quick-compare'>('quality');
  
  // Benchmark comparison state (feature-flagged)
  // Shared fields: original transcript (same for all) and reference benchmark (MD final)
  const [benchmarkOriginal, setBenchmarkOriginal] = useState<string>('');
  const [benchmarkReference, setBenchmarkReference] = useState<string>('');
  // Each item represents a different model+template combination to test
  const [benchmarkItems, setBenchmarkItems] = useState<Array<{ 
    templateName: string; 
    templateId?: string;
    model?: string;
    templateOutput?: string; // Optional: if provided, use pre-formatted output; otherwise auto-generate
    isAutoGenerated?: boolean; // Whether output should be auto-generated
  }>>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkMode, setBenchmarkMode] = useState<'manual' | 'auto'>('auto'); // 'auto' = generate outputs, 'manual' = use pre-formatted
  const [templateName, setTemplateName] = useState('');
  
  // A/B Test state
  const [templateA, setTemplateA] = useState('');
  const [templateB, setTemplateB] = useState('');
  const [abTestResult, setAbTestResult] = useState<ABTestResult | null>(null);
  const [isRunningABTest, setIsRunningABTest] = useState(false);
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);
  
  // Direct template processing state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState<string | undefined>(undefined);
  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);
  const [templateProcessingResult, setTemplateProcessingResult] = useState<string>('');
  const [templateProcessingError, setTemplateProcessingError] = useState<string>('');
  
  // Template preview state
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  
  // Template-specific analysis state
  const [templateAnalysisResult, setTemplateAnalysisResult] = useState<TemplateAnalysisResult | null>(null);

  // Model selection state (feature-flagged)
  const flags = useFeatureFlags();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [runSeed, setRunSeed] = useState<string>('');
  const [runTemperature, setRunTemperature] = useState<string>('0.7');
  
  // Quick Compare state (2 models, same template)
  const [quickCompareOriginal, setQuickCompareOriginal] = useState<string>('');
  const [quickCompareBenchmark, setQuickCompareBenchmark] = useState<string>('');
  const [quickCompareTemplate, setQuickCompareTemplate] = useState<string>('');
  const [quickCompareModelA, setQuickCompareModelA] = useState<string | null>(null);
  const [quickCompareModelB, setQuickCompareModelB] = useState<string | null>(null);
  const [quickCompareResult, setQuickCompareResult] = useState<any>(null);
  const [isRunningQuickCompare, setIsRunningQuickCompare] = useState(false);

  // Debug: Log Quick Compare state changes
  React.useEffect(() => {
    if (selectedAnalysis === 'quick-compare') {
      console.log('[Quick Compare] State update:', {
        original: quickCompareOriginal.trim().length > 0,
        benchmark: quickCompareBenchmark.trim().length > 0,
        template: quickCompareTemplate,
        modelA: quickCompareModelA,
        modelB: quickCompareModelB,
        buttonEnabled: !isRunningQuickCompare && 
          quickCompareOriginal.trim().length > 0 && 
          quickCompareBenchmark.trim().length > 0 && 
          quickCompareTemplate && 
          quickCompareModelA && 
          quickCompareModelB
      });
    }
  }, [selectedAnalysis, quickCompareOriginal, quickCompareBenchmark, quickCompareTemplate, quickCompareModelA, quickCompareModelB, isRunningQuickCompare]);

  // Debug: Log feature flag status (ALWAYS log, not conditionally)
  React.useEffect(() => {
    const envRaw = import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS;
    const envType = typeof envRaw;
    const flagValue = flags.modelSelectionTranscriptAnalysis;
    console.log('[TranscriptAnalysis] Feature flags:', {
      modelSelection: flags.modelSelection,
      modelSelectionTranscriptAnalysis: flagValue,
      enhancedTranscriptAnalysis: flags.enhancedTranscriptAnalysis,
      envVarRaw: envRaw,
      envVarType: envType,
      envVarIsTrue: envRaw === 'true',
      willRenderModelSelector: flagValue === true,
    });
    console.log('[TranscriptAnalysis] Component rendered. selectedAnalysis:', selectedAnalysis);
  }, [flags, selectedAnalysis]);

  // Load template performance history
  React.useEffect(() => {
    const storedPerformance = localStorage.getItem('templatePerformance');
    if (storedPerformance) {
      try {
        setTemplatePerformance(JSON.parse(storedPerformance));
      } catch (error) {
        console.error('Error loading template performance:', error);
      }
    }
  }, []);

  // Debug: Check if templates are loaded via context
  React.useEffect(() => {
    const allTemplates = getAllTemplates();
    console.log('All templates via context (modular):', allTemplates.length);
    console.log('Active templates:', allTemplates.filter(t => t.isActive).length);
  }, [getAllTemplates]);

  // Auto-populate from sessionStorage if available
  React.useEffect(() => {
    const storedData = sessionStorage.getItem('transcriptAnalysisData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setOriginalTranscript(data.original || '');
        setFormattedTranscript(data.formatted || '');
        setTemplateName(data.templateName || '');
        
        // Clear the stored data after use
        sessionStorage.removeItem('transcriptAnalysisData');
      } catch (error) {
        console.error('Error parsing stored transcript data:', error);
      }
    }
  }, []);

  // Direct template processing function (like dictation page)
  const processWithTemplate = useCallback(async (templateId: string, content: string, templateVersion?: string) => {
    // Enhanced validation and logging
    console.log('[Template Processing] Input validation:', {
      templateId: templateId,
      contentLength: content?.length,
      contentTrimmedLength: content?.trim()?.length,
      contentType: typeof content,
      contentPreview: content?.substring(0, 100),
    });

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Transcript content is required and must be a string');
    }

    if (!content.trim()) {
      throw new Error('Transcript content cannot be empty or whitespace only');
    }

    console.log(`[Template Processing] Processing with template: ${templateId}, content length: ${content.length}`);
    
    // Get template configuration to determine the correct section
    const template = getAllTemplates().find(t => t.id === templateId);
    const section = template?.compatibleSections?.[0]?.replace('section_', '') || '7';
    
    console.log(`[Template Processing] Using section: ${section} for template: ${templateId}`);
    
    // Call the same backend endpoint as dictation page
    // CRITICAL: Ensure transcript field is explicitly set
    const requestBody: any = {
      transcript: String(content), // Explicitly convert to string to ensure it's sent
      section: section,
      language: detectLanguage(content),
      templateRef: templateId, // Use templateRef (new unified identifier)
      templateVersion: templateVersion, // Include selected version if specified
      verbatimSupport: false,
      voiceCommandsSupport: false
    };

    // Debug: Log request body (PHI scrubbed)
    safeLogger.log('[Template Processing] Request body:', {
      transcript: requestBody.transcript ? '[REDACTED]' : 'MISSING',
      transcriptLength: requestBody.transcript?.length,
      transcriptType: typeof requestBody.transcript,
      section: requestBody.section,
      language: requestBody.language,
      templateRef: requestBody.templateRef,
      hasModel: !!requestBody.model,
      hasSeed: !!requestBody.seed,
      hasTemperature: !!requestBody.temperature,
    });
    
    // CRITICAL DEBUG: Log the full request body structure (PHI scrubbed)
    safeLogger.log('[Template Processing] Full request body keys:', Object.keys(requestBody));
    safeLogger.log('[Template Processing] transcript field exists?', 'transcript' in requestBody);
    safeLogger.log('[Template Processing] transcript value type:', typeof requestBody.transcript);

    // Add model selection parameters if feature enabled and model selected
    if (flags.modelSelectionTranscriptAnalysis && selectedModel) {
      requestBody.model = selectedModel;
    }

    // Add run controls if provided
    if (runSeed) {
      const seedNum = parseInt(runSeed, 10);
      if (!isNaN(seedNum)) {
        requestBody.seed = seedNum;
      }
    }
    if (runTemperature) {
      const tempNum = parseFloat(runTemperature);
      if (!isNaN(tempNum) && tempNum >= 0 && tempNum <= 2) {
        requestBody.temperature = tempNum;
      }
    }

    // CRITICAL: Verify request body before sending (PHI scrubbed)
    const jsonBody = JSON.stringify(requestBody);
    safeLogger.log('[Template Processing] JSON stringified body length:', jsonBody.length);
    safeLogger.log('[Template Processing] JSON body contains "transcript":', jsonBody.includes('"transcript"'));
    safeLogger.log('[Template Processing] JSON body preview:', '[REDACTED - contains PHI]');
    
    // Parse back to verify
    try {
      const parsed = JSON.parse(jsonBody);
      safeLogger.log('[Template Processing] Parsed body keys:', Object.keys(parsed));
      safeLogger.log('[Template Processing] Parsed transcript exists?', 'transcript' in parsed);
      safeLogger.log('[Template Processing] Parsed transcript type:', typeof parsed.transcript);
      safeLogger.log('[Template Processing] Parsed transcript length:', parsed.transcript?.length);
    } catch (e) {
      safeLogger.error('[Template Processing] Failed to parse JSON:', e);
    }

    const response = await apiFetch('/api/format/mode2', {
      method: 'POST',
      body: jsonBody
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Template processing failed');
    }

    console.log(`[Template Processing] Template processing successful for: ${templateId}`);
    return response.formatted;
  }, [flags.modelSelectionTranscriptAnalysis, selectedModel, runSeed, runTemperature, getAllTemplates]);

  // Process single template
  const processSingleTemplate = useCallback(async () => {
    // Debug logging
    console.log('[Single Template] Debug info:', {
      originalTranscript: originalTranscript,
      originalTranscriptLength: originalTranscript?.length,
      originalTranscriptTrimmed: originalTranscript?.trim(),
      selectedTemplate: selectedTemplate,
    });

    if (!originalTranscript || !originalTranscript.trim()) {
      alert('Please provide a raw transcript in the "Original Transcript" field');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    setIsProcessingTemplate(true);
    setTemplateProcessingError('');
    setTemplateProcessingResult('');

    try {
      console.log(`[Single Template] Processing with template: ${selectedTemplate}, version: ${selectedTemplateVersion || 'default'}, transcript length: ${originalTranscript.length}`);
      const result = await processWithTemplate(selectedTemplate, originalTranscript, selectedTemplateVersion);
      setTemplateProcessingResult(result);
      setFormattedTranscript(result);
      console.log(`[Single Template] Processing completed successfully`);
      
      // Automatically run template-specific analysis
      await analyzeTemplateSpecific(selectedTemplate, originalTranscript, result);
    } catch (error) {
      console.error('Single template processing error:', error);
      setTemplateProcessingError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessingTemplate(false);
    }
  }, [originalTranscript, selectedTemplate, processWithTemplate]);

  // Analyze template-specific metrics
  const analyzeTemplateSpecific = useCallback(async (templateId: string, original: string, formatted: string) => {
    setTemplateAnalysisResult(null);

    try {
      console.log(`[Template Analysis] Analyzing template-specific metrics for: ${templateId}`);
      
      const template = getAllTemplates().find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Calculate template-specific metrics
      const startTime = Date.now();
      
      // Word count change
      const originalWords = original.trim().split(/\s+/).length;
      const formattedWords = formatted.trim().split(/\s+/).length;
      const wordCountChange = ((formattedWords - originalWords) / originalWords) * 100;

      // CNESST compliance check
      const cnesstCompliance = calculateCNESSTCompliance(formatted);

      // Medical term accuracy
      const medicalTermAccuracy = calculateMedicalTermAccuracy(original, formatted);

      // Structural consistency
      const structuralConsistency = calculateStructuralConsistency(formatted);

      // AI formatting quality (for AI templates)
      const aiFormattingQuality = template.id.includes('ai') ? 
        calculateAIFormattingQuality(original, formatted) : 100;

      // Formatting accuracy
      const formattingAccuracy = calculateFormattingAccuracy(original, formatted);

      // Template-specific issues
      const templateSpecificIssues = identifyTemplateSpecificIssues(templateId, original, formatted);

      const processingTime = (Date.now() - startTime) / 1000;

      const result: TemplateAnalysisResult = {
        templateId,
        templateName: template.name,
        aiFormattingQuality,
        cnesstCompliance,
        formattingAccuracy,
        templateSpecificIssues,
        processingTime,
        wordCountChange,
        medicalTermAccuracy,
        structuralConsistency
      };

      setTemplateAnalysisResult(result);
      console.log(`[Template Analysis] Analysis completed for: ${templateId}`, result);

    } catch (error) {
      console.error('Template-specific analysis error:', error);
    }
  }, [getAllTemplates]);

  // Helper functions for template-specific analysis
  const calculateCNESSTCompliance = (formatted: string): number => {
    let score = 100;
    
    // Check for worker-first terminology
    if (formatted.toLowerCase().includes('patient')) {
      score -= 20;
    }
    if (formatted.toLowerCase().includes('travailleur') || formatted.toLowerCase().includes('travailleuse')) {
      score += 10;
    }
    
    // Check for proper section headers
    if (!formatted.includes('7.') && !formatted.includes('Historique')) {
      score -= 15;
    }
    
    // Check for chronological structure
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g;
    const dates = formatted.match(datePattern);
    if (dates && dates.length > 1) {
      // Check if dates are in chronological order
      const sortedDates = [...dates].sort();
      if (JSON.stringify(dates) !== JSON.stringify(sortedDates)) {
        score -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateMedicalTermAccuracy = (original: string, formatted: string): number => {
    // Simple medical term preservation check
    const medicalTerms = ['diagnostic', 'symptôme', 'traitement', 'thérapie', 'médication', 'intervention'];
    let preservedTerms = 0;
    let totalTerms = 0;
    
    medicalTerms.forEach(term => {
      const originalCount = (original.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      const formattedCount = (formatted.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      
      if (originalCount > 0) {
        totalTerms += originalCount;
        preservedTerms += Math.min(originalCount, formattedCount);
      }
    });
    
    return totalTerms > 0 ? (preservedTerms / totalTerms) * 100 : 100;
  };

  const calculateStructuralConsistency = (formatted: string): number => {
    let score = 100;
    
    // Check for proper paragraph structure
    const paragraphs = formatted.split('\n\n').filter(p => p.trim().length > 0);
    if (paragraphs.length < 2) {
      score -= 20;
    }
    
    // Check for proper sentence structure
    const sentences = formatted.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength < 5 || avgSentenceLength > 30) {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateAIFormattingQuality = (original: string, formatted: string): number => {
    let score = 100;
    
    // Check for AI-specific improvements
    const originalPunctuation = (original.match(/[.!?]/g) || []).length;
    const formattedPunctuation = (formatted.match(/[.!?]/g) || []).length;
    
    if (formattedPunctuation > originalPunctuation) {
      score += 10; // Bonus for adding punctuation
    }
    
    // Check for capitalization improvements
    const originalCaps = (original.match(/[A-Z]/g) || []).length;
    const formattedCaps = (formatted.match(/[A-Z]/g) || []).length;
    
    if (formattedCaps > originalCaps) {
      score += 5; // Bonus for proper capitalization
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateFormattingAccuracy = (original: string, formatted: string): number => {
    // Simple formatting accuracy based on content preservation
    const originalWords = original.trim().split(/\s+/);
    const formattedWords = formatted.trim().split(/\s+/);
    
    const preservedWords = originalWords.filter(word => 
      formattedWords.some(fWord => fWord.toLowerCase().includes(word.toLowerCase()))
    ).length;
    
    return (preservedWords / originalWords.length) * 100;
  };

  const identifyTemplateSpecificIssues = (templateId: string, original: string, formatted: string): string[] => {
    const issues: string[] = [];
    
    if (templateId.includes('ai')) {
      // AI-specific checks
      if (formatted.length < original.length * 0.8) {
        issues.push('AI formatting may have removed too much content');
      }
      if (!formatted.includes('7.') && original.includes('7.')) {
        issues.push('Section header may have been lost during AI processing');
      }
    }
    
    if (templateId.includes('word-for-word')) {
      // Word-for-word specific checks
      const originalWords = original.split(/\s+/).length;
      const formattedWords = formatted.split(/\s+/).length;
      if (Math.abs(originalWords - formattedWords) > originalWords * 0.1) {
        issues.push('Word-for-word formatting may have changed word count significantly');
      }
    }
    
    if (templateId.includes('section-7')) {
      // Section 7 specific checks
      if (!formatted.includes('Historique')) {
        issues.push('Section 7 header may be missing');
      }
    }
    
    if (templateId.includes('section-8')) {
      // Section 8 specific checks
      if (!formatted.includes('Questionnaire subjectif') && !formatted.includes('Subjective questionnaire')) {
        issues.push('Section 8 header may be missing');
      }
      if (!formatted.includes('Appréciation subjective') && !formatted.includes('Subjective appreciation')) {
        issues.push('Section 8 subjective assessment section may be missing');
      }
    }
    
    return issues;
  };

  // Real AI analysis using backend API
  const analyzeTranscript = useCallback(async () => {
    if (!originalTranscript.trim() || !formattedTranscript.trim()) {
      alert('Please provide both original and formatted transcripts');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call analysis API
      const analysisResponse = await apiFetch('/api/analyze/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original: originalTranscript,
          formatted: formattedTranscript,
          language: 'fr' // Default to French for medical transcripts
        })
      });
      
      // Call comparison API
      const comparisonResponse = await apiFetch('/api/analyze/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original: originalTranscript,
          formatted: formattedTranscript
        })
      });
      
      if (analysisResponse.success && comparisonResponse.success) {
        setAnalysisResult(analysisResponse.result);
        setComparisonResult(comparisonResponse.result);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [originalTranscript, formattedTranscript]);

  // A/B Test function
  const runABTest = useCallback(async () => {
    if (!originalTranscript.trim() || !templateA || !templateB) {
      alert('Please provide a raw transcript and select both templates for A/B testing');
      return;
    }

    if (templateA === templateB) {
      alert('Please select different templates for A/B testing');
      return;
    }

    console.log('Starting A/B test with:', {
      templateA,
      templateB,
      originalLength: originalTranscript.length,
      language: detectLanguage(originalTranscript)
    });

    setIsRunningABTest(true);
    
    try {
      // Call A/B test API
      console.log('Calling A/B test API...');
      const response = await apiFetch('/api/analyze/ab-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original: originalTranscript,
          templateA,
          templateB,
          language: detectLanguage(originalTranscript)
        })
      });
      
      console.log('A/B test API response:', response);
      
      if (response.success) {
        console.log('A/B test successful, setting results:', response.result);
        setAbTestResult(response.result);
        
        // Update template performance tracking
        updateTemplatePerformance(response.result);
      } else {
        console.error('A/B test failed with response:', response);
        throw new Error(`A/B test failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('A/B test error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`A/B test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningABTest(false);
    }
  }, [originalTranscript, templateA, templateB]);

  // Benchmark comparison function (feature-flagged)
  const runBenchmarkComparison = useCallback(async () => {
    // Validate shared fields
    if (!benchmarkOriginal || !benchmarkOriginal.trim()) {
      alert('Please provide the original transcript (shared for all combinations).');
      return;
    }

    if (!benchmarkReference || !benchmarkReference.trim()) {
      alert('Please provide the reference/benchmark output (MD final version - shared for all combinations).');
      return;
    }

    // Validate items
    if (!benchmarkItems || benchmarkItems.length === 0) {
      alert('Please add at least 1 model+template combination to test.');
      return;
    }

    setIsRunningBenchmark(true);
    setBenchmarkResult(null);

    try {
      // Prepare request body based on mode
      let requestBody: any = {
        original: benchmarkOriginal.trim(),
        reference: benchmarkReference.trim(),
        config: {
          section: 'section_7', // Default, can be inferred from template
          language: detectLanguage(benchmarkOriginal),
          evaluationModel: selectedModel || 'gpt-4o-mini', // Model for evaluation report
        },
      };

      if (benchmarkMode === 'auto') {
        // Auto-generate mode: send combinations array
        const combinations = benchmarkItems.map(item => {
          // Auto-generate mode: require model and templateId
          if (!item.model || !item.templateId) {
            throw new Error(`Combination "${item.templateName}" must have both model and template selected for auto-generation.`);
          }
          return {
            name: item.templateName.trim() || `${item.model} + ${item.templateId}`,
            model: item.model,
            templateId: item.templateId,
            templateRef: item.templateId,
            // Output will be auto-generated on backend
          };
        });
        requestBody.combinations = combinations;
        requestBody.autoGenerate = true;
      } else {
        // Manual mode: send templates array with pre-formatted outputs
        const templates = benchmarkItems.map(item => {
          // Manual mode: require pre-formatted output
          if (!item.templateOutput || !item.templateOutput.trim()) {
            throw new Error(`Combination "${item.templateName}" must have a formatted output for manual comparison.`);
          }
          return {
            name: item.templateName.trim(),
            output: item.templateOutput.trim(),
            model: item.model || 'unknown',
            templateId: item.templateId || 'unknown',
          };
        });
        requestBody.templates = templates;
        requestBody.autoGenerate = false;
      }

      // Send to backend for processing (auto-generation if needed, then comparison)
      const response = await apiFetch('/api/benchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.success) {
        setBenchmarkResult(response);
        console.log('[Benchmark] Model+template performance evaluation completed:', response);
      } else {
        throw new Error(response.error || 'Benchmark comparison failed');
      }
    } catch (error) {
      console.error('[Benchmark] Error:', error);
      alert(`Model+template evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningBenchmark(false);
    }
  }, [benchmarkOriginal, benchmarkReference, benchmarkItems, benchmarkMode, selectedModel]);
  
  // Quick Compare function (2 models, same template)
  const runQuickCompare = useCallback(async () => {
    if (!quickCompareOriginal || !quickCompareOriginal.trim()) {
      alert('Please provide the original raw transcript.');
      return;
    }

    if (!quickCompareBenchmark || !quickCompareBenchmark.trim()) {
      alert('Please provide the benchmark/reference output (MD final version).');
      return;
    }

    if (!quickCompareTemplate) {
      alert('Please select a template.');
      return;
    }

    if (!quickCompareModelA || !quickCompareModelB) {
      alert('Please select both models to compare.');
      return;
    }

    if (quickCompareModelA === quickCompareModelB) {
      alert('Please select two different models to compare.');
      return;
    }

    setIsRunningQuickCompare(true);
    setQuickCompareResult(null);

    try {
      // Use benchmark endpoint with 2 combinations (same template, different models)
      const combinations = [
        {
          name: `${quickCompareModelA} + ${quickCompareTemplate}`,
          model: quickCompareModelA,
          templateId: quickCompareTemplate,
          templateRef: quickCompareTemplate,
        },
        {
          name: `${quickCompareModelB} + ${quickCompareTemplate}`,
          model: quickCompareModelB,
          templateId: quickCompareTemplate,
          templateRef: quickCompareTemplate,
        },
      ];

      const response = await apiFetch('/api/benchmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original: quickCompareOriginal.trim(),
          reference: quickCompareBenchmark.trim(),
          combinations: combinations,
          autoGenerate: true, // Always auto-generate for quick compare
          config: {
            section: 'section_7', // Default, can be inferred from template
            language: detectLanguage(quickCompareOriginal),
            evaluationModel: selectedModel || 'gpt-4o-mini', // Model for evaluation report
          },
        }),
      });

      if (response.success) {
        setQuickCompareResult(response);
        console.log('[Quick Compare] Model comparison completed:', response);
      } else {
        throw new Error(response.error || 'Quick compare failed');
      }
    } catch (error) {
      console.error('[Quick Compare] Error:', error);
      alert(`Model comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningQuickCompare(false);
    }
  }, [quickCompareOriginal, quickCompareBenchmark, quickCompareTemplate, quickCompareModelA, quickCompareModelB, selectedModel]);

  // Add benchmark item (model+template combination)
  const addBenchmarkItem = useCallback(() => {
    setBenchmarkItems(prev => [
      ...prev,
      { 
        templateName: `Combination ${prev.length + 1}`, 
        templateId: '',
        model: selectedModel || undefined, // Use undefined instead of null
        templateOutput: undefined, // Will be auto-generated
        isAutoGenerated: benchmarkMode === 'auto' 
      },
    ]);
  }, [selectedModel, benchmarkMode]);

  // Remove benchmark item
  const removeBenchmarkItem = useCallback((index: number) => {
    setBenchmarkItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update benchmark item
  const updateBenchmarkItem = useCallback((index: number, field: 'templateName' | 'templateId' | 'model' | 'templateOutput', value: string) => {
    setBenchmarkItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        // If switching to auto mode, clear templateOutput
        if (field === 'model' || field === 'templateId') {
          if (benchmarkMode === 'auto') {
            updated.templateOutput = undefined;
            updated.isAutoGenerated = true;
          }
        }
        return updated;
      }
      return item;
    }));
  }, [benchmarkMode]);

  // Update template performance tracking
  const updateTemplatePerformance = useCallback((result: ABTestResult) => {
    const updatePerformance = (templateId: string, templateName: string, won: boolean, tied: boolean, score: number) => {
      setTemplatePerformance(prev => {
        const existing = prev.find(p => p.templateId === templateId);
        const updated = existing ? {
          ...existing,
          wins: won ? existing.wins + 1 : existing.wins,
          losses: won ? existing.losses : existing.losses + 1,
          ties: tied ? existing.ties + 1 : existing.ties,
          totalTests: existing.totalTests + 1,
          averageScore: (existing.averageScore * existing.totalTests + score) / (existing.totalTests + 1),
          lastTestDate: result.testDate
        } : {
          templateId,
          templateName,
          wins: won ? 1 : 0,
          losses: won ? 0 : 1,
          ties: tied ? 1 : 0,
          totalTests: 1,
          averageScore: score,
          lastTestDate: result.testDate
        };

        const newPerformance = existing 
          ? prev.map(p => p.templateId === templateId ? updated : p)
          : [...prev, updated];

        // Save to localStorage
        localStorage.setItem('templatePerformance', JSON.stringify(newPerformance));
        return newPerformance;
      });
    };

    // Update performance for both templates
    const templateAWon = result.winner === 'A';
    const templateBWon = result.winner === 'B';
    const tied = result.winner === 'tie';

    updatePerformance(result.templateA.id, result.templateA.name, templateAWon, tied, result.templateA.comprehensiveScore || 0);
    updatePerformance(result.templateB.id, result.templateB.name, templateBWon, tied, result.templateB.comprehensiveScore || 0);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 80) return <TrendingUp className="h-4 w-4" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Transcript Analysis</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Analyze AI-formatted transcripts for quality, accuracy, and potential issues
          </p>
          {templateName && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Template: {templateName}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <span className="text-xs sm:text-sm text-gray-500">AI Analysis Engine</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Original Transcript</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the original, unformatted transcript here..."
              value={originalTranscript}
              onChange={(e) => setOriginalTranscript(e.target.value)}
              className="min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] resize-none w-full"
            />
            <div className="mt-2 text-sm text-gray-500">
              {originalTranscript.length} characters, {originalTranscript.split(' ').length} words
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>AI-Formatted Transcript</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the AI-formatted transcript here..."
              value={formattedTranscript}
              onChange={(e) => setFormattedTranscript(e.target.value)}
              className="min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] resize-none w-full"
            />
            <div className="mt-2 text-sm text-gray-500">
              {formattedTranscript.length} characters, {formattedTranscript.split(' ').length} words
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
              <Button
                variant={selectedAnalysis === 'quality' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('quality')}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Quality Analysis</span>
                <span className="sm:hidden">Quality</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'comparison' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('comparison')}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Compare Transcripts</span>
                <span className="sm:hidden">Compare</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'hallucination' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('hallucination')}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline">Hallucination Detection</span>
                <span className="md:hidden">Hallucination</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'ab-test' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('ab-test')}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <GitCompare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline">A/B Test Templates</span>
                <span className="md:hidden">A/B Test</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'single-template' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('single-template')}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                size="sm"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden lg:inline">Process Single Template</span>
                <span className="lg:hidden hidden sm:inline">Single Template</span>
                <span className="sm:hidden">Template</span>
              </Button>
              {flags.modelSelectionTranscriptAnalysis && (
                <>
                  <Button
                    variant={selectedAnalysis === 'quick-compare' ? 'default' : 'outline'}
                    onClick={() => setSelectedAnalysis('quick-compare')}
                    className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <GitCompare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="hidden md:inline">Quick Compare Models</span>
                    <span className="md:hidden">Quick Compare</span>
                  </Button>
                  <Button
                    variant={selectedAnalysis === 'benchmark' ? 'default' : 'outline'}
                    onClick={() => setSelectedAnalysis('benchmark')}
                    className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                    <span className="hidden md:inline">Benchmark Comparison</span>
                    <span className="md:hidden">Benchmark</span>
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {selectedAnalysis === 'ab-test' ? (
              <Button
                onClick={runABTest}
                disabled={isRunningABTest || !originalTranscript.trim() || !templateA || !templateB}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                {isRunningABTest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Running A/B Test...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4" />
                    <span>Run A/B Test</span>
                  </>
                )}
              </Button>
            ) : selectedAnalysis === 'single-template' ? (
              <Button
                onClick={processSingleTemplate}
                disabled={isProcessingTemplate || !originalTranscript.trim() || !selectedTemplate}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                {isProcessingTemplate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Process Template</span>
                  </>
                )}
              </Button>
            ) : selectedAnalysis === 'quick-compare' ? (
              <Button
                onClick={runQuickCompare}
                disabled={isRunningQuickCompare || !quickCompareOriginal.trim() || !quickCompareBenchmark.trim() || !quickCompareTemplate || !quickCompareModelA || !quickCompareModelB}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
                title={`Debug: original=${!!quickCompareOriginal.trim()}, benchmark=${!!quickCompareBenchmark.trim()}, template=${!!quickCompareTemplate}, modelA=${!!quickCompareModelA}, modelB=${!!quickCompareModelB}`}
              >
                {isRunningQuickCompare ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Comparing Models...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4" />
                    <span>Compare Models</span>
                  </>
                )}
              </Button>
            ) : selectedAnalysis === 'benchmark' ? (
              <Button
                onClick={runBenchmarkComparison}
                disabled={isRunningBenchmark || !benchmarkOriginal.trim() || !benchmarkReference.trim() || benchmarkItems.length === 0}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                {isRunningBenchmark ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Running Benchmark...</span>
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Run Benchmark</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={analyzeTranscript}
                disabled={isAnalyzing || !originalTranscript.trim() || !formattedTranscript.trim()}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Analyze Transcripts</span>
                  </>
                )}
              </Button>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Template Configuration */}
      {selectedAnalysis === 'single-template' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Single Template Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <div className="flex space-x-2">
                  <Select 
                    value={selectedTemplate} 
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      setSelectedTemplateVersion(undefined); // Reset version when template changes
                    }}
                    items={getAllTemplates().filter(t => t.isActive).map((template) => ({
                      label: template.name,
                      value: template.id
                    }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const template = getAllTemplates().find(t => t.id === selectedTemplate);
                      if (template) {
                        setPreviewTemplate(template);
                        setShowTemplatePreview(true);
                      }
                    }}
                    disabled={!selectedTemplate}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </Button>
                </div>
              </div>

              {/* Template Version Selection */}
              {selectedTemplate && (
                <VersionSelector
                  templateId={selectedTemplate}
                  value={selectedTemplateVersion}
                  onChange={setSelectedTemplateVersion}
                  disabled={isProcessingTemplate}
                />
              )}

              {/* Model Selection (Feature-flagged) */}
              {/* DEBUG: Always render a test div first */}
              {selectedAnalysis === 'single-template' && (
                <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                  DEBUG: selectedAnalysis={selectedAnalysis}, flag={String(flags.modelSelectionTranscriptAnalysis)}, type={typeof flags.modelSelectionTranscriptAnalysis}
                </div>
              )}
              {flags.modelSelectionTranscriptAnalysis && (
                <div className="space-y-4 pt-4 border-t">
                  <ModelSelector
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={isProcessingTemplate}
                    showAllowlistError={true}
                  />
                  
                  {/* Run Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="run-seed" className="text-sm font-medium text-gray-700">
                        Seed (Optional)
                      </Label>
                      <Input
                        id="run-seed"
                        type="number"
                        value={runSeed}
                        onChange={(e) => setRunSeed(e.target.value)}
                        placeholder="Random seed"
                        disabled={isProcessingTemplate}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For reproducibility (0-999999)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="run-temperature" className="text-sm font-medium text-gray-700">
                        Temperature (Optional)
                      </Label>
                      <Input
                        id="run-temperature"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={runTemperature}
                        onChange={(e) => setRunTemperature(e.target.value)}
                        placeholder="0.7"
                        disabled={isProcessingTemplate}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Controls randomness (0.0-2.0)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Select a template above and click "Process Template". 
                  The system will apply the selected template to your raw transcript (just like in the dictation page) 
                  and display the formatted result below.
                  {flags.modelSelectionTranscriptAnalysis && (
                    <>
                      <br />
                      <strong>Model Selection:</strong> Choose an AI model to use for formatting. 
                      Default is GPT-4o Mini. Use seed and temperature for reproducible results.
                    </>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B Test Configuration */}
      {selectedAnalysis === 'ab-test' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCompare className="h-5 w-5" />
              <span>A/B Test Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template A
                </label>
                <Select 
                  value={templateA} 
                  onValueChange={setTemplateA}
                  items={getAllTemplates().filter(t => t.isActive).map((template) => ({
                    label: template.name,
                    value: template.id
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template B
                </label>
                <Select 
                  value={templateB} 
                  onValueChange={setTemplateB}
                  items={getAllTemplates().filter(t => t.isActive).map((template) => ({
                    label: template.name,
                    value: template.id
                  }))}
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Paste a raw transcript above, select two templates, and click "Run A/B Test". 
                The system will apply both templates (just like in the dictation page) and compare their performance to determine which produces better results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Template Processing Results */}
      {selectedAnalysis === 'single-template' && (templateProcessingResult || templateProcessingError) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Template Processing Result</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templateProcessingError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Processing Error</span>
                </div>
                <p className="text-red-700 mt-2">{templateProcessingError}</p>
              </div>
            ) : templateProcessingResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Template Processing Successful</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Template "{getAllTemplates().find(t => t.id === selectedTemplate)?.name}" 
                    has been applied successfully.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formatted Result
                  </label>
                  <Textarea
                    value={templateProcessingResult}
                    readOnly
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Formatted result will appear here..."
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Template-Specific Analysis Results */}
      {selectedAnalysis === 'single-template' && templateAnalysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Template-Specific Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Template Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {templateAnalysisResult.templateName}
                </div>
                <div className="text-sm text-gray-500">Template Performance Analysis</div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">CNESST Compliance</span>
                    <span className={`text-lg font-bold ${templateAnalysisResult.cnesstCompliance >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                      {templateAnalysisResult.cnesstCompliance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${templateAnalysisResult.cnesstCompliance}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Formatting Accuracy</span>
                    <span className={`text-lg font-bold ${templateAnalysisResult.formattingAccuracy >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                      {templateAnalysisResult.formattingAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${templateAnalysisResult.formattingAccuracy}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-800">Medical Term Accuracy</span>
                    <span className={`text-lg font-bold ${templateAnalysisResult.medicalTermAccuracy >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                      {templateAnalysisResult.medicalTermAccuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${templateAnalysisResult.medicalTermAccuracy}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-800">Structural Consistency</span>
                    <span className={`text-lg font-bold ${templateAnalysisResult.structuralConsistency >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                      {templateAnalysisResult.structuralConsistency.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${templateAnalysisResult.structuralConsistency}%` }}
                    ></div>
                  </div>
                </div>

                {templateAnalysisResult.templateId.includes('ai') && (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-800">AI Formatting Quality</span>
                      <span className={`text-lg font-bold ${templateAnalysisResult.aiFormattingQuality >= 85 ? 'text-green-600' : 'text-orange-600'}`}>
                        {templateAnalysisResult.aiFormattingQuality.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${templateAnalysisResult.aiFormattingQuality}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Word Count Change</span>
                    <span className={`text-lg font-bold ${Math.abs(templateAnalysisResult.wordCountChange) <= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                      {templateAnalysisResult.wordCountChange > 0 ? '+' : ''}{templateAnalysisResult.wordCountChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Processing time: {templateAnalysisResult.processingTime.toFixed(2)}s
                  </div>
                </div>
              </div>

              {/* Template-Specific Issues */}
              {templateAnalysisResult.templateSpecificIssues.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Template-Specific Issues</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    {templateAnalysisResult.templateSpecificIssues.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Overall Quality Score</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                    {analysisResult.overallScore}
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResult.overallScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{analysisResult.processingTime}s</span>
                  </div>
                  <div className="text-sm text-gray-500">Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(analysisResult.metrics).map(([key, score]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(score)}
                      <span className="text-sm font-medium capitalize">
                        {key.replace('Score', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <Badge className={getScoreColor(score)}>
                      {score}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Issues and Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Detected Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysisResult.issues).map(([category, issues]) => (
                  issues.length > 0 && (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <ul className="space-y-1">
                        {issues.map((issue, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Improvement Suggestions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Results */}
          {comparisonResult && selectedAnalysis === 'comparison' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Transcript Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {(comparisonResult.similarity * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Similarity</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl sm:text-2xl font-bold ${comparisonResult.wordCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonResult.wordCountChange >= 0 ? '+' : ''}{comparisonResult.wordCountChange}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Word Count Change</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl sm:text-2xl font-bold ${comparisonResult.sentenceCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonResult.sentenceCountChange >= 0 ? '+' : ''}{comparisonResult.sentenceCountChange}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Sentence Count Change</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Additions</h4>
                    <ul className="space-y-1">
                      {comparisonResult.additions.map((addition, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{addition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Deletions</h4>
                    <ul className="space-y-1">
                      {comparisonResult.deletions.map((deletion, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <TrendingDown className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{deletion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Modifications</h4>
                    <ul className="space-y-1">
                      {comparisonResult.modifications.map((modification, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <Zap className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{modification}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Checklist */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Analysis Checklist</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysisResult.checklist).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        value ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {value ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className={`text-xs ${value ? 'text-green-600' : 'text-red-600'}`}>
                          {value ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison Table */}
          {analysisResult && analysisResult.comparisonTable.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Detailed Comparison Table</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Original Text
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Formatted Text
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Suggestion
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisResult.comparisonTable.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${
                              item.type === 'hallucination' ? 'bg-red-100 text-red-800' :
                              item.type === 'error' ? 'bg-orange-100 text-orange-800' :
                              item.type === 'deletion' ? 'bg-yellow-100 text-yellow-800' :
                              item.type === 'modification' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${
                              item.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              item.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.severity}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={item.originalText}>
                              {item.originalText}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={item.formattedText}>
                              {item.formattedText}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="truncate" title={item.description}>
                              {item.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                            <div className="truncate" title={item.suggestion}>
                              {item.suggestion || 'No suggestion'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* A/B Test Results */}
      {abTestResult && selectedAnalysis === 'ab-test' && (
        <div className="space-y-6">
          {/* Winner Announcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>A/B Test Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {abTestResult.winner === 'tie' ? (
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    🤝 It's a Tie!
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    🏆 Template {abTestResult.winner} Wins!
                  </div>
                )}
                <div className="text-lg text-gray-600 mb-4">
                  {abTestResult.templateA.name} vs {abTestResult.templateB.name}
                </div>
                <div className="text-sm text-gray-500">
                  Performance Gap: {abTestResult.performanceGap?.toFixed(1) || 'N/A'} points
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Template A Results */}
            <Card className={`${abTestResult.winner === 'A' ? 'ring-2 ring-green-500 bg-green-50' : 'bg-blue-50'} transition-all duration-200`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-mono">A</span>
                    <span>{abTestResult.templateA.name}</span>
                  </span>
                  {abTestResult.winner === 'A' && <Trophy className="h-5 w-5 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(abTestResult.templateA.comprehensiveScore || 0)}`}>
                      {abTestResult.templateA.comprehensiveScore?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Comprehensive Score</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Overall: {abTestResult.templateA.analysis?.overallScore || 'N/A'} | 
                      Hallucination: {abTestResult.templateA.analysis?.metrics?.hallucinationScore || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 max-h-60 overflow-y-auto">
                    <strong>Formatted Output:</strong>
                    <div className="mt-2 p-4 bg-white border rounded-lg shadow-sm">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {abTestResult.templateA.formatted}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template B Results */}
            <Card className={`${abTestResult.winner === 'B' ? 'ring-2 ring-green-500 bg-green-50' : 'bg-purple-50'} transition-all duration-200`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded font-mono">B</span>
                    <span>{abTestResult.templateB.name}</span>
                  </span>
                  {abTestResult.winner === 'B' && <Trophy className="h-5 w-5 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(abTestResult.templateB.comprehensiveScore || 0)}`}>
                      {abTestResult.templateB.comprehensiveScore?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Comprehensive Score</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Overall: {abTestResult.templateB.analysis?.overallScore || 'N/A'} | 
                      Hallucination: {abTestResult.templateB.analysis?.metrics?.hallucinationScore || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 max-h-60 overflow-y-auto">
                    <strong>Formatted Output:</strong>
                    <div className="mt-2 p-4 bg-white border rounded-lg shadow-sm">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {abTestResult.templateB.formatted}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Detailed Metrics Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Template A Metrics */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-600 flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-mono">A</span>
                    <span>{abTestResult.templateA.name}</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Structural Consistency:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.structuralConsistency >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.structuralConsistency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Editing Effort:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.editingEffort <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                        {abTestResult.templateA.metrics.editingEffort.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Preservation:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.contentPreservation >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.contentPreservation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Voice Commands:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.voiceCommandProcessing >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.voiceCommandProcessing.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speaker Prefixes:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.speakerPrefixHandling >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.speakerPrefixHandling.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capitalization:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.capitalizationConsistency >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.capitalizationConsistency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paragraph Breaks:</span>
                      <span className="font-medium text-gray-600">
                        {abTestResult.templateA.metrics.paragraphBreaks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Count Change:</span>
                      <span className={`font-medium ${abTestResult.templateA.metrics.wordCountChange <= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateA.metrics.wordCountChange > 0 ? '+' : ''}{abTestResult.templateA.metrics.wordCountChange}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Template B Metrics */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-600 flex items-center space-x-2">
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded font-mono">B</span>
                    <span>{abTestResult.templateB.name}</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Structural Consistency:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.structuralConsistency >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.structuralConsistency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Editing Effort:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.editingEffort <= 20 ? 'text-green-600' : 'text-red-600'}`}>
                        {abTestResult.templateB.metrics.editingEffort.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Preservation:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.contentPreservation >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.contentPreservation.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Voice Commands:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.voiceCommandProcessing >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.voiceCommandProcessing.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speaker Prefixes:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.speakerPrefixHandling >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.speakerPrefixHandling.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capitalization:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.capitalizationConsistency >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.capitalizationConsistency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paragraph Breaks:</span>
                      <span className="font-medium text-gray-600">
                        {abTestResult.templateB.metrics.paragraphBreaks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Count Change:</span>
                      <span className={`font-medium ${abTestResult.templateB.metrics.wordCountChange <= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                        {abTestResult.templateB.metrics.wordCountChange > 0 ? '+' : ''}{abTestResult.templateB.metrics.wordCountChange}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Performance History */}
          {templatePerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Template Performance History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Wins
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Losses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ties
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Win Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Test
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {templatePerformance.map((perf) => (
                        <tr key={perf.templateId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {perf.templateName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {perf.wins}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {perf.losses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {perf.ties}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((perf.wins / perf.totalTests) * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {perf.averageScore.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(perf.lastTestDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Compare Section (Feature-flagged) - Compare 2 models with same template */}
      {flags.modelSelectionTranscriptAnalysis && selectedAnalysis === 'quick-compare' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitCompare className="h-5 w-5" />
              <span>Quick Compare Models</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Quick Model Comparison:</strong> Compare two AI models using the same template and see which performs better.
                  <br />• <strong>Raw Transcript:</strong> Paste the original unformatted transcript
                  <br />• <strong>Benchmark:</strong> Paste the MD edited final version (gold standard)
                  <br />• <strong>Template:</strong> Select the template to use (same for both models)
                  <br />• <strong>Models:</strong> Select two different models to compare (e.g., GPT-4 vs Gemini Flash)
                  <br />• <strong>Results:</strong> See which model produces better output for this case
                </p>
              </div>

              {/* Shared Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quick-compare-original" className="text-sm font-medium">
                    Raw Transcript <span className="text-gray-500">(shared for both models)</span>
                  </Label>
                  <Textarea
                    id="quick-compare-original"
                    value={quickCompareOriginal}
                    onChange={(e) => setQuickCompareOriginal(e.target.value)}
                    placeholder="Paste the original raw transcript here..."
                    disabled={isRunningQuickCompare}
                    className="min-h-[150px] mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the source transcript that both models will process
                  </p>
                </div>

                <div>
                  <Label htmlFor="quick-compare-benchmark" className="text-sm font-medium">
                    Benchmark/Reference <span className="text-gray-500">(MD final version)</span>
                  </Label>
                  <Textarea
                    id="quick-compare-benchmark"
                    value={quickCompareBenchmark}
                    onChange={(e) => setQuickCompareBenchmark(e.target.value)}
                    placeholder="Paste the MD edited final version here (gold standard for comparison)..."
                    disabled={isRunningQuickCompare}
                    className="min-h-[150px] mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the benchmark/gold standard to compare both models against
                  </p>
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quick-compare-template" className="text-sm font-medium">
                    Template <span className="text-gray-500">(same for both models)</span>
                  </Label>
                  <Select
                    value={quickCompareTemplate}
                    onValueChange={setQuickCompareTemplate}
                    items={getAllTemplates().filter(t => t.isActive).map((template) => ({
                      label: template.name,
                      value: template.id
                    }))}
                    disabled={isRunningQuickCompare}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Both models will use this same template
                  </p>
                </div>
              </div>

              {/* Model Selection - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Model A
                  </Label>
                  <ModelSelector
                    value={quickCompareModelA}
                    onValueChange={(val) => {
                      console.log('[Quick Compare] Model A selected:', val);
                      setQuickCompareModelA(val);
                    }}
                    disabled={isRunningQuickCompare}
                    showAllowlistError={false}
                  />
                  <p className="text-xs text-gray-500">
                    First model to compare (e.g., gpt-4o)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Model B
                  </Label>
                  <ModelSelector
                    value={quickCompareModelB}
                    onValueChange={(val) => {
                      console.log('[Quick Compare] Model B selected:', val);
                      setQuickCompareModelB(val);
                    }}
                    disabled={isRunningQuickCompare}
                    showAllowlistError={false}
                  />
                  <p className="text-xs text-gray-500">
                    Second model to compare (e.g., gemini-2.0-flash-exp)
                  </p>
                </div>
              </div>

              {/* Comparison Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>How it works:</strong> Both models will process the same raw transcript using the same template, 
                  then compare their outputs against the benchmark. The system will show which model performed better 
                  based on similarity, content preservation, and formatting accuracy.
                </p>
              </div>

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono">
                  <strong>Debug Info:</strong>
                  <br />Original: {quickCompareOriginal.trim() ? `✅ (${quickCompareOriginal.trim().length} chars)` : '❌ Empty'}
                  <br />Benchmark: {quickCompareBenchmark.trim() ? `✅ (${quickCompareBenchmark.trim().length} chars)` : '❌ Empty'}
                  <br />Template: {quickCompareTemplate || '❌ Not selected'}
                  <br />Model A: {quickCompareModelA || '❌ Not selected'}
                  <br />Model B: {quickCompareModelB || '❌ Not selected'}
                  <br />Button Enabled: {!isRunningQuickCompare && quickCompareOriginal.trim() && quickCompareBenchmark.trim() && quickCompareTemplate && quickCompareModelA && quickCompareModelB ? '✅ YES' : '❌ NO'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Compare Results */}
      {quickCompareResult && selectedAnalysis === 'quick-compare' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Model Comparison Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quickCompareResult.results && quickCompareResult.results.length >= 2 && (
              <div className="space-y-6">
                {/* Best Model */}
                {quickCompareResult.results[0] && (
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-800">🏆 Best Performing Model</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Model:</strong> {quickCompareResult.results[0].model || 'unknown'} | 
                        <strong> Template:</strong> {quickCompareResult.results[0].templateId || 'unknown'}
                        {quickCompareResult.results[0].requestedModel && quickCompareResult.results[0].requestedModel !== quickCompareResult.results[0].model && (
                          <span className="text-yellow-600 ml-2">
                            (⚠️ Requested: {quickCompareResult.results[0].requestedModel}, but {quickCompareResult.results[0].model} was used)
                          </span>
                        )}
                      </p>
                      <p className="text-sm">
                        <strong>Overall Score:</strong> {quickCompareResult.results[0].metrics?.overallScore?.toFixed(1) || 'N/A'}%
                      </p>
                      <p className="text-sm">
                        <strong>Similarity:</strong> {quickCompareResult.results[0].metrics?.similarity?.toFixed(1) || 'N/A'}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickCompareResult.results.slice(0, 2).map((result: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                          {index === 0 ? '🥇' : '🥈'} {result.model || 'Unknown Model'}
                          {result.requestedModel && result.requestedModel !== result.model && (
                            <span className="text-xs text-yellow-600 ml-2">
                              (Requested: {result.requestedModel})
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Overall Score</p>
                          <p className="text-2xl font-bold">{result.metrics?.overallScore?.toFixed(1) || 'N/A'}%</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Similarity:</span>
                            <span className="font-medium">{result.metrics?.similarity?.toFixed(1) || 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Content Preservation:</span>
                            <span className="font-medium">{result.metrics?.contentPreservation?.toFixed(1) || 'N/A'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Formatting Accuracy:</span>
                            <span className="font-medium">{result.metrics?.formattingAccuracy?.toFixed(1) || 'N/A'}%</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-gray-600 mb-1">Formatted Output</p>
                          <Textarea
                            value={result.outputPreview || result.output || ''}
                            readOnly
                            className="min-h-[200px] text-xs font-mono"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Evaluation Report */}
                {quickCompareResult.evaluationReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">AI Evaluation Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                        {quickCompareResult.evaluationReport}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benchmark Comparison Section (Feature-flagged) */}
      {flags.modelSelectionTranscriptAnalysis && selectedAnalysis === 'benchmark' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Benchmark Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Model+Template Performance Evaluation:</strong> Test multiple model+template combinations against a benchmark.
                      <br />• <strong>Original Transcript:</strong> The raw transcript (shared for all combinations)
                      <br />• <strong>Reference/Benchmark:</strong> The MD edited final version (gold standard)
                      <br />• <strong>Combinations:</strong> Select model+template pairs to test (outputs auto-generated)
                      <br />• <strong>Results:</strong> See which model+template works best for this case
                    </p>
                  </div>

                  {/* Mode Selection: Auto vs Manual */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Label className="text-sm font-medium mb-3 block">
                      Benchmark Mode
                    </Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="benchmark-mode"
                          value="auto"
                          checked={benchmarkMode === 'auto'}
                          onChange={(e) => setBenchmarkMode(e.target.value as 'auto' | 'manual')}
                          disabled={isRunningBenchmark}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">
                          <strong>Auto-Generate</strong> (Test model+template combinations - outputs generated automatically)
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="benchmark-mode"
                          value="manual"
                          checked={benchmarkMode === 'manual'}
                          onChange={(e) => setBenchmarkMode(e.target.value as 'auto' | 'manual')}
                          disabled={isRunningBenchmark}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">
                          <strong>Manual</strong> (Compare pre-formatted template outputs)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Model Selection for Evaluation Report */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Label className="text-sm font-medium mb-2 block">
                      Select AI Model for Evaluation Report
                    </Label>
                    <p className="text-xs text-gray-600 mb-3">
                      Choose which AI model will generate the evaluation report analyzing template performance.
                    </p>
                    <ModelSelector
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      disabled={isRunningBenchmark}
                      showAllowlistError={true}
                    />
                  </div>

                  {/* Shared Fields */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="benchmark-original-shared" className="text-sm font-medium">
                        Original Transcript <span className="text-gray-500">(shared for all templates)</span>
                      </Label>
                      <Textarea
                        id="benchmark-original-shared"
                        value={benchmarkOriginal}
                        onChange={(e) => setBenchmarkOriginal(e.target.value)}
                        placeholder="Paste the original raw transcript here (same for all template comparisons)..."
                        disabled={isRunningBenchmark}
                        className="min-h-[120px] mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the source transcript that all templates process
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="benchmark-reference-shared" className="text-sm font-medium">
                        Reference/Benchmark (MD Final) <span className="text-gray-500">(shared for all templates)</span>
                      </Label>
                      <Textarea
                        id="benchmark-reference-shared"
                        value={benchmarkReference}
                        onChange={(e) => setBenchmarkReference(e.target.value)}
                        placeholder="Paste the MD edited final version here (gold standard for comparison)..."
                        disabled={isRunningBenchmark}
                        className="min-h-[120px] mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the benchmark/gold standard to compare templates against
                      </p>
                    </div>
                  </div>

                  {/* Model+Template Combinations */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {benchmarkMode === 'auto' ? 'Model+Template Combinations' : 'Template Outputs'}
                      </h3>
                      <Button
                        onClick={addBenchmarkItem}
                        variant="outline"
                        size="sm"
                        disabled={isRunningBenchmark}
                      >
                        + Add {benchmarkMode === 'auto' ? 'Combination' : 'Template'}
                      </Button>
                    </div>

                    {benchmarkItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        <p>No combinations added yet. Click "Add {benchmarkMode === 'auto' ? 'Combination' : 'Template'}" to start.</p>
                        <p className="text-xs mt-2">
                          {benchmarkMode === 'auto' 
                            ? 'Add at least 1 model+template combination to test automatically'
                            : 'Add at least 1 template output to compare performance'}
                        </p>
                      </div>
                    )}

                    {benchmarkItems.map((item, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                              {benchmarkMode === 'auto' ? `Combination ${index + 1}` : `Template ${index + 1}`}
                            </CardTitle>
                            {benchmarkItems.length > 0 && (
                              <Button
                                onClick={() => removeBenchmarkItem(index)}
                                variant="ghost"
                                size="sm"
                                disabled={isRunningBenchmark}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor={`benchmark-combination-name-${index}`} className="text-sm font-medium">
                              Combination Name
                            </Label>
                            <Input
                              id={`benchmark-combination-name-${index}`}
                              value={item.templateName}
                              onChange={(e) => updateBenchmarkItem(index, 'templateName', e.target.value)}
                              placeholder={benchmarkMode === 'auto' ? 'e.g., GPT-4o-mini + Section 7 R&D' : 'e.g., Section 7 R&D'}
                              disabled={isRunningBenchmark}
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Name for this {benchmarkMode === 'auto' ? 'model+template combination' : 'template'}
                            </p>
                          </div>
                          
                          {benchmarkMode === 'auto' && (
                            <>
                              <div>
                                <Label htmlFor={`benchmark-model-${index}`} className="text-sm font-medium">
                                  AI Model
                                </Label>
                                <ModelSelector
                                  value={item.model || null}
                                  onValueChange={(model) => updateBenchmarkItem(index, 'model', model || '')}
                                  disabled={isRunningBenchmark}
                                  showAllowlistError={false}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Select the AI model to use for formatting
                                </p>
                              </div>
                              <div>
                                <Label htmlFor={`benchmark-template-${index}`} className="text-sm font-medium">
                                  Template
                                </Label>
                                <select
                                  id={`benchmark-template-${index}`}
                                  value={item.templateId || ''}
                                  onChange={(e) => updateBenchmarkItem(index, 'templateId', e.target.value)}
                                  disabled={isRunningBenchmark}
                                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                  <option value="">Select template...</option>
                                  {getAllTemplates().filter(t => t.isActive).map((template) => (
                                    <option key={template.id} value={template.id}>
                                      {template.name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                  Select the template to use for formatting
                                </p>
                              </div>
                            </>
                          )}

                          {benchmarkMode === 'manual' && (
                            <div>
                              <Label htmlFor={`benchmark-template-output-${index}`} className="text-sm font-medium">
                                Template Output
                              </Label>
                              <Textarea
                                id={`benchmark-template-output-${index}`}
                                value={item.templateOutput || ''}
                                onChange={(e) => updateBenchmarkItem(index, 'templateOutput', e.target.value)}
                                placeholder="Paste this template's formatted output here..."
                                disabled={isRunningBenchmark}
                                className="min-h-[120px] mt-1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                The formatted output from this template
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {benchmarkItems.length > 0 && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={runBenchmarkComparison}
                          disabled={
                            isRunningBenchmark || 
                            !benchmarkOriginal.trim() || 
                            !benchmarkReference.trim() || 
                            benchmarkItems.length === 0 || 
                            (benchmarkMode === 'auto' 
                              ? benchmarkItems.some(item => !item.templateName || !item.model || !item.templateId)
                              : benchmarkItems.some(item => !item.templateName || !item.templateOutput || !item.templateOutput.trim()))
                          }
                          className="w-full"
                          size="lg"
                        >
                          {isRunningBenchmark ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              <span>
                                {benchmarkMode === 'auto' 
                                  ? 'Generating outputs and evaluating combinations...' 
                                  : 'Evaluating template performance...'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Target className="h-5 w-5 mr-2" />
                              <span>
                                {benchmarkMode === 'auto' 
                                  ? 'Test Model+Template Combinations' 
                                  : 'Evaluate Template Performance'}
                              </span>
                            </>
                          )}
                        </Button>
                        {(!benchmarkOriginal.trim() || !benchmarkReference.trim()) && (
                          <p className="text-xs text-red-500 mt-2 text-center">
                            ⚠️ Please provide Original Transcript and Reference/Benchmark
                          </p>
                        )}
                        {benchmarkOriginal.trim() && benchmarkReference.trim() && benchmarkItems.length === 0 && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Add at least 1 {benchmarkMode === 'auto' ? 'model+template combination' : 'template output'} to compare
                          </p>
                        )}
                        {benchmarkOriginal.trim() && benchmarkReference.trim() && benchmarkItems.length > 0 && (
                          benchmarkMode === 'auto' 
                            ? (benchmarkItems.some(item => !item.templateName || !item.model || !item.templateId) ? (
                                <p className="text-xs text-red-500 mt-2 text-center">
                                  ⚠️ Please fill in combination name, model, and template for all combinations
                                </p>
                              ) : (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✅ Ready to test {benchmarkItems.length} combination{benchmarkItems.length > 1 ? 's' : ''}!
                                </p>
                              ))
                            : (benchmarkItems.some(item => !item.templateName || !item.templateOutput || !item.templateOutput.trim()) ? (
                                <p className="text-xs text-red-500 mt-2 text-center">
                                  ⚠️ Please fill in template name and output for all templates
                                </p>
                              ) : (
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  ✅ Ready to evaluate {benchmarkItems.length} template{benchmarkItems.length > 1 ? 's' : ''}!
                                </p>
                              ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benchmark Results */}
          {benchmarkResult && selectedAnalysis === 'benchmark' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Template Performance Evaluation Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {benchmarkResult.summary && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      {benchmarkResult.autoGenerated ? '🏆 Best Performing Model+Template Combination' : '🏆 Best Performing Template'}
                    </h4>
                    <p className="text-lg font-bold text-green-900">
                      {benchmarkResult.summary.bestTemplate || 'N/A'} 
                      {benchmarkResult.summary.bestScore && ` (${benchmarkResult.summary.bestScore.toFixed(1)}% overall score)`}
                    </p>
                    {benchmarkResult.autoGenerated && benchmarkResult.results && benchmarkResult.results.length > 0 && (() => {
                      const bestResult = benchmarkResult.results.find((r: any) => r.templateName === benchmarkResult.summary.bestTemplate);
                      if (bestResult && (bestResult.model || bestResult.templateId)) {
                        return (
                          <p className="text-sm text-green-800 mt-1">
                            <strong>Model:</strong> {bestResult.model || 'unknown'} | <strong>Template:</strong> {bestResult.templateId || 'unknown'}
                          </p>
                        );
                      }
                      return null;
                    })()}
                    <p className="text-sm text-green-700 mt-1">
                      {benchmarkResult.summary.interpretation}
                    </p>
                  </div>
                )}
                
                {benchmarkResult.statistics && (
                  <div className="space-y-6">
                    {/* Mode indicator */}
                    {benchmarkResult.statistics.mode === 'simple' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 Simple Comparison Mode</h4>
                        <p className="text-sm text-blue-700">
                          Single template evaluation results. Add 3+ templates for statistical analysis (Wilcoxon test, confidence intervals).
                        </p>
                      </div>
                    )}
                    {benchmarkResult.statistics.mode === 'statistical' && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">📈 Statistical Analysis Mode</h4>
                        <p className="text-sm text-purple-700">
                          Multi-template statistical analysis with Wilcoxon signed-rank test and bootstrap confidence intervals.
                        </p>
                      </div>
                    )}
                    
                    {/* Simple comparison results */}
                    {benchmarkResult.statistics.mode === 'simple' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">
                            {benchmarkResult.statistics.overall_score?.toFixed(1) || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Overall Score</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {benchmarkResult.statistics.similarity?.toFixed(1) || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Similarity</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-orange-600">
                            {benchmarkResult.statistics.content_preservation?.toFixed(1) || 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Content Preserved</div>
                        </div>
                      </div>
                    )}

                    {/* Statistical Summary (only for statistical mode) */}
                    {benchmarkResult.statistics.mode === 'statistical' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {benchmarkResult.statistics.p_value?.toFixed(4) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">P-Value</div>
                        <div className={`text-xs mt-1 ${benchmarkResult.statistics.significant ? 'text-green-600' : 'text-gray-500'}`}>
                          {benchmarkResult.statistics.significant ? 'Significant' : 'Not Significant'}
                        </div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {benchmarkResult.statistics.effect_size?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Effect Size</div>
                        <div className="text-xs text-gray-500 mt-1">(Cohen's d)</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {benchmarkResult.statistics.ci_low?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">CI Lower</div>
                        <div className="text-xs text-gray-500 mt-1">(95% CI)</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                          {benchmarkResult.statistics.ci_high?.toFixed(2) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">CI Upper</div>
                        <div className="text-xs text-gray-500 mt-1">(95% CI)</div>
                      </div>
                    </div>
                    )}

                    {/* Interpretation */}
                    {benchmarkResult.statistics.mode === 'statistical' ? (
                      <div className={`p-4 rounded-lg ${benchmarkResult.statistics.significant ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <h4 className="font-medium mb-2">
                          {benchmarkResult.statistics.significant ? '🔍 Significant Difference Detected' : '✅ No Significant Difference'}
                        </h4>
                        <p className="text-sm text-gray-700">
                          {benchmarkResult.summary?.interpretation || 'Statistical analysis indicates whether your current output significantly differs from the reference benchmark.'}
                        </p>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Sample Size: {benchmarkResult.statistics.sample_size || benchmarkResult.results?.length || 0} items</p>
                          <p>Valid Items: {benchmarkResult.summary?.validItems || 0} / {benchmarkResult.summary?.totalItems || 0}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <h4 className="font-medium mb-2">📊 Comparison Results</h4>
                        <p className="text-sm text-gray-700">
                          {benchmarkResult.summary?.interpretation || `Overall score: ${benchmarkResult.statistics.overall_score?.toFixed(1)}%. Similarity: ${benchmarkResult.statistics.similarity?.toFixed(1)}%`}
                        </p>
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Word Count Difference: {benchmarkResult.statistics.word_count_diff || 0}</p>
                          <p>Sentence Count Difference: {benchmarkResult.statistics.sentence_count_diff || 0}</p>
                          <p>Formatting Accuracy: {benchmarkResult.statistics.formatting_accuracy?.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}

                    {/* Template/Combination Ranking and Results */}
                    {benchmarkResult.results && benchmarkResult.results.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">
                          {benchmarkResult.autoGenerated ? 'Model+Template Combination Ranking' : 'Template Performance Ranking'}
                        </h4>
                        <div className="space-y-4">
                          {benchmarkResult.results.map((result: any, index: number) => (
                            result.error ? (
                              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                <strong>{result.templateName || `Combination ${index + 1}`}:</strong> {result.error}
                              </div>
                            ) : (
                              <Card key={index} className={`border-l-4 ${
                                result.rank === 1 ? 'border-l-green-500 bg-green-50' :
                                result.rank === 2 ? 'border-l-blue-500 bg-blue-50' :
                                result.rank === 3 ? 'border-l-yellow-500 bg-yellow-50' :
                                'border-l-gray-500 bg-gray-50'
                              }`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                                        result.rank === 1 ? 'bg-green-500 text-white' :
                                        result.rank === 2 ? 'bg-blue-500 text-white' :
                                        result.rank === 3 ? 'bg-yellow-500 text-white' :
                                        'bg-gray-500 text-white'
                                      }`}>
                                        {result.rank || index + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base">
                                          {result.templateName || (benchmarkResult.autoGenerated ? `Combination ${index + 1}` : `Template ${index + 1}`)}
                                          {result.rank === 1 && <span className="ml-2 text-xs font-normal text-green-600">🏆 Best</span>}
                                        </CardTitle>
                                        {benchmarkResult.autoGenerated && (result.model || result.templateId) && (
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {result.model && (
                                              <Badge variant="outline" className="text-xs">
                                                Model: {result.model}
                                              </Badge>
                                            )}
                                            {result.templateId && (
                                              <Badge variant="outline" className="text-xs">
                                                Template: {result.templateId}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                      <div className="text-lg font-bold text-gray-900">
                                        {result.metrics?.overallScore?.toFixed(1) || 'N/A'}%
                                      </div>
                                      <div className="text-xs text-gray-500">Overall Score</div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {/* Performance Metrics */}
                                  {result.metrics && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <div className="text-xs text-gray-500">Similarity</div>
                                        <div className="font-medium">{result.metrics.similarity?.toFixed(1)}%</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Content Preserved</div>
                                        <div className="font-medium">{result.metrics.contentPreservation?.toFixed(1)}%</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Word Diff</div>
                                        <div className="font-medium">{result.metrics.wordCountDiff || 0}</div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500">Formatting</div>
                                        <div className="font-medium">{result.metrics.formattingAccuracy?.toFixed(1)}%</div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Missing Phrases */}
                                  {result.missingPhrases && result.missingPhrases.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="text-xs font-medium text-red-600 mb-2">
                                        Missing Phrases from Original ({result.missingPhrases.length})
                                      </div>
                                      <div className="space-y-1">
                                        {result.missingPhrases.slice(0, 5).map((phrase: string, phraseIndex: number) => (
                                          <div key={phraseIndex} className="text-xs text-gray-600 p-2 bg-red-50 border border-red-100 rounded">
                                            {phrase.length > 100 ? phrase.substring(0, 100) + '...' : phrase}
                                          </div>
                                        ))}
                                        {result.missingPhrases.length > 5 && (
                                          <div className="text-xs text-gray-500 italic">
                                            ... and {result.missingPhrases.length - 5} more
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Evaluation Report */}
                    {benchmarkResult.evaluationReport && (
                      <div className="mt-6 pt-6 border-t">
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Brain className="h-5 w-5 text-blue-600" />
                              <span>AI Evaluation Report</span>
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-2">
                              Comprehensive analysis of template performance, hallucinations, and improvement recommendations
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                                {benchmarkResult.evaluationReport}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

      {/* Template Preview Modal */}
      {showTemplatePreview && previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          isOpen={showTemplatePreview}
          onClose={() => {
            setShowTemplatePreview(false);
            setPreviewTemplate(null);
          }}
          onSelect={(template) => {
            setSelectedTemplate(template.id || '');
            setShowTemplatePreview(false);
            setPreviewTemplate(null);
          }}
          currentSection="7"
          currentLanguage="fr-CA"
        />
      )}
    </div>
  );
};
