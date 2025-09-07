import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
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
  Zap
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

export const TranscriptAnalysisPage: React.FC = () => {
  const [originalTranscript, setOriginalTranscript] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<'quality' | 'comparison' | 'hallucination'>('quality');
  const [templateName, setTemplateName] = useState('');

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
            </div>
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
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};
