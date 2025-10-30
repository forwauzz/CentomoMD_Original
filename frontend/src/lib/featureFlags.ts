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
};

// Environment-based feature flags
export const getFeatureFlags = (): FeatureFlags => {
  // In production, these would come from environment variables or a config service
  // Using Vite's import.meta.env instead of process.env for browser compatibility
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
    landingPage: false, // Keep OFF by default; enable via env var only
  };

  // Use environment flags if available, otherwise use dev flags
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
  };
};

// Hook for using feature flags in components
export const useFeatureFlags = (): FeatureFlags => {
  const [flags] = useState(() => getFeatureFlags());
  return flags;
};
