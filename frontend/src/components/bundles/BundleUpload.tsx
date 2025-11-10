/**
 * Simple Bundle Upload Component
 * Allows users to upload template bundles with artifacts
 */

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

// Unused for now - kept for future reference
// interface ArtifactFile {
//   kind: string;
//   locale?: string;
//   file: File;
// }

interface UploadResult {
  success: boolean;
  message?: string;
  bundle?: any;
}

export const BundleUpload: React.FC = () => {
  const [bundleName, setBundleName] = useState<string>('section7-ai-formatter');
  const [version, setVersion] = useState<string>('current');
  const [setAsDefault, setSetAsDefault] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const bundleOptions = [
    { value: 'section7-ai-formatter', label: 'Section 7 AI Formatter' },
    { value: 'section7-rd', label: 'Section 7 R&D' },
    { value: 'section8-ai-formatter', label: 'Section 8 AI Formatter' },
    { value: 'section11-rd', label: 'Section 11 R&D' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setResult(null);
  };

  const getArtifactKind = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('master') && lower.includes('.md')) return 'master_prompt';
    if (lower.includes('master') && lower.includes('.json')) return 'json_config';
    if (lower.includes('golden')) return 'golden_example';
    if (lower.includes('master_config')) return 'master_config';
    if (lower.includes('system') && lower.includes('.xml')) return 'system_xml';
    if (lower.includes('plan') && lower.includes('.xml')) return 'plan_xml';
    if (lower.includes('golden_cases') || lower.includes('.jsonl')) return 'golden_cases';
    // Section 11 specific artifacts
    if (lower.includes('schema') && lower.includes('.json')) return 'schema_json';
    if (lower.includes('logicmap') && lower.includes('.yaml')) return 'logicmap_yaml';
    if (lower.includes('examples') && lower.includes('.jsonl') && lower.includes('section11')) return 'examples_jsonl';
    return 'unknown';
  };

  const getLocale = (filename: string): string | undefined => {
    const lower = filename.toLowerCase();
    if (lower.includes('_en.') || lower.includes('_en_')) return 'en';
    if (lower.includes('_fr.') || lower.includes('_fr_')) return 'fr';
    return undefined;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setResult({ success: false, message: 'Please select at least one file' });
      return;
    }

    if (!version || version.trim() === '') {
      setResult({ success: false, message: 'Please enter a version' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      // Read all files and prepare artifacts
      const artifacts: any[] = [];
      
      for (const file of files) {
        const content = await file.text();
        const kind = getArtifactKind(file.name);
        const locale = getLocale(file.name);

        if (kind === 'unknown') {
          console.warn(`Unknown artifact kind for file: ${file.name}`);
        }

        artifacts.push({
          kind,
          locale: locale || null,
          filename: file.name,
          content,
        });
      }

      // Upload to backend
      const data = await apiFetch('/api/templates/bundles/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bundleName,
          version: version.trim(),
          setAsDefault,
          artifacts,
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult({
        success: true,
        message: `Bundle uploaded successfully! ${data.bundle.artifactsCount} artifact(s) uploaded.`,
        bundle: data.bundle,
      });

      // Reset form
      setFiles([]);
      const fileInput = document.getElementById('bundle-files') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload Template Bundle</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bundle Name */}
        <div>
          <Label htmlFor="bundle-name">Bundle Name</Label>
          <Select
            id="bundle-name"
            value={bundleName}
            onValueChange={setBundleName}
            items={bundleOptions}
          />
        </div>

        {/* Version */}
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., current, 1.0.0"
          />
        </div>

        {/* Set as Default */}
        <div className="flex items-center space-x-2">
          <Switch
            id="set-default"
            checked={setAsDefault}
            onCheckedChange={setSetAsDefault}
          />
          <Label htmlFor="set-default">Set as default version</Label>
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="bundle-files">Artifact Files</Label>
          <div className="mt-2">
            <Input
              id="bundle-files"
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".md,.json,.jsonl,.xml"
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">Selected files ({files.length}):</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-400">
                        ({getArtifactKind(file.name)})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Bundle
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start space-x-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </p>
                {result.success && result.bundle && (
                  <div className="mt-2 text-xs text-green-700">
                    <p>Bundle: {result.bundle.name}</p>
                    <p>Version: {result.bundle.version}</p>
                    <p>Artifacts: {result.bundle.artifactsCount}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

