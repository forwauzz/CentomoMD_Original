import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, FileText, Tag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TemplatePreview } from './TemplatePreview';
import { TemplateConfig } from '@/config/template-config';
import { useTemplates } from '@/contexts/TemplateContext';

export interface TemplateJSON {
  id?: string;
  section: "7" | "8" | "11";
  title: string;
  content: string;
  tags: string[];
  source_file: string;
  language?: "fr" | "en";
  category?: string;
  complexity?: "low" | "medium" | "high";
  status?: "active" | "draft" | "archived";
  version?: string;
  usage_count?: number;
  meta?: {
    defaultConfig?: any;
    templateConfig?: TemplateConfig;
    aiFormatter?: {
      mode?: string;
      section?: string;
      language?: string;
      enforceWorkerFirst?: boolean;
      chronologicalOrder?: boolean;
      medicalTerminology?: boolean;
      templateCombo?: string;
      verbatimSupport?: boolean;
      voiceCommandsSupport?: boolean;
    };
  };
}

interface TemplateDropdownProps {
  currentSection: string;
  currentLanguage: 'fr-CA' | 'en-US';
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
  const { getAllTemplates } = useTemplates();
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateJSON[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateJSON | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Convert TemplateConfig to TemplateJSON format
  const convertTemplateConfigToJSON = (config: TemplateConfig, currentSection: string, currentLanguage: string): TemplateJSON => {
    const isFrench = (currentLanguage as string) === 'fr-CA';
    console.log(`TemplateDropdown: Converting ${config.id}, currentLanguage: ${currentLanguage}, isFrench: ${isFrench}`);
    console.log(`TemplateDropdown: English name: ${config.name}, French name: ${config.nameFr}`);
    
    // Create cleaner template names by removing extra details
    const cleanName = (name: string) => {
      // Remove common suffixes and extra details
      return name
        .replace(/\s*\([^)]*\)/g, '') // Remove text in parentheses
        .replace(/\s*-\s*[^-]*$/g, '') // Remove text after last dash
        .replace(/\s*:\s*.*$/g, '') // Remove text after colon
        .replace(/\s*\(Amélioré\)/gi, '') // Remove "(Amélioré)" suffix
        .replace(/\s*\(Enhanced\)/gi, '') // Remove "(Enhanced)" suffix
        .replace(/\s*\(avec IA\)/gi, '') // Remove "(avec IA)" suffix
        .replace(/\s*\(with AI\)/gi, '') // Remove "(with AI)" suffix
        .replace(/\s*Pipeline R&D/gi, '') // Remove "Pipeline R&D" suffix
        .replace(/\s*R&D Pipeline/gi, '') // Remove "R&D Pipeline" suffix
        .trim();
    };
    
    const converted = {
      id: config.id,
      section: currentSection as "7" | "8" | "11",
      title: cleanName(isFrench ? config.nameFr : config.name),
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
    
    console.log('Converting template config:', config.id, 'to:', converted.id, 'category:', converted.category);
    return converted;
  };

  // Load templates (truly modular - not section-dependent)
  useEffect(() => {
    loadTemplates();
  }, [currentLanguage, getAllTemplates]);

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
      // Load ALL templates (truly modular - not section-dependent)
      const availableTemplates = getAllTemplates().filter(config => {
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
      
      console.log(`TemplateDropdown: Loaded ${convertedTemplates.length} templates (modular) with language ${currentLanguage}`);
      console.log('TemplateDropdown: Template titles:', convertedTemplates.map(t => t.title));
      setTemplates(convertedTemplates);
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
        className="w-full justify-between h-9 text-sm"
        disabled={loading}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {loading 
              ? 'Chargement...'
              : selectedTemplate 
                ? selectedTemplate.title 
                : `Sélectionner un template - ${templates.length} disponible(s)`
            }
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden shadow-lg border border-gray-200">
            <CardContent className="p-0">
            {/* Search and Filters */}
            <div className="p-3 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-sm"
                />
              </div>

              {/* Tags Filter */}
              <div className="flex flex-wrap gap-1">
                {getAvailableTags().slice(0, 6).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs px-2 py-1",
                      selectedTags.includes(tag) && "bg-blue-500 text-white"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {getAvailableTags().length > 6 && (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    +{getAvailableTags().length - 6}
                  </Badge>
                )}
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
                    className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate flex-1 min-w-0">
                        {template.title}
                      </h4>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {template.complexity && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs px-1 py-0", getComplexityColor(template.complexity))}
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
                    
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {template.content.substring(0, 80)}...
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{template.tags.length - 2}
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
                <span>Modular • {currentLanguage.toUpperCase()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
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
