/**
 * Feature Flags Configuration
 * Controls which features are enabled/disabled in the application
 */

import { useState } from 'react';

export interface FeatureFlags {
  voiceCommands: boolean;
  verbatim: boolean;
  macros: boolean;
  transcriptAnalysisPipeline: boolean;
  speakerLabeling: boolean;
  feedbackModule: boolean;
  feedbackServerSync: boolean;
  outputLanguageSelection: boolean;
  caseManagement: boolean;
  landingPage: boolean;
  modelSelection: boolean;
  modelSelectionTranscriptAnalysis: boolean;
  modelSelectionTemplateCombinations: boolean;
  modelSelectionDictation: boolean;
  enhancedTranscriptAnalysis: boolean;
  templateCombinationsInAnalysis: boolean;
}

// Default feature flags - all disabled by default for safety
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voiceCommands: false,
  verbatim: false,
  macros: false,
  transcriptAnalysisPipeline: false,
  speakerLabeling: false,
  feedbackModule: false,
  feedbackServerSync: false,
  outputLanguageSelection: false,
  caseManagement: false,
  landingPage: false,
  modelSelection: false,
  modelSelectionTranscriptAnalysis: false,
  modelSelectionTemplateCombinations: false,
  modelSelectionDictation: false,
  enhancedTranscriptAnalysis: false,
  templateCombinationsInAnalysis: false,
};

  // Environment-based feature flags
export const getFeatureFlags = (): FeatureFlags => {
  // In production, these would come from environment variables or a config service
  // Using Vite's import.meta.env instead of process.env for browser compatibility
  // Vite only exposes variables prefixed with VITE_ and they are always strings
  const envFlags = {
    voiceCommands: import.meta.env.VITE_FEATURE_VOICE_COMMANDS === 'true',
    verbatim: import.meta.env.VITE_FEATURE_VERBATIM === 'true',
    macros: import.meta.env.VITE_FEATURE_MACROS === 'true',
    transcriptAnalysisPipeline: import.meta.env.VITE_FEATURE_TRANSCRIPT_ANALYSIS_PIPELINE === 'true',
    speakerLabeling: import.meta.env.VITE_FEATURE_SPEAKER_LABELING === 'true',
    feedbackModule: import.meta.env.VITE_FEATURE_FEEDBACK_MODULE === 'true',
    feedbackServerSync: import.meta.env.VITE_FEATURE_FEEDBACK_SERVER_SYNC === 'true',
    outputLanguageSelection: import.meta.env.VITE_FEATURE_OUTPUT_LANGUAGE_SELECTION === 'true',
    caseManagement: import.meta.env.VITE_FEATURE_CASE_MANAGEMENT === 'true',
    landingPage: import.meta.env.VITE_FEATURE_LANDING_PAGE === 'true',
    modelSelection: import.meta.env.VITE_FEATURE_MODEL_SELECTION === 'true',
    modelSelectionTranscriptAnalysis: import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS === 'true',
    modelSelectionTemplateCombinations: import.meta.env.VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS === 'true',
    modelSelectionDictation: import.meta.env.VITE_FEATURE_MODEL_SELECTION_DICTATION === 'true',
    enhancedTranscriptAnalysis: import.meta.env.VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS === 'true',
    templateCombinationsInAnalysis: import.meta.env.VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS === 'true',
  };
  
  // For development, we can enable features for testing
  const devFlags = {
    voiceCommands: true, // Enable for development
    verbatim: true,      // Enable for development
    macros: false,       // Keep disabled until implemented
    transcriptAnalysisPipeline: true, // Enable for development and testing
    speakerLabeling: true, // Enable for development - Transcribe mode fully functional
    feedbackModule: true, // Enable for development - feedback module
    feedbackServerSync: true, // Enable for development - feedback server sync
    outputLanguageSelection: true, // Enable for development - output language selection
    caseManagement: true, // Enable for development - case management integration
    landingPage: true, // Enable for testing - landing page feature
    modelSelection: false, // Keep OFF by default; enable via env var only
    modelSelectionTranscriptAnalysis: true, // Enable for development/testing - Quick Compare feature
    modelSelectionTemplateCombinations: false, // Keep OFF by default; enable via env var only
    modelSelectionDictation: false, // Keep OFF by default; enable via env var only
    enhancedTranscriptAnalysis: false, // Keep OFF by default; enable via env var only
    templateCombinationsInAnalysis: false, // Keep OFF by default; enable via env var only
  };

  // Debug: Log env flags in development
  if (import.meta.env.DEV) {
    const rawValue = import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS;
    const evaluated = envFlags.modelSelectionTranscriptAnalysis;
    console.log('[FeatureFlags] Environment flags:', {
      modelSelectionTranscriptAnalysis: {
        raw: rawValue,
        rawType: typeof rawValue,
        evaluated: evaluated,
        evaluatedType: typeof evaluated,
        isExplicitlyTrue: rawValue === 'true',
        finalValue: envFlags.modelSelectionTranscriptAnalysis !== undefined ? envFlags.modelSelectionTranscriptAnalysis : devFlags.modelSelectionTranscriptAnalysis,
      },
    });
  }

  // Use environment flags if available, otherwise use dev flags
  // For model selection flags, prefer env flags explicitly (don't fall back to devFlags false)
  return {
    voiceCommands: envFlags.voiceCommands || devFlags.voiceCommands,
    verbatim: envFlags.verbatim || devFlags.verbatim,
    macros: envFlags.macros || devFlags.macros,
    transcriptAnalysisPipeline: envFlags.transcriptAnalysisPipeline || devFlags.transcriptAnalysisPipeline,
    speakerLabeling: envFlags.speakerLabeling || devFlags.speakerLabeling,
    feedbackModule: envFlags.feedbackModule || devFlags.feedbackModule,
    feedbackServerSync: envFlags.feedbackServerSync || devFlags.feedbackServerSync,
    outputLanguageSelection: envFlags.outputLanguageSelection || devFlags.outputLanguageSelection,
    caseManagement: envFlags.caseManagement || devFlags.caseManagement,
    landingPage: envFlags.landingPage || devFlags.landingPage,
    modelSelection: envFlags.modelSelection || devFlags.modelSelection,
    modelSelectionTranscriptAnalysis: envFlags.modelSelectionTranscriptAnalysis !== undefined ? envFlags.modelSelectionTranscriptAnalysis : devFlags.modelSelectionTranscriptAnalysis,
    modelSelectionTemplateCombinations: envFlags.modelSelectionTemplateCombinations !== undefined ? envFlags.modelSelectionTemplateCombinations : devFlags.modelSelectionTemplateCombinations,
    modelSelectionDictation: envFlags.modelSelectionDictation !== undefined ? envFlags.modelSelectionDictation : devFlags.modelSelectionDictation,
    enhancedTranscriptAnalysis: envFlags.enhancedTranscriptAnalysis !== undefined ? envFlags.enhancedTranscriptAnalysis : devFlags.enhancedTranscriptAnalysis,
    templateCombinationsInAnalysis: envFlags.templateCombinationsInAnalysis !== undefined ? envFlags.templateCombinationsInAnalysis : devFlags.templateCombinationsInAnalysis,
  };
};

// Hook for using feature flags in components
export const useFeatureFlags = (): FeatureFlags => {
  const [flags] = useState(() => getFeatureFlags());
  return flags;
};
