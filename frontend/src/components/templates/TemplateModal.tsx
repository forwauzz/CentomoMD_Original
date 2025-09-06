import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Save, 
  FileText, 
  // Tag, 
  Zap, 
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { TemplateJSON } from '@/components/transcription/TemplateDropdown';
import { FormattingService, FormattingOptions } from '@/services/formattingService';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: TemplateJSON) => void;
  template?: TemplateJSON | null; // null for create, TemplateJSON for edit
  mode: 'create' | 'edit';
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  template,
  mode
}) => {
  const [formData, setFormData] = useState<Partial<TemplateJSON>>({
    title: '',
    content: '',
    section: '7',
    language: 'fr',
    complexity: 'medium',
    category: 'General',
    tags: [],
    source_file: ''
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formattedContent, setFormattedContent] = useState('');
  const [formattingChanges, setFormattingChanges] = useState<string[]>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  // Initialize form data when template changes
  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        ...template,
        tags: template.tags || []
      });
    } else {
      setFormData({
        title: '',
        content: '',
        section: '7',
        language: 'fr',
        complexity: 'medium',
        category: 'General',
        tags: [],
        source_file: '',
        // version: '1.0'
      });
    }
    setErrors({});
  }, [template, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.section) {
      newErrors.section = 'Section is required';
    }

    if (!formData.language) {
      newErrors.language = 'Language is required';
    }

    if (!formData.complexity) {
      newErrors.complexity = 'Complexity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const templateData: TemplateJSON = {
        // id: template?.id || `template_${Date.now()}`,
        title: formData.title!,
        content: formData.content!,
        section: formData.section as "7" | "8" | "11",
        language: formData.language as "fr" | "en",
        complexity: formData.complexity as "low" | "medium" | "high",
        category: formData.category || 'General',
        tags: formData.tags || [],
        source_file: formData.source_file || '',
        // version: formData.version || '1.0'
      };

      await onSave(templateData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ general: 'Failed to save template' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleFormatContent = async () => {
    if (!formData.content?.trim()) return;

    setIsFormatting(true);
    try {
      const formattingOptions: FormattingOptions = {
        section: formData.section as "7" | "8" | "11",
        language: formData.language as "fr" | "en",
        complexity: formData.complexity as "low" | "medium" | "high",
        formattingLevel: 'advanced',
        includeSuggestions: true
      };

      const result = await FormattingService.formatTemplateContent(
        formData.content,
        formattingOptions
      );

      setFormattedContent(result.formatted);
      setFormattingChanges(result.changes);
      setShowPreview(true);
    } catch (error) {
      console.error('Error formatting content:', error);
      setErrors({ content: 'Failed to format content' });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleUseFormattedContent = () => {
    setFormData(prev => ({
      ...prev,
      content: formattedContent
    }));
    setShowPreview(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {mode === 'create' ? 'Create New Template' : 'Edit Template'}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {mode === 'create' ? 'Add a new CNESST report template' : 'Update template details'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title *</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter template title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Accident, Injury, Follow-up"
              />
            </div>
          </div>

          {/* Section and Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Section *</label>
              <select
                value={formData.section || '7'}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value as any }))}
                className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.section ? 'border-red-500' : ''}`}
              >
                <option value="7">Section 7 - Historique de faits et évolution</option>
                <option value="8">Section 8 - Questionnaire subjectif</option>
                <option value="11">Section 11 - Conclusion médicale</option>
              </select>
              {errors.section && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.section}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Language *</label>
              <select
                value={formData.language || 'fr'}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as any }))}
                className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.language ? 'border-red-500' : ''}`}
              >
                <option value="fr">French</option>
                <option value="en">English</option>
              </select>
              {errors.language && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.language}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Complexity *</label>
              <select
                value={formData.complexity || 'medium'}
                onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value as any }))}
                className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.complexity ? 'border-red-500' : ''}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {errors.complexity && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.complexity}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex items-center space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatContent}
                  disabled={!formData.content?.trim() || isFormatting}
                  className="flex items-center space-x-2"
                >
                  {isFormatting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  <span>{isFormatting ? 'Formatting...' : 'Format with AI'}</span>
                </Button>
                {showPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                  </Button>
                )}
              </div>
            </div>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter template content..."
              rows={8}
              className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.content ? 'border-red-500' : ''}`}
            />
            {errors.content && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.content}</span>
              </p>
            )}
          </div>

          {/* Formatting Preview */}
          {showPreview && formattedContent && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-800">AI Formatting Preview</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseFormattedContent}
                  className="bg-green-100 text-green-700 hover:bg-green-200"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Use Formatted
                </Button>
              </div>
              <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {formattedContent}
                </pre>
              </div>
              {formattingChanges.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-blue-800 mb-2">Changes Applied:</h5>
                  <ul className="space-y-1">
                    {formattingChanges.map((change, index) => (
                      <li key={index} className="text-xs text-blue-700 flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-blue-600" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.general}</span>
              </p>
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span>{isSaving ? 'Saving...' : (mode === 'create' ? 'Create Template' : 'Save Changes')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};
