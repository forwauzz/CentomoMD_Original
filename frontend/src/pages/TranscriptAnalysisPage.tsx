import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
// Using TemplateContext for standardized template loading
import { TemplatePreview } from '@/components/transcription/TemplatePreview';
import { useTemplates } from '@/contexts/TemplateContext';

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
  const [selectedAnalysis, setSelectedAnalysis] = useState<'quality' | 'comparison' | 'hallucination' | 'ab-test' | 'single-template'>('quality');
  const [templateName, setTemplateName] = useState('');
  
  // A/B Test state
  const [templateA, setTemplateA] = useState('');
  const [templateB, setTemplateB] = useState('');
  const [abTestResult, setAbTestResult] = useState<ABTestResult | null>(null);
  const [isRunningABTest, setIsRunningABTest] = useState(false);
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);
  
  // Direct template processing state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);
  const [templateProcessingResult, setTemplateProcessingResult] = useState<string>('');
  const [templateProcessingError, setTemplateProcessingError] = useState<string>('');
  
  // Template preview state
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  
  // Template-specific analysis state
  const [templateAnalysisResult, setTemplateAnalysisResult] = useState<TemplateAnalysisResult | null>(null);

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
  const processWithTemplate = useCallback(async (templateId: string, content: string) => {
    if (!templateId || !content.trim()) {
      throw new Error('Template ID and content are required');
    }

    console.log(`[Template Processing] Processing with template: ${templateId}`);
    
    // Call the same backend endpoint as dictation page
    const response = await apiFetch('/api/format/mode2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transcript: content,
        section: '7',
        language: detectLanguage(content),
        templateCombo: templateId,
        verbatimSupport: false,
        voiceCommandsSupport: false
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Template processing failed');
    }

    console.log(`[Template Processing] Template processing successful for: ${templateId}`);
    return response.formatted;
  }, []);

  // Process single template
  const processSingleTemplate = useCallback(async () => {
    if (!originalTranscript.trim() || !selectedTemplate) {
      alert('Please provide a raw transcript and select a template');
      return;
    }

    setIsProcessingTemplate(true);
    setTemplateProcessingError('');
    setTemplateProcessingResult('');

    try {
      console.log(`[Single Template] Processing with template: ${selectedTemplate}`);
      const result = await processWithTemplate(selectedTemplate, originalTranscript);
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transcript Analysis</h1>
          <p className="text-gray-600 mt-2">
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
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-500">AI Analysis Engine</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className="min-h-[300px] resize-none"
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
              className="min-h-[300px] resize-none"
            />
            <div className="mt-2 text-sm text-gray-500">
              {formattedTranscript.length} characters, {formattedTranscript.split(' ').length} words
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Button
                variant={selectedAnalysis === 'quality' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('quality')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Quality Analysis</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'comparison' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('comparison')}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Compare Transcripts</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'hallucination' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('hallucination')}
                className="flex items-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>Hallucination Detection</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'ab-test' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('ab-test')}
                className="flex items-center space-x-2"
              >
                <GitCompare className="h-4 w-4" />
                <span>A/B Test Templates</span>
              </Button>
              <Button
                variant={selectedAnalysis === 'single-template' ? 'default' : 'outline'}
                onClick={() => setSelectedAnalysis('single-template')}
                className="flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>Process Single Template</span>
              </Button>
            </div>
            {selectedAnalysis === 'ab-test' ? (
              <Button
                onClick={runABTest}
                disabled={isRunningABTest || !originalTranscript.trim() || !templateA || !templateB}
                className="flex items-center space-x-2"
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
                className="flex items-center space-x-2"
              >
                {isProcessingTemplate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing Template...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    <span>Process Template</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={analyzeTranscript}
                disabled={isAnalyzing || !originalTranscript.trim() || !formattedTranscript.trim()}
                className="flex items-center space-x-2"
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
                    onValueChange={setSelectedTemplate}
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
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Select a template above and click "Process Template". 
                  The system will apply the selected template to your raw transcript (just like in the dictation page) 
                  and display the formatted result below.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(comparisonResult.similarity * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Similarity</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${comparisonResult.wordCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonResult.wordCountChange >= 0 ? '+' : ''}{comparisonResult.wordCountChange}
                    </div>
                    <div className="text-sm text-gray-500">Word Count Change</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${comparisonResult.sentenceCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparisonResult.sentenceCountChange >= 0 ? '+' : ''}{comparisonResult.sentenceCountChange}
                    </div>
                    <div className="text-sm text-gray-500">Sentence Count Change</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
