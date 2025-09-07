// Enhanced template configuration system
export interface TemplateConfig {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  type: 'formatter' | 'ai-formatter' | 'template-combo';
  section: '7' | '8' | '11' | 'all';
  language: 'fr' | 'en' | 'both';
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
  isActive: boolean;
  isDefault: boolean;
  features: {
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
  };
  prompt?: string;
  promptFr?: string;
  config: {
    mode?: string;
    section?: string;
    language?: string;
    enforceWorkerFirst?: boolean;
    chronologicalOrder?: boolean;
    medicalTerminology?: boolean;
    templateCombo?: string;
  };
  usage: {
    count: number;
    lastUsed?: string;
    successRate: number;
  };
  created: string;
  updated: string;
}

export const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: 'word-for-word-formatter',
    name: 'Word-for-Word Formatter',
    nameFr: 'Formateur Mot-à-Mot',
    description: 'Convert spoken commands (EN/FR), strip Pt:/Dr: prefixes, clean spacing, and capitalize sentences. Light clinical fixes (dates, spine...',
    descriptionFr: 'Convertir les commandes vocales (EN/FR), supprimer les préfixes Pt:/Dr:, nettoyer l\'espacement et capitaliser les phrases. Corrections cliniques légères (dates, colonne...',
    type: 'formatter',
    section: '7',
    language: 'both',
    complexity: 'low',
    tags: ['word-for-word', 'formatter', 'post-processor'],
    isActive: true,
    isDefault: true,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: false,
      postProcessing: true,
    },
    prompt: 'Convert spoken commands to text, clean up formatting, and apply basic clinical corrections.',
    promptFr: 'Convertir les commandes vocales en texte, nettoyer le formatage et appliquer des corrections cliniques de base.',
    config: {
      mode: 'word-for-word',
    },
    usage: {
      count: 0,
      successRate: 95,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section7-ai-formatter',
    name: 'Section 7 AI Formatter',
    nameFr: 'Formateur IA Section 7',
    description: 'Apply AI-powered CNESST formatting to Section 7 (Historique de faits et évolution). Enforces worker-first rule, chronological...',
    descriptionFr: 'Appliquer le formatage IA CNESST à la Section 7 (Historique de faits et évolution). Applique la règle travailleur-premier, chronologique...',
    type: 'ai-formatter',
    section: '7',
    language: 'fr',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'cnesst'],
    isActive: true,
    isDefault: true,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
    },
    prompt: 'Apply AI-powered CNESST formatting to Section 7. Enforce worker-first rule, maintain chronological order, preserve medical terminology, and ensure proper narrative structure.',
    promptFr: 'Appliquer le formatage IA CNESST à la Section 7. Appliquer la règle travailleur-premier, maintenir l\'ordre chronologique, préserver la terminologie médicale et assurer une structure narrative appropriée.',
    config: {
      mode: 'mode2',
      section: '7',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
    },
    usage: {
      count: 0,
      successRate: 88,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section-7-only',
    name: 'Section 7 Template Only',
    nameFr: 'Template Section 7 Seulement',
    description: 'Apply Section 7 AI formatting template only. Basic AI-powered CNESST formatting without verbatim or voice command...',
    descriptionFr: 'Appliquer uniquement le template de formatage IA Section 7. Formatage IA CNESST de base sans verbatim ou commande vocale...',
    type: 'template-combo',
    section: '7',
    language: 'fr',
    complexity: 'medium',
    tags: ['section7', 'ai-formatter', 'template-only'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
    },
    prompt: 'Apply Section 7 AI formatting template only. Basic AI-powered CNESST formatting without additional layers.',
    promptFr: 'Appliquer uniquement le template de formatage IA Section 7. Formatage IA CNESST de base sans couches supplémentaires.',
    config: {
      mode: 'mode2',
      section: '7',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
      templateCombo: 'template-only',
    },
    usage: {
      count: 0,
      successRate: 90,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section-7-verbatim',
    name: 'Section 7 Template + Verbatim',
    nameFr: 'Template Section 7 + Verbatim',
    description: 'Apply Section 7 AI formatting with verbatim text support. Preserves exact quotes and specific text while applying AI formatting t...',
    descriptionFr: 'Appliquer le formatage IA Section 7 avec support de texte verbatim. Préserve les citations exactes et le texte spécifique tout en appliquant le formatage IA...',
    type: 'template-combo',
    section: '7',
    language: 'fr',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'verbatim'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: false,
    },
    prompt: 'Apply Section 7 AI formatting with verbatim text support. Preserve exact quotes and specific text while applying AI formatting to the rest.',
    promptFr: 'Appliquer le formatage IA Section 7 avec support de texte verbatim. Préserver les citations exactes et le texte spécifique tout en appliquant le formatage IA au reste.',
    config: {
      mode: 'mode2',
      section: '7',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
      templateCombo: 'template-verbatim',
    },
    usage: {
      count: 0,
      successRate: 85,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section-7-full',
    name: 'Section 7 Template + Verbatim + Voice Commands',
    nameFr: 'Template Section 7 + Verbatim + Commandes Vocales',
    description: 'Apply Section 7 AI formatting with full feature set. Includes verbatim text support and voice command processing for...',
    descriptionFr: 'Appliquer le formatage IA Section 7 avec l\'ensemble complet de fonctionnalités. Inclut le support de texte verbatim et le traitement des commandes vocales pour...',
    type: 'template-combo',
    section: '7',
    language: 'fr',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'verbatim', 'voice-commands'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: false,
    },
    prompt: 'Apply Section 7 AI formatting with full feature set. Includes verbatim text support and voice command processing for comprehensive medical dictation.',
    promptFr: 'Appliquer le formatage IA Section 7 avec l\'ensemble complet de fonctionnalités. Inclut le support de texte verbatim et le traitement des commandes vocales pour la dictée médicale complète.',
    config: {
      mode: 'mode2',
      section: '7',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
      templateCombo: 'template-full',
    },
    usage: {
      count: 0,
      successRate: 82,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
];

// Helper functions
export const getTemplateConfig = (id: string): TemplateConfig | undefined => {
  return TEMPLATE_CONFIGS.find(template => template.id === id);
};

export const getTemplatesBySection = (section: string): TemplateConfig[] => {
  return TEMPLATE_CONFIGS.filter(template => 
    template.section === section || template.section === 'all'
  );
};

export const getActiveTemplates = (): TemplateConfig[] => {
  return TEMPLATE_CONFIGS.filter(template => template.isActive);
};

export const getDefaultTemplates = (): TemplateConfig[] => {
  return TEMPLATE_CONFIGS.filter(template => template.isDefault);
};

export const updateTemplateConfig = (id: string, updates: Partial<TemplateConfig>): boolean => {
  const index = TEMPLATE_CONFIGS.findIndex(template => template.id === id);
  if (index !== -1) {
    TEMPLATE_CONFIGS[index] = { ...TEMPLATE_CONFIGS[index], ...updates, updated: new Date().toISOString().split('T')[0] };
    return true;
  }
  return false;
};

export const addTemplateConfig = (template: Omit<TemplateConfig, 'id' | 'created' | 'updated'>): string => {
  const id = template.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const newTemplate: TemplateConfig = {
    ...template,
    id,
    created: new Date().toISOString().split('T')[0],
    updated: new Date().toISOString().split('T')[0],
  };
  TEMPLATE_CONFIGS.push(newTemplate);
  return id;
};

export const deleteTemplateConfig = (id: string): boolean => {
  const index = TEMPLATE_CONFIGS.findIndex(template => template.id === id);
  if (index !== -1) {
    TEMPLATE_CONFIGS.splice(index, 1);
    return true;
  }
  return false;
};
