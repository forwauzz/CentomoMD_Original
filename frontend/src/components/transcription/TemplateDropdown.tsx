import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, FileText, Tag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TemplatePreview } from './TemplatePreview';

export interface TemplateJSON {
  section: "7" | "8" | "11";
  title: string;
  content: string;
  tags: string[];
  source_file: string;
  language?: "fr" | "en";
  category?: string;
  complexity?: "low" | "medium" | "high";
}

interface TemplateDropdownProps {
  currentSection: "7" | "8" | "11";
  currentLanguage: 'fr' | 'en';
  onTemplateSelect: (template: TemplateJSON) => void;
  selectedTemplate?: TemplateJSON | null;
  className?: string;
}

export const TemplateDropdown: React.FC<TemplateDropdownProps> = ({
  currentSection,
  currentLanguage,
  onTemplateSelect,
  selectedTemplate,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateJSON[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateJSON | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load templates for current section
  useEffect(() => {
    loadTemplates();
  }, [currentSection, currentLanguage]);

  // Filter templates based on search and tags
  useEffect(() => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(template =>
        selectedTags.some(tag => template.tags.includes(tag))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedTags]);

           const loadTemplates = async () => {
           setLoading(true);
           try {
             // First try to fetch templates with language filter
             let response = await fetch(`/api/templates/${currentSection}?language=${currentLanguage}`);
             if (response.ok) {
               const data = await response.json();
                                if (data.success && data.data.length > 0) {
                   console.log(`Loaded ${data.data.length} templates for section ${currentSection} with language ${currentLanguage}`);
                   setTemplates(data.data);
                 } else {
                 // If no templates found with language filter, try without language filter
                 console.log(`No ${currentLanguage} templates found for section ${currentSection}, trying without language filter`);
                 response = await fetch(`/api/templates/${currentSection}`);
                 if (response.ok) {
                   const dataWithoutLanguage = await response.json();
                   if (dataWithoutLanguage.success) {
                     console.log(`Loaded ${dataWithoutLanguage.data.length} templates for section ${currentSection} without language filter`);
                     setTemplates(dataWithoutLanguage.data);
                   } else {
                     console.error('Failed to load templates:', dataWithoutLanguage.error);
                     setTemplates([]);
                   }
                 } else {
                   console.error('Failed to fetch templates without language filter:', response.statusText);
                   setTemplates([]);
                 }
               }
             } else {
               console.error('Failed to fetch templates:', response.statusText);
               setTemplates([]);
             }
           } catch (error) {
             console.error('Error loading templates:', error);
             setTemplates([]);
           } finally {
             setLoading(false);
           }
         };

  const handleTemplateSelect = (template: TemplateJSON) => {
    onTemplateSelect(template);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedTags([]);
  };

  const handlePreviewTemplate = (template: TemplateJSON) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
  };

  const handleSelectFromPreview = (template: TemplateJSON) => {
    onTemplateSelect(template);
    setIsPreviewOpen(false);
    setPreviewTemplate(null);
    setIsOpen(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getAvailableTags = () => {
    const allTags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Template Selection Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>
            {loading 
              ? 'Chargement...'
              : selectedTemplate 
                ? selectedTemplate.title 
                : `Sélectionner un template (Section ${currentSection}) - ${templates.length} disponible(s)`
            }
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Search and Filters */}
            <div className="p-3 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tags Filter */}
              <div className="flex flex-wrap gap-1">
                {getAvailableTags().map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs",
                      selectedTags.includes(tag) && "bg-blue-500 text-white"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Chargement des templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun template trouvé
                </div>
              ) : (
                filteredTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                        {template.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {template.complexity && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getComplexityColor(template.complexity))}
                          >
                            {template.complexity}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewTemplate(template);
                          }}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                          title="Preview template"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2 cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                      {template.content.substring(0, 100)}...
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
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
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{filteredTemplates.length} template(s) trouvé(s)</span>
                <span>Section {currentSection} • {currentLanguage.toUpperCase()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onSelect={handleSelectFromPreview}
          currentSection={currentSection}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  );
};
