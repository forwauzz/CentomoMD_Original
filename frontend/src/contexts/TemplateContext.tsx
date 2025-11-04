import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TEMPLATE_CONFIGS, TemplateConfig } from '@/config/template-config';
import { apiJSON } from '@/lib/api';

// Template combinations can be loaded from API or static config (with fallback)

interface TemplateContextType {
  templates: TemplateConfig[];
  updateTemplate: (id: string, updates: Partial<TemplateConfig>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  addTemplate: (template: Omit<TemplateConfig, 'id' | 'created' | 'updated'>) => Promise<string>;
  refreshTemplates: () => Promise<void>;
  getTemplateById: (id: string) => TemplateConfig | undefined;
  getTemplatesBySection: (section: string) => TemplateConfig[];
  getTemplatesByMode: (mode: string) => TemplateConfig[];
  getAllTemplates: () => TemplateConfig[];
  loading: boolean;
  error: string | null;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<TemplateConfig[]>(TEMPLATE_CONFIGS.filter(template => template.isActive));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Map database TemplateCombination to frontend TemplateConfig
   * This ensures backward compatibility - frontend interface unchanged
   */
  const mapDbTemplateToConfig = (dbTemplate: any): TemplateConfig => {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name_en || dbTemplate.name,
      nameFr: dbTemplate.name_fr,
      description: dbTemplate.description_en || dbTemplate.description || '',
      descriptionFr: dbTemplate.description_fr || dbTemplate.description || '',
      type: dbTemplate.type as 'formatter' | 'ai-formatter' | 'template-combo',
      compatibleSections: dbTemplate.compatible_sections || [],
      compatibleModes: dbTemplate.compatible_modes || [],
      language: dbTemplate.language as 'fr' | 'en' | 'both',
      complexity: dbTemplate.complexity as 'low' | 'medium' | 'high',
      tags: dbTemplate.tags || [],
      isActive: dbTemplate.is_active ?? true,
      isDefault: dbTemplate.is_default ?? false,
      features: {
        verbatimSupport: dbTemplate.features?.verbatimSupport || false,
        voiceCommandsSupport: dbTemplate.features?.voiceCommandsSupport || false,
        aiFormatting: dbTemplate.features?.aiFormatting || false,
        postProcessing: dbTemplate.features?.postProcessing || false,
      },
      prompt: dbTemplate.prompt || undefined,
      promptFr: dbTemplate.prompt_fr || undefined,
      content: dbTemplate.content || undefined,
      config: dbTemplate.config || {},
      usage: {
        count: dbTemplate.usage_stats?.count || 0,
        lastUsed: dbTemplate.usage_stats?.lastUsed || undefined,
        successRate: dbTemplate.usage_stats?.successRate || 0,
      },
      created: dbTemplate.created_at
        ? new Date(dbTemplate.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      updated: dbTemplate.updated_at
        ? new Date(dbTemplate.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
  };

  // Load template combinations from API with static fallback
  const loadTemplateCombinations = async (): Promise<TemplateConfig[]> => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API first
      try {
        const apiData = await apiJSON<{ success: boolean; data: any[]; count?: number }>(
          '/api/template-combinations?active=true'
        );

        if (apiData.success && Array.isArray(apiData.data)) {
          // Map database templates to TemplateConfig format
          const mappedTemplates = apiData.data.map(mapDbTemplateToConfig);
          const activeTemplates = mappedTemplates.filter(t => t.isActive);
          console.log('✅ Loaded templates from API:', activeTemplates.length, 'active templates out of', mappedTemplates.length, 'total');
          return activeTemplates;
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        // API fetch failed - fall back to static config
        console.warn('⚠️ API fetch failed, using static config:', apiError);
        console.log('Using static TEMPLATE_CONFIGS as fallback');

        // Return static config (original behavior)
        const activeTemplates = TEMPLATE_CONFIGS.filter(template => template.isActive);
        console.log('Loading template combinations from static config:', activeTemplates.length, 'active templates out of', TEMPLATE_CONFIGS.length, 'total');
        return activeTemplates;
      }
    } catch (error) {
      console.error('Error loading template combinations:', error);
      setError('Failed to load template combinations');
      // Final fallback to static config
      return TEMPLATE_CONFIGS.filter(template => template.isActive);
    } finally {
      setLoading(false);
    }
  };

  // Refresh template combinations
  const refreshTemplates = async (): Promise<void> => {
    const loadedTemplates = await loadTemplateCombinations();
    setTemplates(loadedTemplates);
  };

  // Update a template combination (local update)
  const updateTemplate = async (id: string, updates: Partial<TemplateConfig>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Update the template in the static config
      const templateIndex = TEMPLATE_CONFIGS.findIndex(template => template.id === id);
      if (templateIndex !== -1) {
        TEMPLATE_CONFIGS[templateIndex] = { 
          ...TEMPLATE_CONFIGS[templateIndex], 
          ...updates, 
          updated: new Date().toISOString().split('T')[0] 
        };
        
        // Refresh the state
        await refreshTemplates();
        return true;
      } else {
        setError('Template not found');
        return false;
      }
    } catch (error) {
      console.error('Error updating template:', error);
      setError('Failed to update template');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a template combination (local delete)
  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Remove the template from the static config
      const templateIndex = TEMPLATE_CONFIGS.findIndex(template => template.id === id);
      if (templateIndex !== -1) {
        TEMPLATE_CONFIGS.splice(templateIndex, 1);
        
        // Refresh the state
        await refreshTemplates();
        return true;
      } else {
        setError('Template not found');
        return false;
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a new template combination (local add)
  const addTemplate = async (template: Omit<TemplateConfig, 'id' | 'created' | 'updated'>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      // Generate a new ID and add to static config
      const id = template.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newTemplate: TemplateConfig = {
        ...template,
        id,
        created: new Date().toISOString().split('T')[0],
        updated: new Date().toISOString().split('T')[0],
      };
      
      TEMPLATE_CONFIGS.push(newTemplate);
      
      // Refresh the state
      await refreshTemplates();
      return id;
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to create template');
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Get template by ID
  const getTemplateById = (id: string): TemplateConfig | undefined => {
    return templates.find(template => template.id === id);
  };

  // Get templates by section
  const getTemplatesBySection = (section: string): TemplateConfig[] => {
    const filtered = templates.filter(template => 
      template.compatibleSections.includes(section) || template.compatibleSections.includes('all')
    );
    console.log(`TemplateProvider: getTemplatesBySection('${section}') returned ${filtered.length} templates from ${templates.length} total templates`);
    return filtered;
  };

  // Get templates by mode
  const getTemplatesByMode = (mode: string): TemplateConfig[] => {
    const filtered = templates.filter(template => 
      template.compatibleModes.includes(mode) || template.compatibleModes.includes('all')
    );
    console.log(`TemplateProvider: getTemplatesByMode('${mode}') returned ${filtered.length} templates from ${templates.length} total templates`);
    return filtered;
  };

  // Get all active templates (truly modular)
  const getAllTemplates = (): TemplateConfig[] => {
    // Templates state already contains only active templates
    console.log(`TemplateProvider: getAllTemplates() returned ${templates.length} active templates`);
    return templates;
  };

  // Load templates on mount
  useEffect(() => {
    console.log('TemplateProvider: Initializing with TEMPLATE_CONFIGS:', TEMPLATE_CONFIGS.length, 'templates');
    refreshTemplates();
  }, []);

  const value: TemplateContextType = {
    templates,
    updateTemplate,
    deleteTemplate,
    addTemplate,
    refreshTemplates,
    getTemplateById,
    getTemplatesBySection,
    getTemplatesByMode,
    getAllTemplates,
    loading,
    error,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};
