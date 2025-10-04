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
  
  // Universal cleanup flags
  UNIVERSAL_CLEANUP_ENABLED: (process.env['UNIVERSAL_CLEANUP_ENABLED'] ?? 'false') === 'true',
  UNIVERSAL_CLEANUP_SHADOW: (process.env['UNIVERSAL_CLEANUP_SHADOW'] ?? 'true') !== 'false',
  
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
} as const;
