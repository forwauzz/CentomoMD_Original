export interface ASRQualityMetrics {
  avgConfidence: number;
  meanLogProb: number;
  lowConfidencePercent: number;
  languageMismatch: boolean;
  diarizationAnomalies: string[];
  transcriptLength: number;
  tokenCount: number;
}

export interface ASRQualityResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  metrics: ASRQualityMetrics;
  issues: string[];
  recommendations: string[];
}

export async function assessASRQuality(
  transcript: string,
  _expectedLanguage: 'en'|'fr',
  asrMetadata?: any
): Promise<ASRQualityResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Calculate basic metrics
  const metrics: ASRQualityMetrics = {
    avgConfidence: asrMetadata?.avgConfidence || 0.8,
    meanLogProb: asrMetadata?.meanLogProb || -0.5,
    lowConfidencePercent: asrMetadata?.lowConfidencePercent || 10,
    languageMismatch: false, // TODO: implement language detection
    diarizationAnomalies: asrMetadata?.diarizationAnomalies || [],
    transcriptLength: transcript.length,
    tokenCount: transcript.split(' ').length
  };
  
  // Quality thresholds
  if (metrics.avgConfidence < 0.7) {
    issues.push('Low average confidence score');
    recommendations.push('Consider re-recording or manual review');
  }
  
  if (metrics.lowConfidencePercent > 20) {
    issues.push('High percentage of low-confidence segments');
    recommendations.push('Review unclear segments manually');
  }
  
  if (metrics.transcriptLength < 50) {
    issues.push('Very short transcript');
    recommendations.push('Ensure complete dictation captured');
  }
  
  if (metrics.tokenCount > 2000) {
    issues.push('Very long transcript');
    recommendations.push('Consider splitting into multiple sections');
  }
  
  // Determine status
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (issues.length > 2 || metrics.avgConfidence < 0.6) {
    status = 'FAIL';
  } else if (issues.length > 0) {
    status = 'WARN';
  }
  
  return { status, metrics, issues, recommendations };
}
