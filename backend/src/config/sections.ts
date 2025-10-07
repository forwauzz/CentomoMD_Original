/**
 * Independent Section Definitions
 * Sections are now decoupled from modes and templates
 */

export interface SectionConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  order: number;
  audioRequired: boolean;
  supportedModes: string[]; // Which modes can process this section
  supportedLanguages: string[]; // Which languages are supported
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    requiredFields?: string[];
    formatRules?: string[];
  };
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
  };
}

export interface SectionRegistry {
  [sectionId: string]: SectionConfig;
}

/**
 * Flexible section definitions - no hardcoded dependencies
 */
export const SECTION_REGISTRY: SectionRegistry = {
  'section_cc': {
    id: 'section_cc',
    name: 'C. Rapport',
    nameEn: 'C. Report',
    description: 'Détails de l\'évaluation',
    descriptionEn: 'Evaluation Details',
    order: 3.5,
    audioRequired: false,
    supportedModes: ['mode1', 'mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    validationRules: {
      minLength: 10,
      maxLength: 2000,
      requiredFields: ['evaluationDetails', 'diagnosesAccepted', 'interviewModality', 'name', 'age', 'evaluationDate', 'medicalHistory', 'patientName', 'dateOfBirth', 'medicationDetails', 'questionnaire', 'physicalExamDetails'],
      formatRules: ['medical_terminology']
    },
    metadata: {
      category: 'evaluation',
      tags: ['report', 'evaluation', 'details'],
      version: '1.0.0'
    }
  },
  'section_7': {
    id: 'section_7',
    name: '7. Identification',
    nameEn: '7. Identification',
    description: 'Historique de faits et évolution',
    descriptionEn: 'Fact History and Evolution',
    order: 7,
    audioRequired: true,
    supportedModes: ['mode1', 'mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    validationRules: {
      minLength: 50,
      maxLength: 5000,
      requiredFields: ['incident_description', 'medical_evolution'],
      formatRules: ['chronological_order', 'medical_terminology']
    },
    metadata: {
      category: 'medical_history',
      tags: ['narrative', 'chronological', 'medical'],
      version: '1.0.0'
    }
  },
  'section_8': {
    id: 'section_8',
    name: '8. Antécédents',
    nameEn: '8. History',
    description: 'Questionnaire subjectif',
    descriptionEn: 'Subjective Questionnaire',
    order: 8,
    audioRequired: true,
    supportedModes: ['mode1', 'mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    validationRules: {
      minLength: 30,
      maxLength: 3000,
      requiredFields: ['pain_scale', 'adl_impact'],
      formatRules: ['structured_data', 'patient_perception']
    },
    metadata: {
      category: 'subjective_assessment',
      tags: ['questionnaire', 'structured', 'patient_input'],
      version: '1.0.0'
    }
  },
  'section_11': {
    id: 'section_11',
    name: '11. Examen physique',
    nameEn: '11. Physical Examination',
    description: 'Conclusion médicale',
    descriptionEn: 'Medical Conclusion',
    order: 11,
    audioRequired: true,
    supportedModes: ['mode1', 'mode2', 'mode3'],
    supportedLanguages: ['fr', 'en'],
    validationRules: {
      minLength: 100,
      maxLength: 4000,
      requiredFields: ['physical_findings', 'clinical_assessment'],
      formatRules: ['clinical_terminology', 'objective_findings']
    },
    metadata: {
      category: 'clinical_assessment',
      tags: ['physical_exam', 'clinical', 'objective'],
      version: '1.0.0'
    }
  },
  // Example of how to add new sections without hardcoding
  'section_custom': {
    id: 'section_custom',
    name: 'Custom Section',
    nameEn: 'Custom Section',
    description: 'A custom section for testing decoupling',
    descriptionEn: 'A custom section for testing decoupling',
    order: 99,
    audioRequired: false,
    supportedModes: ['mode1', 'mode2'],
    supportedLanguages: ['fr', 'en'],
    validationRules: {
      minLength: 10,
      maxLength: 1000
    },
    metadata: {
      category: 'custom',
      tags: ['test', 'flexible'],
      version: '1.0.0'
    }
  }
};

/**
 * Section management utilities
 */
export class SectionManager {
  private sections: SectionRegistry;

  constructor(sections: SectionRegistry = SECTION_REGISTRY) {
    this.sections = sections;
  }

  /**
   * Get section configuration by ID
   */
  getSection(sectionId: string): SectionConfig | null {
    return this.sections[sectionId] || null;
  }

  /**
   * Get all sections
   */
  getAllSections(): SectionConfig[] {
    return Object.values(this.sections).sort((a, b) => a.order - b.order);
  }

  /**
   * Get sections that support a specific mode
   */
  getSectionsByMode(mode: string): SectionConfig[] {
    return Object.values(this.sections)
      .filter(section => section.supportedModes.includes(mode))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get sections that support a specific language
   */
  getSectionsByLanguage(language: string): SectionConfig[] {
    return Object.values(this.sections)
      .filter(section => section.supportedLanguages.includes(language))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Check if a section supports a specific mode
   */
  isModeSupported(sectionId: string, mode: string): boolean {
    const section = this.getSection(sectionId);
    return section ? section.supportedModes.includes(mode) : false;
  }

  /**
   * Check if a section supports a specific language
   */
  isLanguageSupported(sectionId: string, language: string): boolean {
    const section = this.getSection(sectionId);
    return section ? section.supportedLanguages.includes(language) : false;
  }

  /**
   * Validate section content against its rules
   */
  validateSectionContent(sectionId: string, content: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const section = this.getSection(sectionId);
    if (!section || !section.validationRules) {
      return { valid: true, errors: [], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const rules = section.validationRules;

    // Check length constraints
    if (rules.minLength && content.length < rules.minLength) {
      errors.push(`Content too short. Minimum ${rules.minLength} characters required.`);
    }
    if (rules.maxLength && content.length > rules.maxLength) {
      errors.push(`Content too long. Maximum ${rules.maxLength} characters allowed.`);
    }

    // Check required fields (basic implementation)
    if (rules.requiredFields) {
      for (const field of rules.requiredFields) {
        if (!content.toLowerCase().includes(field.toLowerCase())) {
          warnings.push(`Required field '${field}' not found in content.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add a new section dynamically
   */
  addSection(sectionConfig: SectionConfig): void {
    this.sections[sectionConfig.id] = sectionConfig;
  }

  /**
   * Remove a section
   */
  removeSection(sectionId: string): boolean {
    if (this.sections[sectionId]) {
      delete this.sections[sectionId];
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const sectionManager = new SectionManager();
