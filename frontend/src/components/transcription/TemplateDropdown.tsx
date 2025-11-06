import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/select';
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
  const [templates, setTemplates] = useState<TemplateJSON[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert TemplateConfig to TemplateJSON format
  const convertTemplateConfigToJSON = (config: TemplateConfig, currentSection: string, currentLanguage: string): TemplateJSON => {
    const isFrench = (currentLanguage as string) === 'fr-CA';
    console.log(`TemplateDropdown: Converting ${config.id}, currentLanguage: ${currentLanguage}, isFrench: ${isFrench}`);
    console.log(`TemplateDropdown: English name: ${config.name}, French name: ${config.nameFr}`);
    
    // Use full template names to ensure proper differentiation
    // Add descriptive suffixes in English to differentiate similar templates
    const getDisplayName = (name: string, isFrench: boolean) => {
      let displayName = name.trim();
      
      // For English, add descriptive suffixes to differentiate templates
      if (!isFrench) {
        // If the template name is just "Section 7" or similar, add distinguishing info
        if (config.id === 'section7-ai-formatter' && displayName === 'Section 7') {
          displayName = 'Section 7 (AI Enhanced)';
        } else if (config.id === 'section7-rd' && !displayName.includes('R&D')) {
          displayName = displayName.includes('R&D') ? displayName : 'Section 7 - R&D Pipeline';
        }
      }
      
      return displayName;
    };
    
    const converted = {
      id: config.id,
      section: currentSection as "7" | "8" | "11",
      title: getDisplayName(isFrench ? config.nameFr : config.name, isFrench),
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

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
    }
  };

  // Build select items from templates
  const selectItems = templates.map(template => ({
    label: template.title,
    value: template.id || '',
  }));

  return (
    <div className={className}>
      <Select
        value={selectedTemplate?.id || ''}
        onValueChange={handleTemplateSelect}
        items={selectItems}
        placeholder={loading ? 'Loading...' : 'Select template...'}
        disabled={loading}
        className="w-full"
        buttonClassName={!selectedTemplate ? "text-sm font-bold" : ""}
      />
    </div>
  );
};
