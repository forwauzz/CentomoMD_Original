/**
 * Backend Feedback Types
 * Type definitions for feedback API operations
 */

export interface FeedbackMeta {
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
}

export interface FeedbackRating {
  score: number; // 1-5 scale
  comment?: string;
}

export interface FeedbackRatings {
  dictation?: FeedbackRating;
  transcription?: FeedbackRating;
  hallucination?: FeedbackRating;
  context?: FeedbackRating;
  structure?: FeedbackRating;
  overall?: FeedbackRating;
}

export interface FeedbackHighlight {
  start_line?: number;
  end_line?: number;
  note?: string;
}

export interface FeedbackArtifacts {
  raw_text?: string;
  raw_file_ref?: string;
  templated_text?: string;
  templated_file_ref?: string;
  final_text?: string;
  final_file_ref?: string;
  template_name?: string;
}

export interface CreateFeedbackRequest {
  session_id?: string;
  meta: FeedbackMeta;
  ratings: FeedbackRatings;
  artifacts?: FeedbackArtifacts;
  highlights?: FeedbackHighlight[];
  comment?: string;
  attachments?: string[];
  ttl_days?: number;
}

export interface UpdateFeedbackRequest {
  ratings?: FeedbackRatings;
  artifacts?: FeedbackArtifacts;
  highlights?: FeedbackHighlight[];
  comment?: string;
  attachments?: string[];
  status?: 'open' | 'triaged' | 'resolved';
  ttl_days?: number;
}

export interface FeedbackResponse {
  id: string;
  user_id: string;
  session_id?: string;
  meta: FeedbackMeta;
  ratings: FeedbackRatings;
  artifacts?: FeedbackArtifacts;
  highlights: FeedbackHighlight[];
  comment?: string;
  attachments: string[];
  status: 'open' | 'triaged' | 'resolved';
  ttl_days: number;
  created_at: string;
  updated_at: string;
}

export interface FeedbackListResponse {
  items: FeedbackResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface FeedbackFilters {
  status?: 'open' | 'triaged' | 'resolved';
  mode?: string;
  template?: string;
  date_from?: string;
  date_to?: string;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface SyncRequest {
  items: Array<{
    id: string;
    data: CreateFeedbackRequest;
    timestamp: string;
  }>;
}

export interface SyncResponse {
  synced: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}
