/**
 * Model Selector Component
 * Feature-flagged component for selecting AI models in Transcript Analysis page
 */

import React, { useState, useEffect } from 'react';
import { Select } from './select';
import { useFeatureFlags } from '@/lib/featureFlags';
import { apiFetch } from '@/lib/api';

interface Model {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral';
  enabled: boolean;
  description?: string;
}

interface ModelSelectorProps {
  value: string | null;
  onValueChange: (model: string | null) => void;
  disabled?: boolean;
  className?: string;
  showAllowlistError?: boolean;
  featureFlag?: 'transcriptAnalysis' | 'dictation' | 'both'; // Which feature flag to check
}

/**
 * ModelSelector Component
 * - Only visible when modelSelectionTranscriptAnalysis flag is enabled
 * - Checks user allowlist via backend
 * - Displays available models grouped by provider
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onValueChange,
  disabled = false,
  className = '',
  showAllowlistError = true,
  featureFlag = 'transcriptAnalysis', // Default to transcript analysis for backward compatibility
}) => {
  const flags = useFeatureFlags();
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowlistError, setAllowlistError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // Check if feature is enabled based on featureFlag prop
  const isEnabled = featureFlag === 'both' 
    ? (flags.modelSelectionTranscriptAnalysis || flags.modelSelectionDictation)
    : featureFlag === 'dictation'
    ? flags.modelSelectionDictation
    : flags.modelSelectionTranscriptAnalysis;

  // Fetch available models and check allowlist
  useEffect(() => {
    if (!isEnabled) {
      setAvailableModels([]);
      setAllowed(null);
      return;
    }

    const fetchModels = async () => {
      setLoading(true);
      setAllowlistError(null);

      try {
        // Check allowlist via backend (using a simple endpoint check)
        // For now, we'll fetch models and check allowlist in one call
        // The backend will filter models based on allowlist
        const response = await apiFetch('/api/models/available', {
          method: 'GET',
        });

        if (response.success && response.models) {
          setAvailableModels(response.models);
          setAllowed(true);
        } else if (response.error?.includes('allowlist') || response.error?.includes('403')) {
          // User not allowed
          setAllowed(false);
          setAllowlistError(
            response.error || 'You are not authorized to use model selection. Contact your administrator.'
          );
          setAvailableModels([]);
        } else {
          // Other error
          setAllowed(false);
          setAllowlistError('Failed to load available models');
          setAvailableModels([]);
        }
      } catch (error) {
        console.error('[ModelSelector] Error fetching models:', error);
        // Fallback: assume not allowed if endpoint doesn't exist yet
        // This is expected during development
        setAllowed(null);
        setAllowlistError(null);
        setAvailableModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [isEnabled]);

  // If feature is disabled, don't render
  if (!isEnabled) {
    return null;
  }

  // If checking allowlist status
  if (allowed === null && loading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span>Loading models...</span>
      </div>
    );
  }

  // If user not allowed and showAllowlistError is true
  if (allowed === false && showAllowlistError && allowlistError) {
    return (
      <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-800">
          <span className="text-sm font-medium">⚠️ Model Selection Restricted</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">{allowlistError}</p>
      </div>
    );
  }

  // If user not allowed but don't show error (silent fail)
  if (allowed === false && !showAllowlistError) {
    return null;
  }

  // If no models available
  if (availableModels.length === 0 && !loading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span>No models available</span>
      </div>
    );
  }

  // Flatten models for Select component
  // Format: "provider:model-id" for grouping, or just show provider labels
  const selectItems = availableModels.map((model) => ({
    label: `${model.name} (${model.provider})`,
    value: model.id,
  }));

  // Add default option
  const items = [
    { label: 'Default (gpt-4o-mini)', value: 'default' },
    ...selectItems,
  ];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Model
        <span className="text-xs text-gray-500 ml-2">(Experimental)</span>
      </label>
      <Select
        value={value || 'default'}
        onValueChange={(val) => {
          onValueChange(val === 'default' ? null : val);
        }}
        items={items}
        disabled={disabled || loading}
      />
      {availableModels.find((m) => m.id === value)?.description && (
        <p className="text-xs text-gray-500 mt-1">
          {availableModels.find((m) => m.id === value)?.description}
        </p>
      )}
    </div>
  );
};
