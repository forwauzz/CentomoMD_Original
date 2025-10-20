import { CNESST_SECTIONS } from './constants';

// Feature flag for schema-driven forms
const ENABLE_SCHEMA_DRIVEN_FORMS = import.meta.env.VITE_ENABLE_SCHEMA_DRIVEN_FORMS === 'true';

// Debug environment variable
console.log('🔍 [FormSchema] Environment check:');
console.log('🔍 [FormSchema] import.meta.env.VITE_ENABLE_SCHEMA_DRIVEN_FORMS:', import.meta.env.VITE_ENABLE_SCHEMA_DRIVEN_FORMS);
console.log('🔍 [FormSchema] ENABLE_SCHEMA_DRIVEN_FORMS:', ENABLE_SCHEMA_DRIVEN_FORMS);
console.log('🔍 [FormSchema] All env vars:', import.meta.env);

// Types matching the real CNESST 204 form structure
export interface SectionData {
  // Section A - Worker info
  workerFileNo?: string;
  initialIncidentDate?: string;
  recurrenceDate?: string;
  
  // Section C1 - Mandate
  pointsLATMP?: string[];
  mandateNotes?: string;
  
  // Section C2 - Diagnostics
  diagnostics?: Array<{ code: string; description: string }>;
  
  // Section C3 - Interview modality
  lieu?: string;
  contexte?: string;
  duree?: string;
  modaliteText?: string;
  modaliteCommentaires?: string;
  
  // Section 4 - Identification
  age?: string;
  dominance?: string;
  emploi?: string;
  horaire?: string;
  statutTravail?: string;
  
  // Section 5 - Antecedents
  medicaux?: string;
  chirurgicaux?: string;
  auSiteEtPourtour?: string;
  accidentels?: {
    CNESST?: string;
    SAAQ?: string;
    autres?: string;
  };
  allergies?: string;
  tabac?: string;
  cannabis?: string;
  alcool?: string;
  
  // Section 6 - Medication
  medication?: string;
  mesuresTherapeutiques?: string;
  medicationCommentaires?: string;
  
  // Sections 7-8 - Dictation
  rawTranscript?: string;
  aiFormattedText?: string;
  finalText?: string;
  
  // Section 9 - Physical exam (modular)
  modules?: Array<{
    id: string;
    title: string;
    fields: Record<string, any>;
  }>;
  
  // Section 10 - Paraclinical
  contenu?: string;
  references?: string[];
  
  // Section 11 - Conclusion
  resume?: string;
  consolidation?: {
    date?: string;
    rationale?: string;
  };
  soins_traitements?: {
    appreciation?: string;
    rationale?: string;
  };
  atteinte_permanente?: {
    existence?: string;
    pourcentage?: number | null;
    rationale?: string;
  };
  limitations_fonctionnelles?: {
    existence?: string;
    evaluation?: string;
  };
  autoSummary?: string;
  manualNotes?: string;
  
  // Section 12 - APIPP
  sequelles_actuelles?: Array<{
    code: string;
    description: string;
    percent: number | null;
  }>;
  sequelles_anterieures?: Array<{
    code: string;
    description: string;
    percent: number | null;
  }>;
  autres_deficits_bilateralite?: string;
  apippNotes?: string;
  
  // Section 15 - Signature
  nom?: string;
  titre?: string;
  date?: string;
  signature?: string;
}

export interface Section {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  audioRequired: boolean;
  templateId?: string;
  formattingPipeline?: {
    inputType: string;
    outputLanguage: string;
    templateId: string;
    sourceSections?: string[];
  };
  data: SectionData;
  modules?: Array<{
    id: string;
    title: string;
    fields: Record<string, any>;
  }>;
  dictationSessions?: any[];
  lastModified: string | null;
}

export interface FormSchema {
  caseId: string;
  patientInfo: {
    name: string;
    dob: string;
    healthCard: string;
    phone: string;
    address: string;
  };
  physicianInfo: {
    lastName: string;
    firstName: string;
    license: string;
    address: string;
    phone: string;
    email: string;
  };
  meta: {
    language: string;
    createdAt: string | null;
    updatedAt: string | null;
    export: {
      status: string;
      lastExportAt: string | null;
      lastExportFormat: string | null;
    };
  };
  ui: {
    activeSectionId: string;
    order: string[];
    autosave: Record<string, any>;
  };
  sections: Record<string, Section>;
  sessions: any[];
}

// Schema loader class
export class FormSchemaLoader {
  private schema: FormSchema | null = null;
  private fallbackSections: Section[] = [];

  constructor() {
    // Initialize fallback sections from constants (existing behavior)
    this.fallbackSections = CNESST_SECTIONS.map(section => ({
      id: section.id,
      title: section.title,
      status: 'not_started' as const,
      audioRequired: section.audioRequired,
      data: this.getDefaultDataForSection(section.id),
      lastModified: null
    }));
  }

  async loadSchema(): Promise<FormSchema> {
    // Load schema with feature flag check
    
    // Check feature flag first
    if (!ENABLE_SCHEMA_DRIVEN_FORMS) {
      return this.generateFallbackSchema();
    }
    try {
      // Try to load from config file
      const response = await fetch('/cnesst_204.schema.json');
      
      if (response.ok) {
        this.schema = await response.json();
        
        if (this.validateSchema(this.schema)) {
          return this.schema!;
        } else {
          console.warn('Schema validation failed, using fallback');
          return this.generateFallbackSchema();
        }
      } else {
        console.error('Failed to fetch schema, status:', response.status);
        return this.generateFallbackSchema();
      }
    } catch (error) {
      console.error('Failed to load schema from file:', error);
      return this.generateFallbackSchema();
    }
  }

  private generateFallbackSchema(): FormSchema {
    const sections: Record<string, Section> = {};
    
    this.fallbackSections.forEach(section => {
      sections[section.id] = section;
    });

    return {
      caseId: `case_${Date.now()}`,
      patientInfo: {
        name: '',
        dob: '',
        healthCard: '',
        phone: '',
        address: ''
      },
      physicianInfo: {
        lastName: '',
        firstName: '',
        license: '',
        address: '',
        phone: '',
        email: ''
      },
      meta: {
        language: 'fr',
        createdAt: null,
        updatedAt: null,
        export: {
          status: 'not_exported',
          lastExportAt: null,
          lastExportFormat: null
        }
      },
      ui: {
        activeSectionId: this.fallbackSections[0]?.id || 'section_a',
        order: this.fallbackSections.map(s => s.id),
        autosave: {}
      },
      sections,
      sessions: []
    };
  }

  private getDefaultDataForSection(_sectionId: string): SectionData {
    // Return empty object for fallback - existing behavior
    return {};
  }

  // Public API methods
  getSectionIds(): string[] {
    if (this.schema && ENABLE_SCHEMA_DRIVEN_FORMS) {
      return this.schema.ui.order;
    }
    return this.fallbackSections.map(s => s.id);
  }

  getSectionMeta(id: string): Section | null {
    if (this.schema && ENABLE_SCHEMA_DRIVEN_FORMS && this.schema.sections[id]) {
      return this.schema.sections[id];
    }
    return this.fallbackSections.find(s => s.id === id) || null;
  }

  getSectionModules(id: string): any[] {
    if (this.schema && ENABLE_SCHEMA_DRIVEN_FORMS && this.schema.sections[id]) {
      return this.schema.sections[id].modules || [];
    }
    return [];
  }

  getSchema(): FormSchema | null {
    return this.schema;
  }

  // Validation methods
  validateSchema(schema: any): boolean {
    try {
      // Basic validation - check required fields
      if (!schema.sections || !schema.ui || !schema.ui.order) {
        console.error('❌ Invalid schema: missing required fields');
        return false;
      }
      
      // Check that all sections in order exist
      const sectionIds = Object.keys(schema.sections);
      const missingSections = schema.ui.order.filter((id: string) => !sectionIds.includes(id));
      
      if (missingSections.length > 0) {
        console.error('❌ Invalid schema: missing sections:', missingSections);
        return false;
      }
      
      console.log('✅ Schema validation passed');
      return true;
    } catch (error) {
      console.error('❌ Schema validation failed:', error);
      return false;
    }
  }

  // Check if schema-driven forms are enabled
  isSchemaDrivenEnabled(): boolean {
    return ENABLE_SCHEMA_DRIVEN_FORMS;
  }
}

// Singleton instance
export const formSchemaLoader = new FormSchemaLoader();

// Convenience functions
export const getSectionIds = (): string[] => formSchemaLoader.getSectionIds();
export const getSectionMeta = (id: string): Section | null => formSchemaLoader.getSectionMeta(id);
export const getSectionModules = (id: string): any[] => formSchemaLoader.getSectionModules(id);
export const loadSchema = (): Promise<FormSchema> => formSchemaLoader.loadSchema();
export const isSchemaDrivenEnabled = (): boolean => formSchemaLoader.isSchemaDrivenEnabled();
