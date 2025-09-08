import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, X } from 'lucide-react';
import { TemplateJSON } from './TemplateDropdown';
import { TemplateConfig } from '@/config/template-config';
import { useTemplates } from '@/contexts/TemplateContext';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateJSON) => void;
  currentSection: string;
  currentLanguage: 'fr-CA' | 'en-US';
  isFormatting?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSection,
  currentLanguage,
  isFormatting = false
}) => {
  const { getTemplatesBySection } = useTemplates();
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);

  // Convert TemplateConfig to TemplateJSON format
  const convertTemplateConfigToJSON = (config: TemplateConfig, currentSection: string, currentLanguage: string): TemplateJSON => {
    const isFrench = (currentLanguage as string) === 'fr-CA';
    
    const converted = {
      id: config.id,
      section: currentSection as "7" | "8" | "11",
      title: isFrench ? config.nameFr : config.name,
      content: isFrench ? config.descriptionFr : config.description,
      tags: config.tags,
      source_file: `${config.id}.config.json`,
      language: currentLanguage as "fr" | "en",
      category: config.type,
      complexity: config.complexity,
      status: config.isActive ? 'active' : 'inactive',
      version: '1.0.0',
      usage_count: config.usage.count,
      last_used: config.usage.lastUsed,
      is_default: config.isDefault,
      // Add metadata for downstream processing
      meta: {
        templateConfig: config,
        aiFormatter: config.type === 'ai-formatter' ? {
          prompt: isFrench ? config.promptFr : config.prompt,
          config: config.config
        } : undefined
      }
    } as TemplateJSON;
    
    console.log('TemplateSelector - Converting template config:', config.id, 'to:', converted.id, 'category:', converted.category);
    return converted;
  };

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, currentSection, currentLanguage, getTemplatesBySection]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load templates from Template Combinations configuration using context
      const availableTemplates = getTemplatesBySection(currentSection).filter(config => {
        // Filter by language (both or specific language)
        // Convert currentLanguage (fr-CA/en-US) to template language format (fr/en)
        const templateLanguage = (currentLanguage as string) === 'fr-CA' ? 'fr' : 'en';
        if (config.language !== 'both' && config.language !== templateLanguage) {
          return false;
        }
        
        // Only show active templates
        return config.isActive;
      });

      // Convert TemplateConfig to TemplateJSON format
      const convertedTemplates = availableTemplates.map(config => 
        convertTemplateConfigToJSON(config, currentSection, currentLanguage)
      );
      
      console.log(`TemplateSelector: Loaded ${convertedTemplates.length} templates for section ${currentSection} with language ${currentLanguage}`);
      console.log('TemplateSelector: Template titles:', convertedTemplates.map(t => t.title));
      setTemplates(convertedTemplates);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: TemplateJSON) => {
    setSelectedTemplate(template);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Select Template</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading templates...</span>
            </div>
          ) : (
            <>
              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTemplate?.id === template.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium text-gray-900 mb-1">
                            {template.title}
                          </CardTitle>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                        {template.meta?.templateConfig && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Template Combo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs px-2 py-0.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Template Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Section {currentSection.replace('section_', '')}</span>
                          <span className="capitalize">{template.complexity}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No Templates Message */}
              {templates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
                  <p className="text-gray-600">
                    No templates are configured for Section {currentSection} in {currentLanguage === 'fr-CA' ? 'French' : 'English'}.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {templates.length > 0 && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={!selectedTemplate || isFormatting}
                    className="min-w-[120px]"
                  >
                    {isFormatting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Applying...
                      </>
                    ) : (
                      'Apply Template'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};