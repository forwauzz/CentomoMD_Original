/**
 * Version Selector Component
 * Allows operators to select a template version for processing
 */

import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export interface TemplateVersion {
  id: string;
  semver: string;
  status: 'stable' | 'draft' | 'deprecated';
  artifactsCount: number;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

interface VersionSelectorProps {
  templateId: string | null;
  value?: string;
  onChange?: (version: string | undefined) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  templateId,
  value,
  onChange,
  disabled = false,
  showLabel = true,
}) => {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultVersionId, setDefaultVersionId] = useState<string | null>(null);

  // Fetch versions when template changes
  useEffect(() => {
    if (!templateId) {
      setVersions([]);
      setDefaultVersionId(null);
      if (onChange) onChange(undefined);
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await apiFetch(`/api/templates/bundles/by-template/${templateId}`);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch versions');
        }
        
        setVersions(data.versions || []);
        setDefaultVersionId(data.defaultVersionId || null);
        
        // Auto-select default version if no value is set
        if (!value && data.defaultVersionId && data.versions?.length > 0) {
          const defaultVersion = data.versions.find((v: TemplateVersion) => v.id === data.defaultVersionId);
          if (defaultVersion && onChange) {
            onChange(defaultVersion.semver);
          }
        }
      } catch (err) {
        console.error('Error fetching template versions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load versions');
        setVersions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [templateId]);

  // Build select items
  const selectItems = [
    // Default option (use bundle's default)
    ...(defaultVersionId ? [{
      label: 'Default (uses bundle default)',
      value: 'default',
    }] : []),
    
    // Specific versions
    ...versions.map(version => ({
      label: `v${version.semver}${version.isDefault ? ' (default)' : ''} ${version.status === 'stable' ? '✓' : version.status === 'draft' ? '•' : '⚠'}`,
      value: version.semver,
      description: `${version.artifactsCount} artifact(s) • ${new Date(version.createdAt).toLocaleDateString()}`,
    })),
    
    // Aliases
    ...(versions.length > 0 ? [
      {
        label: 'latest → ' + versions[0]?.semver,
        value: 'latest',
      },
      ...(versions.find(v => v.status === 'stable') ? [{
        label: 'stable → ' + versions.find(v => v.status === 'stable')?.semver,
        value: 'stable',
      }] : []),
    ] : []),
  ];

  const handleChange = (newValue: string) => {
    if (newValue === 'default') {
      // Use undefined to indicate "use bundle default"
      if (onChange) onChange(undefined);
    } else {
      if (onChange) onChange(newValue);
    }
  };

  if (!templateId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {showLabel && <Label>Template Version (Optional)</Label>}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading versions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        {showLabel && <Label>Template Version (Optional)</Label>}
        <div className="text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return null; // Don't show selector if no versions available
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label>
          Template Version (Optional)
          {defaultVersionId && (
            <span className="ml-2 text-xs text-gray-500">
              Default: v{versions.find(v => v.id === defaultVersionId)?.semver || 'unknown'}
            </span>
          )}
        </Label>
      )}
      <Select
        value={value || 'default'}
        onValueChange={handleChange}
        items={selectItems}
        disabled={disabled}
      />
      {value && value !== 'default' && (
        <div className="text-xs text-gray-500">
          {(() => {
            const version = versions.find(v => v.semver === value);
            if (!version) return null;
            return (
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={
                    version.status === 'stable' ? 'bg-blue-50 text-blue-700' :
                    version.status === 'draft' ? 'bg-gray-50 text-gray-700' :
                    'bg-red-50 text-red-700'
                  }
                >
                  {version.status}
                </Badge>
                <span>{version.artifactsCount} artifact(s)</span>
                {version.isDefault && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Default
                  </Badge>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

