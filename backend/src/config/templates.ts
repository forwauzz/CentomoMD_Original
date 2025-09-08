/**
 * Independent Template Definitions
 * Templates are now decoupled from sections and modes
 */

export interface TemplateConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  type: 'content' | 'formatting' | 'processing' | 'combination';
  compatibleSections: string[]; // Which sections this template can be applied to
  compatibleModes: string[]; // Which modes this template can work with
  supportedLanguages: string[]; // Which languages are supported
  content: {
    structure: string; // Template content structure
    placeholders: string[]; // Available placeholders
    validationRules: string[]; // Content validation rules
  };
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
    realtimeProcessing: boolean;
  };
  configuration: {
    priority: number; // Processing priority
    timeout: number; // Processing timeout in seconds
    retryAttempts: number;
    fallbackTemplate?: string;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
    author?: string;
  };
}

export interface TemplateRegistry {
  [templateId: string]: TemplateConfig;
}

/**
 * Flexible template definitions - no hardcoded dependencies
 */
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  'word-for-word-formatter': {
    id: 'word-for-word-formatter',
    name: 'Word-for-Word Formatter',
    nameEn: 'Word-for-Word Formatter',
    description: 'Formateur mot-à-mot avec commandes vocales',
    descriptionEn: 'Word-for-word formatter with voice commands',
    type: 'processing',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'post-processing',
      placeholders: ['spoken_commands', 'punctuation', 'spacing'],
      validationRules: ['command_conversion', 'spacing_cleanup', 'capitalization']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: true,
      aiFormatting: false,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      priority: 1,
      timeout: 30,
      retryAttempts: 3
    },
    metadata: {
      category: 'post_processing',
      tags: ['voice_commands', 'formatting', 'realtime'],
      version: '1.0.0',
      author: 'system'
    }
  },
  'word-for-word-with-ai': {
    id: 'word-for-word-with-ai',
    name: 'Word-for-Word (with AI)',
    nameEn: 'Word-for-Word (with AI)',
    description: 'Formatage mot-à-mot déterministe avec nettoyage GPT optionnel',
    descriptionEn: 'Deterministic word-for-word formatting with optional GPT cleanup',
    type: 'formatting',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'deterministic_plus_ai',
      placeholders: ['spoken_commands', 'punctuation', 'spacing', 'ai_cleanup'],
      validationRules: ['command_conversion', 'spacing_cleanup', 'capitalization', 'ai_validation']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      priority: 2,
      timeout: 60,
      retryAttempts: 2,
      fallbackTemplate: 'word-for-word-formatter'
    },
    metadata: {
      category: 'hybrid_formatting',
      tags: ['word-for-word', 'ai-formatting', 'deterministic', 'voice-commands'],
      version: '1.0.0',
      author: 'system'
    }
  },
  'ai-formatter-basic': {
    id: 'ai-formatter-basic',
    name: 'AI Formatter Basic',
    nameEn: 'AI Formatter Basic',
    description: 'Formatage IA de base sans couches supplémentaires',
    descriptionEn: 'Basic AI formatting without additional layers',
    type: 'formatting',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'ai_processing',
      placeholders: ['medical_terminology', 'chronological_order', 'clinical_structure'],
      validationRules: ['medical_accuracy', 'chronological_consistency', 'clinical_formatting']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
      realtimeProcessing: false
    },
    configuration: {
      priority: 2,
      timeout: 60,
      retryAttempts: 2,
      fallbackTemplate: 'word-for-word-formatter'
    },
    metadata: {
      category: 'ai_formatting',
      tags: ['ai', 'formatting', 'medical', 'basic'],
      version: '1.0.0',
      author: 'system'
    }
  },
  'ai-formatter-verbatim': {
    id: 'ai-formatter-verbatim',
    name: 'AI Formatter + Verbatim',
    nameEn: 'AI Formatter + Verbatim',
    description: 'Formatage IA avec support de texte verbatim',
    descriptionEn: 'AI formatting with verbatim text support',
    type: 'combination',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'ai_processing_with_verbatim',
      placeholders: ['verbatim_markers', 'ai_content', 'protected_text'],
      validationRules: ['verbatim_preservation', 'ai_accuracy', 'content_integrity']
    },
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
      realtimeProcessing: false
    },
    configuration: {
      priority: 3,
      timeout: 90,
      retryAttempts: 2,
      fallbackTemplate: 'ai-formatter-basic'
    },
    metadata: {
      category: 'ai_formatting',
      tags: ['ai', 'formatting', 'verbatim', 'protected_content'],
      version: '1.0.0',
      author: 'system'
    }
  },
  'ai-formatter-full': {
    id: 'ai-formatter-full',
    name: 'AI Formatter + Verbatim + Voice Commands',
    nameEn: 'AI Formatter + Verbatim + Voice Commands',
    description: 'Formatage IA complet avec toutes les fonctionnalités',
    descriptionEn: 'Complete AI formatting with all features',
    type: 'combination',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'ai_processing_with_all_features',
      placeholders: ['verbatim_markers', 'voice_commands', 'ai_content', 'protected_text'],
      validationRules: ['verbatim_preservation', 'command_processing', 'ai_accuracy', 'content_integrity']
    },
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false
    },
    configuration: {
      priority: 4,
      timeout: 120,
      retryAttempts: 2,
      fallbackTemplate: 'ai-formatter-verbatim'
    },
    metadata: {
      category: 'ai_formatting',
      tags: ['ai', 'formatting', 'verbatim', 'voice_commands', 'complete'],
      version: '1.0.0',
      author: 'system'
    }
  },
  'section7-ai-formatter': {
    id: 'section7-ai-formatter',
    name: 'Section 7 AI Formatter',
    nameEn: 'Section 7 AI Formatter',
    description: 'Apply AI-powered CNESST formatting to Section 7 (Historique de faits et évolution)',
    descriptionEn: 'Apply AI-powered CNESST formatting to Section 7 (Historique de faits et évolution)',
    type: 'formatting',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'ai-cnesst-formatting',
      placeholders: ['chronological_order', 'worker_first', 'medical_terminology'],
      validationRules: ['cnesst_compliance', 'chronological_validation', 'medical_accuracy']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      priority: 3,
      timeout: 45,
      retryAttempts: 2
    },
    metadata: {
      category: 'section_specific',
      tags: ['section-7', 'cnesst', 'ai', 'medical'],
      version: '1.0.0',
      author: 'CentomoMD',
      lastModified: '2024-12-19'
    }
  },
  'section-7-only': {
    id: 'section-7-only',
    name: 'Section 7 Template Only',
    nameEn: 'Section 7 Template Only',
    description: 'Apply Section 7 AI formatting template only. Basic AI-powered CNESST formatting',
    descriptionEn: 'Apply Section 7 AI formatting template only. Basic AI-powered CNESST formatting',
    type: 'formatting',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'basic-cnesst-formatting',
      placeholders: ['basic_formatting', 'medical_terms'],
      validationRules: ['basic_validation', 'medical_terminology']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
      realtimeProcessing: true
    },
    configuration: {
      priority: 4,
      timeout: 30,
      retryAttempts: 3
    },
    metadata: {
      category: 'section_specific',
      tags: ['section-7', 'cnesst', 'basic', 'template'],
      version: '1.0.0',
      author: 'CentomoMD',
      lastModified: '2024-12-19'
    }
  },
  'section-7-verbatim': {
    id: 'section-7-verbatim',
    name: 'Section 7 Template + Verbatim',
    nameEn: 'Section 7 Template + Verbatim',
    description: 'Apply Section 7 AI formatting with verbatim text support',
    descriptionEn: 'Apply Section 7 AI formatting with verbatim text support',
    type: 'formatting',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'cnesst-formatting-verbatim',
      placeholders: ['verbatim_markers', 'basic_formatting', 'medical_terms'],
      validationRules: ['verbatim_preservation', 'basic_validation', 'medical_terminology']
    },
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      priority: 5,
      timeout: 60,
      retryAttempts: 2
    },
    metadata: {
      category: 'section_specific',
      tags: ['section-7', 'cnesst', 'verbatim', 'template'],
      version: '1.0.0',
      author: 'CentomoMD',
      lastModified: '2024-12-19'
    }
  },
  'section-7-full': {
    id: 'section-7-full',
    name: 'Section 7 Template + Verbatim + Voice Commands',
    nameEn: 'Section 7 Template + Verbatim + Voice Commands',
    description: 'Apply Section 7 AI formatting with full feature set',
    descriptionEn: 'Apply Section 7 AI formatting with full feature set',
    type: 'formatting',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'cnesst-formatting-full',
      placeholders: ['verbatim_markers', 'voice_commands', 'basic_formatting', 'medical_terms'],
      validationRules: ['verbatim_preservation', 'command_processing', 'basic_validation', 'medical_terminology']
    },
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      priority: 6,
      timeout: 90,
      retryAttempts: 2
    },
    metadata: {
      category: 'section_specific',
      tags: ['section-7', 'cnesst', 'verbatim', 'voice-commands', 'template'],
      version: '1.0.0',
      author: 'CentomoMD',
      lastModified: '2024-12-19'
    }
  }
};

/**
 * Template management utilities
 */
export class TemplateManager {
  private templates: TemplateRegistry;

  constructor(templates: TemplateRegistry = TEMPLATE_REGISTRY) {
    this.templates = templates;
  }

  /**
   * Get template configuration by ID
   */
  getTemplate(templateId: string): TemplateConfig | null {
    return this.templates[templateId] || null;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): TemplateConfig[] {
    return Object.values(this.templates);
  }

  /**
   * Get templates compatible with a specific section
   */
  getTemplatesBySection(sectionId: string): TemplateConfig[] {
    return Object.values(this.templates)
      .filter(template => template.compatibleSections.includes(sectionId))
      .sort((a, b) => a.configuration.priority - b.configuration.priority);
  }

  /**
   * Get templates compatible with a specific mode
   */
  getTemplatesByMode(modeId: string): TemplateConfig[] {
    return Object.values(this.templates)
      .filter(template => template.compatibleModes.includes(modeId))
      .sort((a, b) => a.configuration.priority - b.configuration.priority);
  }

  /**
   * Get templates compatible with a specific language
   */
  getTemplatesByLanguage(language: string): TemplateConfig[] {
    return Object.values(this.templates)
      .filter(template => template.supportedLanguages.includes(language))
      .sort((a, b) => a.configuration.priority - b.configuration.priority);
  }

  /**
   * Get templates compatible with section, mode, and language combination
   */
  getCompatibleTemplates(sectionId: string, modeId: string, language: string): TemplateConfig[] {
    return Object.values(this.templates)
      .filter(template => 
        template.compatibleSections.includes(sectionId) &&
        template.compatibleModes.includes(modeId) &&
        template.supportedLanguages.includes(language)
      )
      .sort((a, b) => a.configuration.priority - b.configuration.priority);
  }

  /**
   * Check if a template is compatible with a section
   */
  isSectionCompatible(templateId: string, sectionId: string): boolean {
    const template = this.getTemplate(templateId);
    return template ? template.compatibleSections.includes(sectionId) : false;
  }

  /**
   * Check if a template is compatible with a mode
   */
  isModeCompatible(templateId: string, modeId: string): boolean {
    const template = this.getTemplate(templateId);
    return template ? template.compatibleModes.includes(modeId) : false;
  }

  /**
   * Check if a template supports a specific language
   */
  isLanguageSupported(templateId: string, language: string): boolean {
    const template = this.getTemplate(templateId);
    return template ? template.supportedLanguages.includes(language) : false;
  }

  /**
   * Check if a template has a specific feature
   */
  hasFeature(templateId: string, feature: keyof TemplateConfig['features']): boolean {
    const template = this.getTemplate(templateId);
    return template ? template.features[feature] : false;
  }

  /**
   * Get the best template for a section/mode/language combination
   */
  getBestTemplate(sectionId: string, modeId: string, language: string, requiredFeatures: (keyof TemplateConfig['features'])[]): TemplateConfig | null {
    const compatibleTemplates = this.getCompatibleTemplates(sectionId, modeId, language);
    
    // Find templates that have all required features
    const suitableTemplates = compatibleTemplates.filter(template =>
      requiredFeatures.every(feature => template.features[feature])
    );

    if (suitableTemplates.length === 0) {
      return null;
    }

    // Return the highest priority template
    return suitableTemplates[0] ?? null;
  }

  /**
   * Add a new template dynamically
   */
  addTemplate(templateConfig: TemplateConfig): void {
    this.templates[templateConfig.id] = templateConfig;
  }

  /**
   * Remove a template
   */
  removeTemplate(templateId: string): boolean {
    if (this.templates[templateId]) {
      delete this.templates[templateId];
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();
