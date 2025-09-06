import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, X } from 'lucide-react';
import { TemplateJSON } from './TemplateDropdown';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: TemplateJSON) => void;
  currentSection: "7" | "8" | "11";
  currentLanguage: "fr" | "en";
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSection,
  currentLanguage
}) => {
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, currentSection, currentLanguage]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load templates from backend
      const response = await fetch(`/api/templates/${currentSection}?language=${currentLanguage}`);
      let backendTemplates: TemplateJSON[] = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          backendTemplates = data.data;
        }
      }

      // Add Word-for-Word formatter template
      const wordForWordTemplate: TemplateJSON = {
        id: 'word-for-word-formatter',
        section: currentSection,
        title: 'Word-for-Word Formatter',
        content: 'Post-process raw Word-for-Word transcription to clean medical text',
        tags: ['word-for-word', 'formatter', 'post-processor'],
        source_file: 'wordForWordTemplate.json',
        language: currentLanguage,
        category: 'formatter',
        complexity: 'low',
        status: 'active',
        version: '1.0.0',
        usage_count: 0
      };

      // Combine backend templates with Word-for-Word formatter
      setTemplates([wordForWordTemplate, ...backendTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Still show Word-for-Word formatter even if backend fails
      const wordForWordTemplate: TemplateJSON = {
        id: 'word-for-word-formatter',
        section: currentSection,
        title: 'Word-for-Word Formatter',
        content: 'Post-process raw Word-for-Word transcription to clean medical text',
        tags: ['word-for-word', 'formatter', 'post-processor'],
        source_file: 'wordForWordTemplate.json',
        language: currentLanguage,
        category: 'formatter',
        complexity: 'low',
        status: 'active',
        version: '1.0.0',
        usage_count: 0
      };
      setTemplates([wordForWordTemplate]);
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading templates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                        {template.title}
                      </h3>
                      {template.id === 'word-for-word-formatter' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Formatter
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                      {template.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Section {template.section}</span>
                      <span className="capitalize">{template.complexity || 'medium'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {templates.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">No templates are available for this section and language.</p>
            </div>
          )}
        </CardContent>
        
        {selectedTemplate && (
          <div className="border-t p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Selected: {selectedTemplate.title}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedTemplate.id === 'word-for-word-formatter' 
                    ? 'This will format your Word-for-Word transcription'
                    : 'This will be applied to your transcript'
                  }
                </p>
              </div>
              <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
                Apply Template
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
