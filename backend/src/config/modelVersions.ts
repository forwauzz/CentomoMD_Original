/**
 * Model Version Configuration
 * Feature flags for different model versions and variants
 */

import { FLAGS } from './flags.js';

export interface ModelVersion {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral';
  enabled: boolean;
  featureFlag?: string;
  description?: string;
}

/**
 * Available model versions with feature flags
 */
export const MODEL_VERSIONS: Record<string, ModelVersion> = {
  // OpenAI Models
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    enabled: true, // Always enabled (default)
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    enabled: true,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    enabled: true,
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    enabled: true,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    enabled: true,
  },
  
  // Future OpenAI Models (Feature-Flagged)
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_GPT5'] === 'true'),
    featureFlag: 'FEATURE_GPT5',
    description: 'Next-generation GPT model (requires FEATURE_GPT5=true)',
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_GPT5'] === 'true'),
    featureFlag: 'FEATURE_GPT5',
    description: 'Lightweight GPT-5 variant (requires FEATURE_GPT5=true)',
  },
  'gpt-5-turbo': {
    id: 'gpt-5-turbo',
    name: 'GPT-5 Turbo',
    provider: 'openai',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_GPT5'] === 'true'),
    featureFlag: 'FEATURE_GPT5',
    description: 'Fast GPT-5 variant (requires FEATURE_GPT5=true)',
  },
  
  // Anthropic Claude Models
  'claude-3-5-sonnet': {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'claude-3-5-haiku': {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'claude-3-opus': {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  
  // Future Claude Models (Feature-Flagged)
  'claude-4-sonnet': {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_CLAUDE4'] === 'true'),
    featureFlag: 'FEATURE_CLAUDE4',
    description: 'Next-generation Claude model (requires FEATURE_CLAUDE4=true)',
  },
  'claude-4-haiku': {
    id: 'claude-4-haiku',
    name: 'Claude 4 Haiku',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_CLAUDE4'] === 'true'),
    featureFlag: 'FEATURE_CLAUDE4',
  },
  'claude-4-opus': {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_CLAUDE4'] === 'true'),
    featureFlag: 'FEATURE_CLAUDE4',
  },
  
  // Google Gemini Models
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'gemini-ultra': {
    id: 'gemini-ultra',
    name: 'Gemini Ultra',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
  },
  'gemini-2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Experimental',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
    description: 'Experimental Gemini 2.0 Flash model (latest)',
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION,
    description: 'Latest Gemini 2.5 Flash model',
  },
  
  // Future Gemini Models (Feature-Flagged)
  'gemini-2-pro': {
    id: 'gemini-2-pro',
    name: 'Gemini 2 Pro',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_GEMINI2'] === 'true'),
    featureFlag: 'FEATURE_GEMINI2',
    description: 'Next-generation Gemini model (requires FEATURE_GEMINI2=true)',
  },
  'gemini-2-ultra': {
    id: 'gemini-2-ultra',
    name: 'Gemini 2 Ultra',
    provider: 'google',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_GEMINI2'] === 'true'),
    featureFlag: 'FEATURE_GEMINI2',
  },
  
  // Meta Llama Models (Future)
  'llama-3.1-70b': {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'meta',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_LLAMA'] === 'true'),
    featureFlag: 'FEATURE_LLAMA',
    description: 'Meta Llama model (requires FEATURE_LLAMA=true and Llama API key)',
  },
  'llama-3.1-8b': {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'meta',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_LLAMA'] === 'true'),
    featureFlag: 'FEATURE_LLAMA',
  },
  
  // Mistral Models (Future)
  'mistral-large': {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_MISTRAL'] === 'true'),
    featureFlag: 'FEATURE_MISTRAL',
    description: 'Mistral AI model (requires FEATURE_MISTRAL=true)',
  },
  'mistral-medium': {
    id: 'mistral-medium',
    name: 'Mistral Medium',
    provider: 'mistral',
    enabled: FLAGS.FEATURE_MODEL_SELECTION && (process.env['FEATURE_MISTRAL'] === 'true'),
    featureFlag: 'FEATURE_MISTRAL',
  },
};

/**
 * Get enabled models for current configuration
 */
export function getEnabledModels(): ModelVersion[] {
  return Object.values(MODEL_VERSIONS).filter(model => model.enabled);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: string): ModelVersion[] {
  return Object.values(MODEL_VERSIONS)
    .filter(model => model.provider === provider && model.enabled);
}

/**
 * Check if model is enabled
 */
export function isModelEnabled(modelId: string): boolean {
  const model = MODEL_VERSIONS[modelId];
  return model ? model.enabled : false;
}

/**
 * Get model version info
 */
export function getModelVersion(modelId: string): ModelVersion | undefined {
  return MODEL_VERSIONS[modelId];
}
