/**
 * Feedback Module Types
 * Self-contained types for the dev-only feedback module
 */

export type FeedbackRating = 'good' | 'meh' | 'bad';

export interface Highlight {
  id: string;
  source: 'raw' | 'templated' | 'final';
  start_line?: number;
  end_line?: number;
  note?: string;
}

export interface FeedbackItem {
  id: string;
  created_at: string; // ISO string
  meta: {
    language: 'fr-CA' | 'en-CA';
    mode: 'smart' | 'word-for-word' | 'ambient';
    template_name?: string;
    diarization: boolean;
    custom_vocab: boolean;
    timestamp: string; // ISO string
    browser?: {
      structured?: {
        brands: Array<{ brand: string; version: string }>;
        platform: string;
        mobile: boolean;
        uaFullVersion?: string;
      };
      raw?: string;
    };
    contains_phi: boolean;
  };
  ratings: {
    dictation?: FeedbackRating;
    transcription?: FeedbackRating;
    hallucination?: FeedbackRating;
    context?: FeedbackRating;
    structure?: FeedbackRating;
    overall?: FeedbackRating;
  };
  artifacts: {
    raw_text?: string;
    raw_file_ref?: string;
    templated_text?: string;
    templated_file_ref?: string;
    final_text?: string;
    final_file_ref?: string;
    template_name?: string;
  };
  highlights: Highlight[];
  comment?: string;
  attachments: string[]; // blob keys
  status: 'open' | 'triaged' | 'resolved';
  ttl_days?: number; // default 30
  // Sync-related fields
  syncStatus?: 'pending' | 'synced' | 'failed';
  serverId?: string; // Server-assigned ID after sync
  lastSyncAttempt?: string; // ISO string
  syncError?: string;
}

export interface FeedbackFilters {
  mode?: string;
  template?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface FeedbackStoreState {
  items: FeedbackItem[];
  filters: FeedbackFilters;
  flagEnabled: boolean;
  isLoading: boolean;
  error?: string;
  // Sync-related state
  syncStatus: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: string | null;
    pendingItems: number;
    failedItems: number;
    error: string | null;
  };
}

export interface FeedbackStoreActions {
  init: (flagEnabled: boolean) => Promise<void>;
  addItem: (item: Omit<FeedbackItem, 'id' | 'created_at'>, blobs?: Record<string, Blob>) => Promise<void>;
  updateItem: (id: string, partial: Partial<FeedbackItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setFilters: (filters: Partial<FeedbackFilters>) => void;
  exportAll: () => Promise<{ json: Blob; files: Array<{ key: string; blob: Blob }> }>;
  nukeAll: () => Promise<void>;
  pruneExpiredNow: () => Promise<void>;
  // Sync-related actions
  syncPendingItems: () => Promise<void>;
  syncItem: (id: string) => Promise<boolean>;
  retryFailedSync: () => Promise<void>;
}

export type FeedbackStore = FeedbackStoreState & FeedbackStoreActions;

// i18n strings
export const FEEDBACK_STRINGS = {
  'en-CA': {
    navItem: 'Feedback (dev)',
    fabTooltip: 'Send Feedback',
    modalTitle: 'Feedback Module',
    quickNote: 'Quick Note',
    fullCase: 'Full Case',
    review: 'Review',
    good: 'Good',
    meh: 'Meh',
    bad: 'Bad',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    export: 'Export All',
    nuke: 'Nuke All',
    prune: 'Prune Expired',
    phiToggle: 'Contains PHI',
    phiReminder: 'Dev-only, stored locally on this device. If this text contains names/IDs/PHI, please mask before saving. You can purge anytime.',
    daysLeft: 'days left',
    noItems: 'No feedback items found',
    categories: {
      dictation: 'Dictation Quality',
      transcription: 'Transcription Quality',
      hallucination: 'Hallucination Issues',
      context: 'Context Preservation',
      structure: 'Structure & Formatting',
      overall: 'Overall Rating'
    },
    tooltips: {
      good: 'Usable as-is; minor/no edits needed',
      meh: 'Minor corrections; acceptable draft',
      bad: 'Blocks usage; major errors (e.g., diarization failure, hallucination)'
    }
  },
  'fr-CA': {
    navItem: 'Commentaires (dev)',
    fabTooltip: 'Envoyer des commentaires',
    modalTitle: 'Module de commentaires',
    quickNote: 'Note rapide',
    fullCase: 'Cas complet',
    review: 'Révision',
    good: 'Bon',
    meh: 'Moyen',
    bad: 'Mauvais',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    delete: 'Supprimer',
    export: 'Exporter tout',
    nuke: 'Tout supprimer',
    prune: 'Nettoyer expirés',
    phiToggle: 'Contient des RPS',
    phiReminder: 'Dev uniquement, stocké localement sur cet appareil. Si ce texte contient des noms/IDs/RPS, veuillez masquer avant de sauvegarder. Vous pouvez purger à tout moment.',
    daysLeft: 'jours restants',
    noItems: 'Aucun élément de commentaire trouvé',
    categories: {
      dictation: 'Qualité de dictée',
      transcription: 'Qualité de transcription',
      hallucination: 'Problèmes d\'hallucination',
      context: 'Préservation du contexte',
      structure: 'Structure et formatage',
      overall: 'Évaluation globale'
    },
    tooltips: {
      good: 'Utilisable tel quel; modifications mineures/aucune',
      meh: 'Corrections mineures; brouillon acceptable',
      bad: 'Bloque l\'utilisation; erreurs majeures (ex: échec de diarisation, hallucination)'
    }
  }
} as const;

export type FeedbackLanguage = keyof typeof FEEDBACK_STRINGS;
