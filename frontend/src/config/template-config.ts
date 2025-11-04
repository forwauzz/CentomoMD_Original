// Enhanced template configuration system
export interface TemplateConfig {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  type: 'formatter' | 'ai-formatter' | 'template-combo';
  compatibleSections: string[];
  compatibleModes: string[]; // NEW: Mode compatibility
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
  content?: string;
  config: {
    mode?: string;
    section?: string;
    language?: string;
    enforceWorkerFirst?: boolean;
    chronologicalOrder?: boolean;
    medicalTerminology?: boolean;
    templateCombo?: string;
    aiFormattingEnabled?: boolean;
    deterministicFirst?: boolean;
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
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'low',
    tags: ['word-for-word', 'formatter', 'post-processor'],
    isActive: false,
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
    id: 'word-for-word-with-ai',
    name: 'Word-for-Word (with AI)',
    nameFr: 'Mot-à-Mot (avec IA)',
    description: 'Deterministic word-for-word formatting with optional GPT cleanup. Preserves every spoken word exactly while converting voice commands to proper formatting.',
    descriptionFr: 'Formatage mot-à-mot déterministe avec nettoyage GPT optionnel. Préserve chaque mot prononcé exactement tout en convertissant les commandes vocales en formatage approprié.',
    type: 'ai-formatter',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'medium',
    tags: ['word-for-word', 'ai-formatter', 'deterministic', 'voice-commands'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'You are a deterministic Word-for-Word transcription formatter. Do exactly this: Preserve spoken words (no paraphrasing). Apply spoken formatting commands (punctuation/structure). Auto-capitalize only at sentence starts. Normalize dates (EN & FR) without changing meaning. Strip speaker prefixes at line starts. Never invent, remove, or reorder medical facts, names, numbers, meds, or findings. If unsure, leave text unchanged.',
    promptFr: 'Vous êtes un formateur de transcription mot-à-mot déterministe. Faites exactement ceci: Préservez les mots prononcés (pas de paraphrase). Appliquez les commandes de formatage vocal (ponctuation/structure). Capitalisez automatiquement seulement au début des phrases. Normalisez les dates (EN & FR) sans changer le sens. Supprimez les préfixes de locuteur au début des lignes. N\'inventez jamais, ne supprimez jamais ou ne réorganisez jamais les faits médicaux, noms, nombres, médicaments ou résultats. En cas de doute, laissez le texte inchangé.',
    config: {
      mode: 'word-for-word-ai',
      aiFormattingEnabled: true, // Enable AI formatting for this template
      deterministicFirst: true,
    },
    usage: {
      count: 0,
      successRate: 98,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section7-rd',
    name: 'Section 7 - R&D Pipeline',
    nameFr: 'Section 7 - Pipeline R&D',
    description: 'Section 7 - Historique de faits et évolution (R&D Pipeline with CNESST compliance checking and quality assurance)',
    descriptionFr: 'Section 7 - Historique de faits et évolution (Pipeline R&D avec vérification de conformité CNESST et assurance qualité)',
    type: 'ai-formatter',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1', 'mode2'],
    language: 'both',
    complexity: 'high',
    tags: ['section7', 'rd', 'pipeline', 'compliance', 'quality-assurance', 'cnesst'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'Section 7 R&D Pipeline with CNESST compliance checking, quality assurance, and manager review. Processes input through evaluation engine with 9 compliance rules.',
    promptFr: 'Pipeline R&D Section 7 avec vérification de conformité CNESST, assurance qualité et révision manager. Traite l\'entrée via moteur d\'évaluation avec 9 règles de conformité.',
    config: {
      mode: 'mode2',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
      aiFormattingEnabled: true,
      deterministicFirst: false
    },
    usage: {
      count: 0,
      successRate: 0,
    },
    created: '2025-10-12',
    updated: '2025-10-12',
  },
  {
    id: 'section7-ai-formatter',
    name: 'Section 7',
    nameFr: 'Formateur IA Section 7 (Amélioré)',
    description: 'Enhanced AI-powered CNESST formatting with comprehensive prompt system. 6-step flowchart implementation with language-aware file injection.',
    descriptionFr: 'Formatage IA CNESST amélioré avec système de prompts complet. Implémentation flowchart 6 étapes avec injection de fichiers adaptée à la langue.',
    type: 'ai-formatter',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'cnesst', 'enhanced', 'flowchart'],
    isActive: true,
    isDefault: true,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'Enhanced AI-powered CNESST formatting with comprehensive prompt system. 6-step flowchart: 1) Load language files, 2-4) Construct system prompt, 5) OpenAI API call, 6) Post-processing validation.',
    promptFr: 'Formatage IA CNESST amélioré avec système de prompts complet. Flowchart 6 étapes: 1) Charger fichiers langue, 2-4) Construire prompt système, 5) Appel API OpenAI, 6) Validation post-traitement.',
    config: {
      mode: 'mode2',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true
    },
    usage: {
      count: 0,
      successRate: 95,
    },
    created: '2024-12-19',
    updated: '2025-01-09',
  },
  {
    id: 'section7-v1',
    name: 'Section 7 v1',
    nameFr: 'Section 7 v1',
    description: 'Section 7 v1 - Formatting with integrated voice corrections and complete rules in master prompt',
    descriptionFr: 'Section 7 v1 - Formatage avec corrections vocales intégrées et règles complètes dans le master prompt',
    type: 'ai-formatter',
    compatibleSections: ['section_7'],
    compatibleModes: ['mode1', 'mode2'],
    language: 'both',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'cnesst', 'v1', 'voice-corrections'],
    isActive: true,
    isDefault: false,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'Section 7 v1 formatting with voice recognition error corrections and comprehensive formatting rules',
    promptFr: 'Formatage Section 7 v1 avec corrections d\'erreurs de reconnaissance vocale et règles de formatage complètes',
    config: {
      mode: 'mode2',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true
    },
    usage: {
      count: 0,
      successRate: 95,
    },
    created: '2025-11-03',
    updated: '2025-11-03',
  },
  {
    id: 'section8-ai-formatter',
    name: 'Section 8',
    nameFr: 'Formateur IA Section 8 (Amélioré)',
    description: 'Enhanced AI-powered CNESST Section 8 formatting with comprehensive prompt system. 6-step flowchart implementation for subjective questionnaire and current condition.',
    descriptionFr: 'Formatage IA CNESST Section 8 amélioré avec système de prompts complet. Implémentation flowchart 6 étapes pour questionnaire subjectif et état actuel.',
    type: 'ai-formatter',
    compatibleSections: ['section_8', 'section_7', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'high',
    tags: ['section8', 'ai-formatter', 'cnesst', 'enhanced', 'flowchart', 'subjective'],
    isActive: true,
    isDefault: true,
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'Enhanced AI-powered CNESST Section 8 formatting with comprehensive prompt system. 6-step flowchart: 1) Load language files, 2-4) Construct system prompt, 5) OpenAI API call, 6) Post-processing validation.',
    promptFr: 'Formatage IA CNESST Section 8 amélioré avec système de prompts complet. Flowchart 6 étapes: 1) Charger fichiers langue, 2-4) Construire prompt système, 5) Appel API OpenAI, 6) Validation post-traitement.',
    config: {
      mode: 'mode2',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true
    },
    usage: {
      count: 0,
      successRate: 95,
    },
    created: '2025-01-09',
    updated: '2025-01-09',
  },
  {
    id: 'section-7-only',
    name: 'Section 7 Template Only',
    nameFr: 'Template Section 7 Seulement',
    description: 'Apply Section 7 AI formatting template only. Basic AI-powered CNESST formatting without verbatim or voice command...',
    descriptionFr: 'Appliquer uniquement le template de formatage IA Section 7. Formatage IA CNESST de base sans verbatim ou commande vocale...',
    type: 'template-combo',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'medium',
    tags: ['section7', 'ai-formatter', 'template-only'],
    isActive: false,
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
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'verbatim'],
    isActive: false,
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
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'both',
    complexity: 'high',
    tags: ['section7', 'ai-formatter', 'verbatim', 'voice-commands'],
    isActive: false,
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
  {
    id: 'history-evolution-ai-formatter',
    name: 'History of Evolution AI Formatter',
    nameFr: 'Formateur IA Historique d\'Évolution',
    description: 'Apply AI-powered CNESST formatting to History of Evolution. Enforces worker-first rule, chronological order, preserves medical terminology, and ensures proper narrative structure for injury evolution tracking.',
    descriptionFr: 'Appliquer le formatage IA CNESST à l\'Historique d\'Évolution. Applique la règle travailleur-premier, maintient l\'ordre chronologique, préserve la terminologie médicale et assure une structure narrative appropriée pour le suivi de l\'évolution des lésions.',
    type: 'ai-formatter',
    compatibleSections: ['section_7', 'section_8', 'section_11', 'section_custom', 'history_evolution'],
    compatibleModes: ['mode1', 'mode2', 'mode3'],
    language: 'fr',
    complexity: 'high',
    tags: ['history-evolution', 'ai-formatter', 'cnesst', 'injury-tracking'],
    isActive: false,
    isDefault: false,
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: false,
    },
    prompt: 'Apply AI-powered CNESST formatting to History of Evolution. Enforce worker-first rule, maintain chronological order, preserve medical terminology, and ensure proper narrative structure for injury evolution tracking.',
    promptFr: 'Appliquer le formatage IA CNESST à l\'Historique d\'Évolution. Appliquer la règle travailleur-premier, maintenir l\'ordre chronologique, préserver la terminologie médicale et assurer une structure narrative appropriée pour le suivi de l\'évolution des lésions.',
    content: 'Appliquer le formatage IA CNESST à l\'Historique d\'Évolution. Applique la règle travailleur-premier, maintient l\'ordre chronologique, préserve la terminologie médicale et assure une structure narrative appropriée pour le suivi de l\'évolution des lésions.',
    config: {
      mode: 'history-evolution',
      language: 'fr',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
      medicalTerminology: true,
      aiFormattingEnabled: true,
    },
    usage: {
      count: 0,
      successRate: 92,
    },
    created: '2024-12-19',
    updated: '2024-12-19',
  },
  {
    id: 'section7-clinical-extraction',
    name: 'Section 7 + Clinical Extraction',
    nameFr: 'Section 7 + Extraction Clinique',
    description: 'AI formatting with clinical entity extraction (French-English)',
    descriptionFr: 'Formatage IA avec extraction d\'entités cliniques (Français-Anglais)',
    type: 'template-combo',
    compatibleSections: ['section_7', 'section_8'],
    compatibleModes: ['smart_dictation', 'ambient'],
    language: 'both',
    complexity: 'high',
    tags: ['clinical', 'extraction', 'ai', 'bilingual', 'template-combo'],
    isActive: false,
    isDefault: false,
    features: {
      verbatimSupport: true,
      voiceCommandsSupport: true,
      aiFormatting: true,
      postProcessing: true,
    },
    prompt: 'Extract clinical entities from medical transcript and format using AI',
    promptFr: 'Extraire les entités cliniques du transcript médical et formater avec IA',
    config: {
      templateCombo: 'template-clinical-extraction',
      aiFormattingEnabled: true,
      medicalTerminology: true,
      language: 'both',
      enforceWorkerFirst: true,
      chronologicalOrder: true,
    },
    usage: {
      count: 0,
      successRate: 0,
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
    template.compatibleSections.includes(section) || template.compatibleSections.includes('all')
  );
};

export const getTemplatesByMode = (mode: string): TemplateConfig[] => {
  return TEMPLATE_CONFIGS.filter(template => 
    template.compatibleModes.includes(mode) || template.compatibleModes.includes('all')
  );
};

export const getAllTemplates = (): TemplateConfig[] => {
  return TEMPLATE_CONFIGS.filter(template => template.isActive);
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
