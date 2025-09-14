import { LANGUAGES } from './constants';
import { useUIStore } from '@/stores/uiStore';

// Translation keys
export const translations = {
  [LANGUAGES.FR]: {
    // Navigation
    dashboard: 'Tableau de bord',
    newCase: 'Nouveau dossier',
    templates: 'Modèles',
    dictation: 'Dictée',
        voiceCommands: 'Commandes vocales',
        verbatim: 'Verbatim',
        macros: 'Macros',
        transcriptAnalysis: 'Analyse de transcription',
    settings: 'Paramètres',
    profile: 'Profil',
    
    // Dashboard
    startNewCase: 'Commencer un nouveau dossier',
    formsCompleted: 'Formulaires complétés',
    showStatistics: 'Afficher les statistiques',
    aiTranscriptions: 'Transcriptions IA',
    viewTranscriptions: 'Voir les transcriptions',
    patients: 'Patients',
    managePatients: 'Gérer les patients',
    startDictation: 'Commencer la dictée',
    
    // Dashboard descriptions
    newCaseDescription: 'Commencer un nouveau dossier CNESST avec tous les formulaires requis',
    sectionsAvailable: '15 sections disponibles',
    formsCompletedTotal: 'total',
    formsCompletedThisMonth: 'ce mois',
    formsCompletedCount: 'formulaires ce mois-ci',
    transcriptionsTotal: 'transcriptions',
    transcriptionsAccuracy: 'Précision',
    transcriptionsThisMonth: 'ce mois-ci',
    patientsTotal: 'patients',
    patientsActive: 'actifs',
    patientsNewThisMonth: 'nouveaux ce mois',
    dictationDescription: 'Commencer une session de dictée en temps réel avec transcription IA',
    dictationAvgDuration: 'Durée moy',
    dictationSessionsToday: 'aujourd\'hui',
    
    // CNESST Form
    cnesstForm204: 'Formulaire CNESST 204',
    formSections: 'Sections du formulaire',
    audioRequired: 'Dictée requise',
    exportForm: 'Exporter le formulaire',
    exportFormat: 'Format d\'export',
    bilingualExport: 'Export bilingue',
    preview: 'Aperçu',
    
    // Case sections
    sectionA: 'A. Renseignements sur le travailleur',
    sectionB: 'B. Renseignements sur le médecin',
    sectionC: 'C. Rapport',
    mandat: 'Mandat de l\'évaluation',
    diagnostics: 'Diagnostics acceptés par la CNESST',
    modalite: 'Modalité de l\'entrevue',
    section7: '7. Identification',
    section8: '8. Antécédents',
    section9: '9. Médication actuelle et mesures thérapeutiques en cours',
    section10: '10. Historique de faits et évolution',
    section11: '11. Examen physique',
    section12: '12. Imagerie et examens complémentaires',
    section13: '13. Discussion / Analyse',
    section14: '14. Conclusions',
    section15: '15. Signature et identification du médecin',
    
    // Form actions
    previous: 'Précédent',
    save: 'Enregistrer',
    saveAndContinue: 'Enregistrer et continuer',
    export: 'Exporter',
    upload: 'Téléverser',
    saved: 'Enregistré',
    ago: 'il y a',
    
    // Form content
    generalInformation: 'Informations générales',
    patientName: 'Nom du patient',
    enterPatientName: 'Entrez le nom du patient',
    dateOfBirth: 'Date de naissance',
    address: 'Adresse',
    enterAddress: 'Entrez l\'adresse du patient',
    telephone: 'Téléphone',
    enterTelephone: 'Entrez le numéro de téléphone',
    medicalCardNumber: 'Numéro de carte médicale',
    enterMedicalCardNumber: 'Entrez le numéro de carte médicale',
    initialIncidentDate: 'Date de l\'incident initial',
    enterInitialIncidentDate: 'Sélectionnez la date de l\'incident initial',
    aggravationDate: 'Date d\'aggravation',
    enterAggravationDate: 'Sélectionnez la date d\'aggravation',
    mainDiagnosis: 'Diagnostic principal',
    describeMainDiagnosis: 'Décrivez le diagnostic principal...',
    sectionContent: 'Contenu de la section',
    observationsAndNotes: 'Observations et notes',
    describeObservations: 'Décrivez les observations pour',
    additionalNotes: 'Notes additionnelles',
    additionalNotesPlaceholder: 'Notes additionnelles, commentaires...',
    
    // Physician Information
    physicianInformation: 'Informations du médecin',
    lastName: 'Nom de famille',
    enterLastName: 'Entrez le nom de famille',
    firstName: 'Prénom',
    enterFirstName: 'Entrez le prénom',
    licenseNumber: 'Numéro de licence',
    enterLicenseNumber: 'Entrez le numéro de licence',
    email: 'Courriel',
    enterEmail: 'Entrez l\'adresse courriel',
    dateOfService: 'Date de service',
    enterDateOfService: 'Sélectionnez la date de service',
    
    // Report Section
    reportSection: 'Section Rapport',
    evaluationGoal: 'L\'objectif de cette évaluation est de répondre aux questions suivantes selon la LATMP',
    evaluationDetails: 'Détails de l\'évaluation',
    enterEvaluationDetails: 'Entrez les détails de l\'évaluation...',
    
    // Report Radio Button Labels
    evaluationMandate: '1. Mandat de l\'évaluation',
    diagnosesAccepted: '2. Diagnostics acceptés par la CNESST',
    interviewModality: '3. Modalité de l\'entrevue',
    identification: '4. Identification',
    antecedents: '5. Antécédents',
    currentMedication: '6. Médication actuelle et mesures thérapeutiques en cours',
    historySection: '7. Historique',
    questionnaireCurrentState: '8. Questionnaire et état actuel',
    physicalExam: '9. Examen physique',
    factHistoryEvolution: '10. Historique de faits et évolution',
    imagingAdditionalExams: '11. Imagerie et examens complémentaires',
    discussionAnalysis: '12. Discussion / Analyse',
    conclusions: '13. Conclusions',
    physicianSignature: '14. Signature et identification du médecin',
    
    // Evaluation Mandate Section
    evaluationMandateSection: 'Section Mandat de l\'évaluation',
    mandateDetails: 'Détails du mandat',
    enterMandateDetails: 'Entrez les détails du mandat d\'évaluation...',
    
    // Dictation
    goToDictation: 'Aller à la dictée',
    goToDictationPage: 'Aller à la page de dictée',
    dictationInfo: 'La dictée pour cette section est gérée sur la page dédiée à la dictée.',
    live: 'En direct',
    history: 'Historique',
    dictationHistory: 'Historique des dictées',
    historyComingSoon: 'Historique bientôt disponible',
    historyDescription: 'Consultez vos sessions de dictée précédentes et accédez aux transcriptions sauvegardées.',
    currentSection: 'Section actuelle',
    realTimeTranscription: 'Transcription en temps réel',
    aiAccuracy: 'Précision IA de',
    
    // Settings
    general: 'Général',
    language: 'Langue',
    timezone: 'Fuseau horaire',
    clinicLogo: 'Logo de la clinique',
    compliance: 'Conformité',
    quebecLaw25: 'Loi 25 du Québec',
    pipeda: 'PIPEDA',
    zeroRetention: 'Zéro rétention',
    dictationDefaults: 'Paramètres de dictée par défaut',
    exportDefaults: 'Paramètres d\'export par défaut',
    data: 'Données',
    autosave: 'Sauvegarde automatique',
    clearCache: 'Vider le cache',
    
    // Profile
    profileSettings: 'Paramètres du profil',
    basicInformation: 'Informations de base',
    displayName: 'Nom d\'affichage',
    displayNamePlaceholder: 'Entrez votre nom d\'affichage',
    displayNameRequired: 'Le nom d\'affichage est requis',
    displayNameTooLong: 'Le nom d\'affichage doit contenir moins de 100 caractères',
    profileLanguage: 'Langue',
    languageDescription: 'Langue préférée pour l\'interface',
    englishCanada: 'Anglais (Canada)',
    frenchCanada: 'Français (Canada)',
    privacySettings: 'Paramètres de confidentialité',
    pipedaConsent: 'Consentement PIPEDA',
    pipedaDescription: 'J\'accepte le traitement de mes données selon la LPRPDE',
    marketingConsent: 'Consentement marketing',
    marketingDescription: 'J\'accepte de recevoir des communications marketing',
    saveProfile: 'Enregistrer le profil',
    profileUpdated: 'Profil mis à jour avec succès',
    profileUpdateError: 'Erreur lors de la mise à jour du profil',
    loadingProfile: 'Chargement du profil...',
    noChanges: 'Aucun changement à enregistrer',
    validationError: 'Erreur de validation',
    fixErrors: 'Veuillez corriger les erreurs avant d\'enregistrer',
    
    // Breadcrumbs
    home: 'Accueil',
    breadcrumbNewCase: 'Nouveau dossier',
    section: 'Section',
    
    // Time
    minutes: 'minutes',
    hours: 'heures',
    days: 'jours',
    justNow: 'à l\'instant',
  },
  
  [LANGUAGES.EN]: {
    // Navigation
    dashboard: 'Dashboard',
    newCase: 'New Case',
    templates: 'Templates',
    dictation: 'Dictation',
        voiceCommands: 'Voice Commands',
        verbatim: 'Verbatim',
        macros: 'Macros',
        transcriptAnalysis: 'Transcript Analysis',
    settings: 'Settings',
    profile: 'Profile',
    
    // Dashboard
    startNewCase: 'Start a new case',
    formsCompleted: 'Forms completed',
    showStatistics: 'Show statistics',
    aiTranscriptions: 'AI Transcriptions',
    viewTranscriptions: 'View transcriptions',
    patients: 'Patients',
    managePatients: 'Manage patients',
    startDictation: 'Start dictation',
    
    // Dashboard descriptions
    newCaseDescription: 'Start a new CNESST case with all required forms',
    sectionsAvailable: '15 sections available',
    formsCompletedTotal: 'total',
    formsCompletedThisMonth: 'this month',
    formsCompletedCount: 'forms this month',
    transcriptionsTotal: 'transcriptions',
    transcriptionsAccuracy: 'Accuracy',
    transcriptionsThisMonth: 'this month',
    patientsTotal: 'patients',
    patientsActive: 'active',
    patientsNewThisMonth: 'new this month',
    dictationDescription: 'Start a real-time dictation session with AI transcription',
    dictationAvgDuration: 'Avg Duration',
    dictationSessionsToday: 'today',
    
    // CNESST Form
    cnesstForm204: 'CNESST Form 204',
    formSections: 'Form sections',
    audioRequired: 'Audio required',
    exportForm: 'Export form',
    exportFormat: 'Export format',
    bilingualExport: 'Bilingual export',
    preview: 'Preview',
    
    // Case sections
    sectionA: 'A. Worker Information',
    sectionB: 'B. Physician Information',
    sectionC: 'C. Report',
    mandat: 'Evaluation Mandate',
    diagnostics: 'Diagnoses Accepted by CNESST',
    modalite: 'Interview Modality',
    section7: '7. Identification',
    section8: '8. History',
    section9: '9. Current Medication and Ongoing Therapeutic Measures',
    section10: '10. Fact History and Evolution',
    section11: '11. Physical Examination',
    section12: '12. Imaging and Additional Examinations',
    section13: '13. Discussion / Analysis',
    section14: '14. Conclusions',
    section15: '15. Physician Signature and Identification',
    
    // Form actions
    previous: 'Previous',
    save: 'Save',
    saveAndContinue: 'Save & Continue',
    export: 'Export',
    saved: 'Saved',
    ago: 'ago',
    
    // Form content
    generalInformation: 'General Information',
    patientName: 'Patient Name',
    enterPatientName: 'Enter patient name',
    dateOfBirth: 'Date of Birth',
    address: 'Address',
    enterAddress: 'Enter patient address',
    telephone: 'Telephone',
    enterTelephone: 'Enter telephone number',
    medicalCardNumber: 'Medical Card Number',
    enterMedicalCardNumber: 'Enter medical card number',
    initialIncidentDate: 'Initial Incident Date',
    enterInitialIncidentDate: 'Select initial incident date',
    aggravationDate: 'Aggravation Date',
    enterAggravationDate: 'Select aggravation date',
    mainDiagnosis: 'Main Diagnosis',
    describeMainDiagnosis: 'Describe the main diagnosis...',
    sectionContent: 'Section Content',
    observationsAndNotes: 'Observations and Notes',
    describeObservations: 'Describe observations for',
    additionalNotes: 'Additional Notes',
    additionalNotesPlaceholder: 'Additional notes, comments...',
    
    // Physician Information
    physicianInformation: 'Physician Information',
    lastName: 'Last Name',
    enterLastName: 'Enter last name',
    firstName: 'First Name',
    enterFirstName: 'Enter first name',
    licenseNumber: 'License Number',
    enterLicenseNumber: 'Enter license number',
    email: 'Email',
    enterEmail: 'Enter email address',
    dateOfService: 'Date of Service',
    enterDateOfService: 'Select date of service',
    
    // Report Section
    reportSection: 'Report Section',
    evaluationGoal: 'The goal of this evaluation is to answer the following questions according to LATMP',
    evaluationDetails: 'Evaluation Details',
    enterEvaluationDetails: 'Enter evaluation details...',
    
    // Report Radio Button Labels
    evaluationMandate: '1. Evaluation Mandate',
    diagnosesAccepted: '2. Diagnoses Accepted by CNESST',
    interviewModality: '3. Interview Modality',
    identification: '4. Identification',
    antecedents: '5. Antecedents',
    currentMedication: '6. Current Medication and Ongoing Therapeutic Measures',
    historySection: '7. History',
    questionnaireCurrentState: '8. Questionnaire and Current State',
    physicalExam: '9. Physical Exam',
    factHistoryEvolution: '10. Fact History and Evolution',
    imagingAdditionalExams: '11. Imaging and Additional Examinations',
    discussionAnalysis: '12. Discussion / Analysis',
    conclusions: '13. Conclusions',
    physicianSignature: '14. Physician Signature and Identification',
    
    // Evaluation Mandate Section
    evaluationMandateSection: 'Evaluation Mandate Section',
    mandateDetails: 'Mandate Details',
    enterMandateDetails: 'Enter evaluation mandate details...',
    
    // Dictation
    goToDictation: 'Go to Dictation',
    goToDictationPage: 'Go to Dictation page',
    dictationInfo: 'Dictation for this section is managed on the dedicated Dictation page.',
    live: 'Live',
    history: 'History',
    dictationHistory: 'Dictation History',
    historyComingSoon: 'History Coming Soon',
    historyDescription: 'View your previous dictation sessions and access saved transcriptions.',
    currentSection: 'Current Section',
    realTimeTranscription: 'Real-time transcription',
    aiAccuracy: 'AI accuracy',
    
    // Settings
    general: 'General',
    language: 'Language',
    timezone: 'Timezone',
    clinicLogo: 'Clinic logo',
    compliance: 'Compliance',
    quebecLaw25: 'Quebec Law 25',
    pipeda: 'PIPEDA',
    zeroRetention: 'Zero retention',
    dictationDefaults: 'Dictation defaults',
    exportDefaults: 'Export defaults',
    data: 'Data',
    autosave: 'Autosave',
    clearCache: 'Clear cache',
    
    // Profile
    profileSettings: 'Profile Settings',
    basicInformation: 'Basic Information',
    displayName: 'Display Name',
    displayNamePlaceholder: 'Enter your display name',
    displayNameRequired: 'Display name is required',
    displayNameTooLong: 'Display name must be less than 100 characters',
    profileLanguage: 'Language',
    languageDescription: 'Preferred language for the interface',
    englishCanada: 'English (Canada)',
    frenchCanada: 'French (Canada)',
    privacySettings: 'Privacy Settings',
    pipedaConsent: 'PIPEDA Consent',
    pipedaDescription: 'I consent to the processing of my data in accordance with the LPRPDE',
    marketingConsent: 'Marketing Consent',
    marketingDescription: 'I consent to receive marketing communications',
    saveProfile: 'Save Profile',
    profileUpdated: 'Profile updated successfully',
    profileUpdateError: 'Error updating profile',
    loadingProfile: 'Loading profile...',
    noChanges: 'No changes to save',
    validationError: 'Validation error',
    fixErrors: 'Please fix errors before saving',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    commonPreview: 'Preview',
    commonSave: 'Save',
    
    // Status
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
    
    // Time
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    justNow: 'just now',
    
    // Breadcrumbs
    home: 'Home',
    breadcrumbNewCase: 'New Case',
    section: 'Section',
  },
} as const;

export type TranslationKey = keyof typeof translations[typeof LANGUAGES.FR];

// Language sync helpers
export const dbLocaleToUi = (db: 'en-CA' | 'fr-CA'): 'en' | 'fr' => {
  return db === 'fr-CA' ? 'fr' : 'en';
};

export const uiToDbLocale = (ui: 'fr' | 'en'): 'en-CA' | 'fr-CA' => {
  return ui === 'fr' ? 'fr-CA' : 'en-CA';
};

// i18n hook
export const useI18n = () => {
  const { language } = useUIStore();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
  
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return t('justNow');
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('minutes')} ${t('ago')}`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${t('hours')} ${t('ago')}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} ${t('days')} ${t('ago')}`;
    }
  };
  
  return {
    t,
    formatTimeAgo,
    language,
  };
};
