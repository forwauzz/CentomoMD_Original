/**
 * Feature Flags Configuration
 * Controls which features are enabled/disabled in the application
 */

export interface FeatureFlags {
  voiceCommands: boolean;
  verbatim: boolean;
  macros: boolean;
  transcriptAnalysisPipeline: boolean;
  speakerLabeling: boolean;
}

// Default feature flags - all disabled by default for safety
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voiceCommands: false,
  verbatim: false,
  macros: false,
  transcriptAnalysisPipeline: false,
  speakerLabeling: false,
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
  };

  // For development, we can enable features for testing
  const devFlags = {
    voiceCommands: true, // Enable for development
    verbatim: true,      // Enable for development
    macros: false,       // Keep disabled until implemented
    transcriptAnalysisPipeline: true, // Enable for development and testing
    speakerLabeling: false, // Keep disabled by default
  };

  // Use environment flags if available, otherwise use dev flags
  return {
    voiceCommands: envFlags.voiceCommands || devFlags.voiceCommands,
    verbatim: envFlags.verbatim || devFlags.verbatim,
    macros: envFlags.macros || devFlags.macros,
    transcriptAnalysisPipeline: envFlags.transcriptAnalysisPipeline || devFlags.transcriptAnalysisPipeline,
    speakerLabeling: envFlags.speakerLabeling || devFlags.speakerLabeling,
  };
};

// Hook for using feature flags in components
export const useFeatureFlags = (): FeatureFlags => {
  return getFeatureFlags();
};
