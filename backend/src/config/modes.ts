/**
 * Independent Mode Definitions
 * Modes are now decoupled from sections and templates
 */

export interface ModeConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  processingType: 'realtime' | 'batch' | 'hybrid';
  supportedSections: string[]; // Which sections this mode can process
  supportedLanguages: string[]; // Which languages are supported
  capabilities: {
    voiceCommands: boolean;
    verbatimSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
    realtimeProcessing: boolean;
  };
  configuration: {
    maxProcessingTime?: number; // in seconds
    batchSize?: number;
    retryAttempts?: number;
    fallbackMode?: string;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
  };
}

export interface ModeRegistry {
  [modeId: string]: ModeConfig;
}

/**
 * Flexible mode definitions - no hardcoded dependencies
 */
export const MODE_REGISTRY: ModeRegistry = {
  'mode1': {
    id: 'mode1',
    name: 'Word-for-Word',
    nameEn: 'Word-for-Word',
    description: 'Traitement mot-à-mot avec commandes vocales',
    descriptionEn: 'Word-for-word processing with voice commands',
    processingType: 'realtime',
    supportedSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    supportedLanguages: ['fr', 'en'],
    capabilities: {
      voiceCommands: true,
      verbatimSupport: false,
      aiFormatting: false,
      postProcessing: true,
      realtimeProcessing: true
    },
    configuration: {
      maxProcessingTime: 30,
      retryAttempts: 3,
      fallbackMode: 'mode2'
    },
    metadata: {
      category: 'basic_processing',
      tags: ['realtime', 'voice_commands', 'post_processing'],
      version: '1.0.0'
    }
  },
  'mode2': {
    id: 'mode2',
    name: 'Smart Dictation',
    nameEn: 'Smart Dictation',
    description: 'Traitement IA avec formatage intelligent',
    descriptionEn: 'AI processing with intelligent formatting',
    processingType: 'hybrid',
    supportedSections: ['section_7', 'section_8', 'section_11', 'section_custom'],
    supportedLanguages: ['fr', 'en'],
    capabilities: {
      voiceCommands: true,
      verbatimSupport: true,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false
    },
    configuration: {
      maxProcessingTime: 60,
      batchSize: 1,
      retryAttempts: 2,
      fallbackMode: 'mode1'
    },
    metadata: {
      category: 'ai_processing',
      tags: ['ai', 'formatting', 'smart', 'hybrid'],
      version: '1.0.0'
    }
  },
  'mode3': {
    id: 'mode3',
    name: 'Ambient',
    nameEn: 'Ambient',
    description: 'Capture longue durée avec diarisation',
    descriptionEn: 'Long-form capture with diarization',
    processingType: 'batch',
    supportedSections: ['section_7', 'section_8', 'section_11'],
    supportedLanguages: ['fr', 'en'],
    capabilities: {
      voiceCommands: false,
      verbatimSupport: false,
      aiFormatting: true,
      postProcessing: true,
      realtimeProcessing: false
    },
    configuration: {
      maxProcessingTime: 300,
      batchSize: 10,
      retryAttempts: 1,
      fallbackMode: 'mode2'
    },
    metadata: {
      category: 'advanced_processing',
      tags: ['ambient', 'diarization', 'batch', 'long_form'],
      version: '1.0.0'
    }
  }
};

/**
 * Mode management utilities
 */
export class ModeManager {
  private modes: ModeRegistry;

  constructor(modes: ModeRegistry = MODE_REGISTRY) {
    this.modes = modes;
  }

  /**
   * Get mode configuration by ID
   */
  getMode(modeId: string): ModeConfig | null {
    return this.modes[modeId] || null;
  }

  /**
   * Get all modes
   */
  getAllModes(): ModeConfig[] {
    return Object.values(this.modes);
  }

  /**
   * Get modes that support a specific section
   */
  getModesBySection(sectionId: string): ModeConfig[] {
    return Object.values(this.modes)
      .filter(mode => mode.supportedSections.includes(sectionId));
  }

  /**
   * Get modes that support a specific language
   */
  getModesByLanguage(language: string): ModeConfig[] {
    return Object.values(this.modes)
      .filter(mode => mode.supportedLanguages.includes(language));
  }

  /**
   * Check if a mode supports a specific section
   */
  isSectionSupported(modeId: string, sectionId: string): boolean {
    const mode = this.getMode(modeId);
    return mode ? mode.supportedSections.includes(sectionId) : false;
  }

  /**
   * Check if a mode supports a specific language
   */
  isLanguageSupported(modeId: string, language: string): boolean {
    const mode = this.getMode(modeId);
    return mode ? mode.supportedLanguages.includes(language) : false;
  }

  /**
   * Check if a mode has a specific capability
   */
  hasCapability(modeId: string, capability: keyof ModeConfig['capabilities']): boolean {
    const mode = this.getMode(modeId);
    return mode ? mode.capabilities[capability] : false;
  }

  /**
   * Get compatible modes for a section and language combination
   */
  getCompatibleModes(sectionId: string, language: string): ModeConfig[] {
    return Object.values(this.modes)
      .filter(mode => 
        mode.supportedSections.includes(sectionId) && 
        mode.supportedLanguages.includes(language)
      );
  }

  /**
   * Get the best mode for a section/language combination based on capabilities
   */
  getBestMode(sectionId: string, language: string, requiredCapabilities: (keyof ModeConfig['capabilities'])[]): ModeConfig | null {
    const compatibleModes = this.getCompatibleModes(sectionId, language);
    
    // Find modes that have all required capabilities
    const suitableModes = compatibleModes.filter(mode =>
      requiredCapabilities.every(capability => mode.capabilities[capability])
    );

    if (suitableModes.length === 0) {
      return null;
    }

    // Return the first suitable mode (could be enhanced with scoring)
    return suitableModes[0] ?? null;
  }

  /**
   * Add a new mode dynamically
   */
  addMode(modeConfig: ModeConfig): void {
    this.modes[modeConfig.id] = modeConfig;
  }

  /**
   * Remove a mode
   */
  removeMode(modeId: string): boolean {
    if (this.modes[modeId]) {
      delete this.modes[modeId];
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const modeManager = new ModeManager();
