export interface CaseSection {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  data: Record<string, any>;
  lastModified: string;
  audioRequired: boolean;
  dictationSessions?: string[]; // Session IDs linked to this section
}

export interface Case {
  id: string;
  patientInfo: {
    name?: string;
    dateOfBirth?: string;
    diagnosis?: string;
  };
  sections: Record<string, CaseSection>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    language: 'fr' | 'en';
    physician?: string;
  };
}

export interface DictationSession {
  id: string;
  caseId?: string;
  sectionId?: string;
  content: string;
  formattedContent?: string;
  language: 'fr' | 'en';
  createdAt: string;
  status: 'active' | 'completed' | 'failed';
}

export interface CaseContext {
  caseId: string;
  sectionId: string;
  sectionTitle: string;
  audioRequired: boolean;
}