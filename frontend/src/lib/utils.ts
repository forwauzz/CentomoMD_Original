import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Audio utilities
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Date utilities
export function formatDate(date: Date | string, locale: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string, locale: 'fr' | 'en' = 'fr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePatientId(patientId: string): boolean {
  // Basic validation for patient ID (can be customized based on requirements)
  return patientId.length >= 3 && patientId.length <= 50;
}

// WebSocket utilities - Updated to support ws_token parameter
export function createWebSocketUrl(path: string, wsToken?: string): string {
  const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  let url = wsBaseUrl; // Nginx handles mapping in prod

  // Only append path in local dev (avoid double /ws in prod)
  if (path && !wsBaseUrl.includes('api.alie.app')) {
    url += path;
  }

  if (wsToken) {
    url += `?ws_token=${encodeURIComponent(wsToken)}`;
  }
  return url;
}

// Audio processing utilities
export function convertToPCM(audioData: Float32Array): Int16Array {
  const pcmData = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return pcmData;
}

// Removed createAudioChunk function - now sending raw PCM16 data directly

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inconnue s\'est produite';
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'NetworkError' || 
           error.message.includes('network') || 
           error.message.includes('connection');
  }
  return false;
}

// Localization utilities
export const translations = {
  fr: {
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    
    // Language
    language: 'Langue',
    selectLanguage: 'Sélectionner la langue',
    
    // Transcription
    startRecording: 'Démarrer l\'enregistrement',
    stopRecording: 'Arrêter l\'enregistrement',
    recording: 'Enregistrement en cours...',
    notRecording: 'Pas d\'enregistrement',
    connectionLost: 'Connexion perdue',
    reconnecting: 'Reconnexion...',
    audioLevel: 'Niveau audio',
    
    // Sections
    section7: 'Section 7 - Historique de faits et évolution',
    section8: 'Section 8 - Questionnaire subjectif',
    section11: 'Section 11 - Conclusion médicale',
    
    // Modes
    wordForWord: 'Mot à mot',
    smartDictation: 'Dictée intelligente',
    ambient: 'Ambient',
    
    // Voice commands
    voiceCommands: 'Commandes vocales',
    startTranscription: 'Démarrer transcription',
    pauseTranscription: 'Pause transcription',
    endSection: 'Fin section',
    clear: 'Effacer',
    newParagraph: 'Nouveau paragraphe',
    saveAndContinue: 'Sauvegarder et continuer',
    
    // Export
    export: 'Exporter',
    exportTranscript: 'Exporter la transcription',
    exportReport: 'Exporter le rapport',
    exportForm: 'Exporter le formulaire',
    formatDocx: 'Format DOCX',
    formatPdf: 'Format PDF',
    
    // Session
    newSession: 'Nouvelle session',
    patientId: 'ID du patient',
    consentVerified: 'Consentement vérifié',
    sessionDuration: 'Durée de la session',
    sessionStatus: 'Statut de la session',
    
    // Errors
    networkError: 'Erreur de réseau',
    audioError: 'Erreur audio',
    permissionError: 'Erreur de permission',
    unknownError: 'Erreur inconnue',
  },
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    
    // Language
    language: 'Language',
    selectLanguage: 'Select language',
    
    // Transcription
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording...',
    notRecording: 'Not Recording',
    connectionLost: 'Connection Lost',
    reconnecting: 'Reconnecting...',
    audioLevel: 'Audio Level',
    
    // Sections
    section7: 'Section 7 - History of facts and evolution',
    section8: 'Section 8 - Subjective questionnaire',
    section11: 'Section 11 - Medical conclusion',
    
    // Modes
    wordForWord: 'Word for Word',
    smartDictation: 'Smart Dictation',
    ambient: 'Ambient',
    
    // Voice commands
    voiceCommands: 'Voice Commands',
    startTranscription: 'Start transcription',
    pauseTranscription: 'Pause transcription',
    endSection: 'End section',
    clear: 'Clear',
    newParagraph: 'New paragraph',
    saveAndContinue: 'Save and continue',
    
    // Export
    export: 'Export',
    exportTranscript: 'Export transcript',
    exportReport: 'Export report',
    exportForm: 'Export form',
    formatDocx: 'DOCX format',
    formatPdf: 'PDF format',
    
    // Session
    newSession: 'New Session',
    patientId: 'Patient ID',
    consentVerified: 'Consent verified',
    sessionDuration: 'Session duration',
    sessionStatus: 'Session status',
    
    // Errors
    networkError: 'Network error',
    audioError: 'Audio error',
    permissionError: 'Permission error',
    unknownError: 'Unknown error',
  }
};

export function t(key: string, language: 'fr' | 'en' = 'fr'): string {
  return translations[language][key as keyof typeof translations.fr] || key;
}

// Performance utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Storage utilities
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// File utilities
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateFileName(section: string, format: 'docx' | 'pdf'): string {
  const date = new Date().toISOString().split('T')[0];
  return `CENTOMO_${section.toUpperCase()}_${date}.${format}`;
}
