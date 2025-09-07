// Core application types for CentomoMD

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinic_id?: string;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  ASSISTANT = 'assistant'
}

export interface Session {
  id: string;
  user_id: string;
  patient_id: string;
  consent_verified: boolean;
  status: SessionStatus;
  mode: TranscriptionMode;
  current_section: CNESSTSection;
  started_at: Date;
  ended_at?: Date;
  duration_seconds?: number;
  created_at: Date;
  updated_at: Date;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TranscriptionMode {
  WORD_FOR_WORD = 'word_for_word',
  SMART_DICTATION = 'smart_dictation',
  AMBIENT = 'ambient'
}

export enum CNESSTSection {
  SECTION_7 = 'section_7',
  SECTION_8 = 'section_8',
  SECTION_11 = 'section_11'
}

export interface Transcript {
  id: string;
  session_id: string;
  section: CNESSTSection;
  content: string;
  is_final: boolean;
  confidence_score?: number;
  language_detected?: string;
  timestamp: Date;
  created_at: Date;
}

export interface VoiceCommand {
  command: string;
  action: VoiceCommandAction;
  section?: CNESSTSection;
  parameters?: Record<string, any>;
}

export enum VoiceCommandAction {
  START_TRANSCRIPTION = 'start_transcription',
  PAUSE_TRANSCRIPTION = 'pause_transcription',
  END_SECTION = 'end_section',
  CLEAR_BUFFER = 'clear_buffer',
  NEW_PARAGRAPH = 'new_paragraph',
  SAVE_AND_CONTINUE = 'save_and_continue'
}

export interface TranscriptionConfig {
  language_code?: string;
  identify_language?: boolean;  // Optional for single language sessions
  language_options?: string[];  // Optional for single language sessions
  preferred_language?: string;  // Optional for single language sessions
  media_sample_rate_hz: number;
  media_encoding?: 'pcm' | 'pcm16' | 'ogg-opus' | 'flac';  // Optional, defaults to 'pcm'
  vocabulary_name?: string;
  vocabulary_filter_name?: string;
  show_speaker_labels?: boolean;
  max_speaker_labels?: number;
  // Phase 0: Mode-specific configuration fields
  partial_results_stability?: 'low' | 'medium' | 'high';
}

export interface AudioChunk {
  data: Buffer;
  timestamp: Date;
  sequence_number: number;
}

export interface TranscriptionResult {
  transcript: string;
  is_partial: boolean;
  confidence_score?: number;
  language_detected?: string;
  speaker_labels?: SpeakerLabel[];
  timestamp: Date;
  resultId?: string;           // stable key for tracking segments
  startTime?: number | null;   // start time in seconds
  endTime?: number | null;     // end time in seconds
  speaker?: string | null;     // PATIENT vs CLINICIAN
}

export interface SpeakerLabel {
  speaker_label: string;
  start_time: number;
  end_time: number;
}

export interface Template {
  id: string;
  section: CNESSTSection;
  name: string;
  description: string;
  content: string;
  language: 'fr' | 'en';
  version: string;
  is_active: boolean;
  voice_commands: VoiceCommandMapping[];
  created_at: Date;
  updated_at: Date;
}

export interface VoiceCommandMapping {
  trigger: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface ExportConfig {
  format: ExportFormat;
  fidelity: ExportFidelity;
  sections: CNESSTSection[];
  include_signature?: boolean;
  locale: 'fr' | 'en';
}

export enum ExportFormat {
  DOCX = 'docx',
  PDF = 'pdf'
}

export enum ExportFidelity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface AuditLog {
  id: string;
  user_id: string;
  session_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

export interface ComplianceConfig {
  region: string;
  data_retention_hours: number;
  encryption_enabled: boolean;
  audit_logging_enabled: boolean;
  phi_protection_enabled: boolean;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// WebSocket event types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface TranscriptionEvent extends WebSocketMessage {
  type: 'transcription_result';
  payload: TranscriptionResult;
}

export interface VoiceCommandEvent extends WebSocketMessage {
  type: 'voice_command';
  payload: VoiceCommand;
}

export interface SessionEvent extends WebSocketMessage {
  type: 'session_update';
  payload: Partial<Session>;
}

export interface ErrorEvent extends WebSocketMessage {
  type: 'error';
  payload: ErrorResponse;
}

// API Request/Response types
export interface CreateSessionRequest {
  patient_id: string;
  mode: TranscriptionMode;
  consent_verified: boolean;
}

export interface UpdateSessionRequest {
  status?: SessionStatus;
  current_section?: CNESSTSection;
  mode?: TranscriptionMode;
}

export interface StartTranscriptionRequest {
  session_id: string;
  config?: Partial<TranscriptionConfig>;
}

export interface ExportRequest {
  session_id: string;
  config: ExportConfig;
}

// Database schema types
export interface DatabaseSchema {
  users: User;
  sessions: Session;
  transcripts: Transcript;
  templates: Template;
  audit_logs: AuditLog;
}

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  S3_BUCKET_NAME: string;
  S3_REGION: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
