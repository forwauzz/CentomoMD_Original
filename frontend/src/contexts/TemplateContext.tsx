import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TEMPLATE_CONFIGS, TemplateConfig } from '@/config/template-config';

// Template combinations are managed locally, not via backend API

interface TemplateContextType {
  templates: TemplateConfig[];
  updateTemplate: (id: string, updates: Partial<TemplateConfig>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  addTemplate: (template: Omit<TemplateConfig, 'id' | 'created' | 'updated'>) => Promise<string>;
  refreshTemplates: () => Promise<void>;
  getTemplateById: (id: string) => TemplateConfig | undefined;
  getTemplatesBySection: (section: string) => TemplateConfig[];
  loading: boolean;
  error: string | null;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<TemplateConfig[]>(TEMPLATE_CONFIGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template combinations are managed locally

  // Load template combinations (not content templates from backend)
  const loadTemplateCombinations = async (): Promise<TemplateConfig[]> => {
    try {
      setLoading(true);
      setError(null);

      // Use the 5 template combinations from static config
      // These are the template combinations, not the 66 content templates
      console.log('Loading template combinations:', TEMPLATE_CONFIGS.length, 'templates');
      return TEMPLATE_CONFIGS;
    } catch (error) {
      console.error('Error loading template combinations:', error);
      setError('Failed to load template combinations');
      return TEMPLATE_CONFIGS;
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
    return templates.filter(template => 
      template.compatibleSections.includes(section) || template.compatibleSections.includes('all')
    );
  };

  // Load templates on mount
  useEffect(() => {
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
