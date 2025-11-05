// Backend feature flags configuration
export const FLAGS = {
  // Audio pipeline flags
  AUDIO_SR_NEGOTIATE: (process.env['AUDIO_SR_NEGOTIATE'] ?? 'true') !== 'false',
  AUDIO_V1_LEGACY_16K: (process.env['AUDIO_V1_LEGACY_16K'] ?? 'false') === 'true',
  
  // Transcribe flags
  TRANSCRIBE_STABILIZATION: process.env['TRANSCRIBE_STABILIZATION'] ?? 'high',
  TRANSCRIBE_SPEAKER_LABELS: (process.env['TRANSCRIBE_SPEAKER_LABELS'] ?? 'false') === 'true',
  
  // WebSocket debug flags
  WS_DEBUG_BINARY_LOG: (process.env['WS_DEBUG_BINARY_LOG'] ?? 'false') === 'true',
  
  // Feature flags
  FEATURE_REAL_TIME_PREVIEW: (process.env['FEATURE_REAL_TIME_PREVIEW'] ?? 'true') !== 'false',
  FEATURE_VOICE_COMMANDS: (process.env['FEATURE_VOICE_COMMANDS'] ?? 'true') !== 'false',
  FEATURE_AI_FORMATTING: (process.env['FEATURE_AI_FORMATTING'] ?? 'true') !== 'false',
  FEATURE_EXPORT: (process.env['FEATURE_EXPORT'] ?? 'true') !== 'false',
  FEATURE_AUDIT_LOGGING: (process.env['FEATURE_AUDIT_LOGGING'] ?? 'true') !== 'false',
  FEATURE_FEEDBACK_SERVER_SYNC: (process.env['FEATURE_FEEDBACK_SERVER_SYNC'] ?? 'false') === 'true',
  
  // Universal cleanup flags
  UNIVERSAL_CLEANUP_ENABLED: (process.env['UNIVERSAL_CLEANUP_ENABLED'] ?? 'false') === 'true',
  UNIVERSAL_CLEANUP_SHADOW: (process.env['UNIVERSAL_CLEANUP_SHADOW'] ?? 'false') === 'true',
  
  // Output language selection flags
  ENABLE_OUTPUT_LANGUAGE_SELECTION: (process.env['ENABLE_OUTPUT_LANGUAGE_SELECTION'] ?? 'true') === 'true',
  CNESST_SECTIONS_DEFAULT_OUTPUT: process.env['CNESST_SECTIONS_DEFAULT_OUTPUT'] ?? 'fr',
  ALLOW_NON_FRENCH_OUTPUT: (process.env['ALLOW_NON_FRENCH_OUTPUT'] ?? 'true') === 'true',
  
  // Performance and caching configuration
  SLO_P95_MS: parseInt(process.env['SLO_P95_MS'] ?? '5000', 10),
  SLO_P99_MS: parseInt(process.env['SLO_P99_MS'] ?? '8000', 10),
  CACHE_TTL_SECONDS: parseInt(process.env['CACHE_TTL_SECONDS'] ?? '604800', 10),
  
  // Debug flags
  DEBUG_MODE: (process.env['DEBUG_MODE'] ?? 'false') === 'true',
  DEBUG_LOG_LEVEL: process.env['DEBUG_LOG_LEVEL'] ?? 'info',
  DEBUG_SHOW_ERRORS: (process.env['DEBUG_SHOW_ERRORS'] ?? 'true') !== 'false',
  
  // Compliance flags
  COMPLIANCE_HIPAA_ENABLED: (process.env['COMPLIANCE_HIPAA_ENABLED'] ?? 'true') !== 'false',
  COMPLIANCE_PIPEDA_ENABLED: (process.env['COMPLIANCE_PIPEDA_ENABLED'] ?? 'true') !== 'false',
  COMPLIANCE_LAW25_ENABLED: (process.env['COMPLIANCE_LAW25_ENABLED'] ?? 'true') !== 'false',
  COMPLIANCE_ZERO_RETENTION: (process.env['COMPLIANCE_ZERO_RETENTION'] ?? 'true') !== 'false',
  COMPLIANCE_PHI_FREE_LOGGING: (process.env['COMPLIANCE_PHI_FREE_LOGGING'] ?? 'true') !== 'false',
  
  // Model selection feature flags
  FEATURE_MODEL_SELECTION: (process.env['FEATURE_MODEL_SELECTION'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS: (process.env['FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS: (process.env['FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS'] ?? 'false') === 'true',
  FEATURE_MODEL_SELECTION_DICTATION: (process.env['FEATURE_MODEL_SELECTION_DICTATION'] ?? 'false') === 'true',
  
  // Default model override flags (for switching default model without UI changes)
  USE_CLAUDE_SONNET_4_AS_DEFAULT: (process.env['USE_CLAUDE_SONNET_4_AS_DEFAULT'] ?? 'false') === 'true',
  
  // Template version selection (MVP manifest-based resolver)
  FEATURE_TEMPLATE_VERSION_SELECTION: (process.env['FEATURE_TEMPLATE_VERSION_SELECTION'] ?? 'false') === 'true',
  // Template version remote storage (Phase 1: Supabase Storage integration)
  FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE: (process.env['FEATURE_TEMPLATE_VERSION_REMOTE_STORAGE'] ?? 'false') === 'true',
  
  // Enhanced transcript analysis features
  FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS: (process.env['FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS'] ?? 'false') === 'true',
  FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS: (process.env['FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS'] ?? 'false') === 'true',
  
  // Layer processing
  FEATURE_LAYER_PROCESSING: (process.env['FEATURE_LAYER_PROCESSING'] ?? 'false') === 'true',
  
  // Model version feature flags
  FEATURE_GPT5: (process.env['FEATURE_GPT5'] ?? 'false') === 'true',
  FEATURE_CLAUDE4: (process.env['FEATURE_CLAUDE4'] ?? 'false') === 'true',
  FEATURE_GEMINI2: (process.env['FEATURE_GEMINI2'] ?? 'false') === 'true',
  FEATURE_LLAMA: (process.env['FEATURE_LLAMA'] ?? 'false') === 'true',
  FEATURE_MISTRAL: (process.env['FEATURE_MISTRAL'] ?? 'false') === 'true',
} as const;

// Experiment allowlist configuration
export const EXPERIMENT_ALLOWLIST = (process.env['EXPERIMENT_ALLOWLIST'] ?? '')
  .split(',')
  .map(email => email.trim())
  .filter(Boolean);

export function isAllowedForExperiment(userEmail?: string): boolean {
  if (!FLAGS.FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS) {
    return false;
  }
  
  // If allowlist empty, allow all (when flag enabled)
  if (EXPERIMENT_ALLOWLIST.length === 0) {
    return true;
  }
  
  return userEmail ? EXPERIMENT_ALLOWLIST.includes(userEmail) : false;
}
