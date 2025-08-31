// CNESST Form 204 Sections
export const CNESST_SECTIONS = [
  {
    id: 'section_a',
    title: 'A. Renseignements sur le travailleur',
    titleEn: 'A. Worker Information',
    audioRequired: false,
    order: 1,
  },
  {
    id: 'section_b',
    title: 'B. Renseignements sur le médecin',
    titleEn: 'B. Physician Information',
    audioRequired: false,
    order: 2,
  },
  {
    id: 'section_c',
    title: 'C. Rapport',
    titleEn: 'C. Report',
    audioRequired: false,
    order: 3,
  },
  {
    id: 'section_mandat',
    title: 'Mandat de l\'évaluation',
    titleEn: 'Evaluation Mandate',
    audioRequired: false,
    order: 4,
  },
  {
    id: 'section_diagnostics',
    title: 'Diagnostics acceptés par la CNESST',
    titleEn: 'Diagnoses Accepted by CNESST',
    audioRequired: false,
    order: 5,
  },
  {
    id: 'section_modalite',
    title: 'Modalité de l\'entrevue',
    titleEn: 'Interview Modality',
    audioRequired: false,
    order: 6,
  },
  {
    id: 'section_7',
    title: '7. Identification',
    titleEn: '7. Identification',
    audioRequired: true,
    order: 7,
  },
  {
    id: 'section_8',
    title: '8. Antécédents',
    titleEn: '8. History',
    audioRequired: true,
    order: 8,
  },
  {
    id: 'section_9',
    title: '9. Médication actuelle et mesures thérapeutiques en cours',
    titleEn: '9. Current Medication and Ongoing Therapeutic Measures',
    audioRequired: false,
    order: 9,
  },
  {
    id: 'section_10',
    title: '10. Historique de faits et évolution',
    titleEn: '10. Fact History and Evolution',
    audioRequired: false,
    order: 10,
  },
  {
    id: 'section_11',
    title: '11. Examen physique',
    titleEn: '11. Physical Examination',
    audioRequired: true,
    order: 11,
  },
  {
    id: 'section_12',
    title: '12. Imagerie et examens complémentaires',
    titleEn: '12. Imaging and Additional Examinations',
    audioRequired: false,
    order: 12,
  },
  {
    id: 'section_13',
    title: '13. Discussion / Analyse',
    titleEn: '13. Discussion / Analysis',
    audioRequired: false,
    order: 13,
  },
  {
    id: 'section_14',
    title: '14. Conclusions',
    titleEn: '14. Conclusions',
    audioRequired: false,
    order: 14,
  },
  {
    id: 'section_15',
    title: '15. Signature et identification du médecin',
    titleEn: '15. Physician Signature and Identification',
    audioRequired: false,
    order: 15,
  },
] as const;

// App Routes
export const ROUTES = {
  DASHBOARD: '/dashboard',
  NEW_CASE: '/case/new',
  TEMPLATES: '/templates',
  DICTATION: '/dictation',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// Sidebar Configuration
export const SIDEBAR_CONFIG = {
  EXPANDED_WIDTH: 280,
  COLLAPSED_WIDTH: 80,
  TRANSITION_DURATION: 300,
} as const;

// Dashboard Card Types
export const DASHBOARD_CARDS = {
  NEW_CASE: 'new_case',
  FORMS_COMPLETED: 'forms_completed',
  TRANSCRIPTIONS: 'transcriptions',
  PATIENTS: 'patients',
  START_DICTATION: 'start_dictation',
} as const;

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  DOCX: 'docx',
  JSON: 'json',
} as const;

// Section Status
export const SECTION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Languages
export const LANGUAGES = {
  FR: 'fr',
  EN: 'en',
} as const;

// Default values
export const DEFAULTS = {
  LANGUAGE: LANGUAGES.FR,
  SIDEBAR_COLLAPSED: false,
  TOAST_DURATION: 5000,
} as const;

// Helper function to get section title based on language
export const getSectionTitle = (section: typeof CNESST_SECTIONS[number], language: string): string => {
  return language === LANGUAGES.EN ? section.titleEn : section.title;
};
