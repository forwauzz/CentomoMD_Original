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
    saved: 'Enregistré',
    ago: 'il y a',
    
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
    basicInfo: 'Informations de base',
    changePassword: 'Changer le mot de passe',
    
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    edit: 'Modifier',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Mettre à jour',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    preview: 'Aperçu',
    save: 'Enregistrer',
    
    // Status
    notStarted: 'Non commencé',
    inProgress: 'En cours',
    completed: 'Terminé',
    
    // Time
    minutes: 'minutes',
    hours: 'heures',
    days: 'jours',
    justNow: 'à l\'instant',
    
    // Breadcrumbs
    home: 'Accueil',
    newCase: 'Nouveau dossier',
    section: 'Section',
  },
  
  [LANGUAGES.EN]: {
    // Navigation
    dashboard: 'Dashboard',
    newCase: 'New Case',
    templates: 'Templates',
    dictation: 'Dictation',
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
    basicInfo: 'Basic information',
    changePassword: 'Change password',
    
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
    preview: 'Preview',
    save: 'Save',
    
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
    newCase: 'New Case',
    section: 'Section',
  },
} as const;

export type TranslationKey = keyof typeof translations[typeof LANGUAGES.FR];

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
