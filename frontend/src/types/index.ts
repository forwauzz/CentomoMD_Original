// Core types that mirror backend
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'admin' | 'assistant';
  clinic_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  case_id?: number; // Reference to cases table
  patient_id: string;
  consent_verified: boolean;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  mode: 'word_for_word' | 'smart_dictation' | 'ambient';
  current_section: 'section_7' | 'section_8' | 'section_11';
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  session_id: string;
  section: 'section_7' | 'section_8' | 'section_11';
  content: string;
  language: 'fr' | 'en';
  is_final: boolean;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceCommand {
  trigger: string;
  action: 'start_section' | 'end_section' | 'clear' | 'new_paragraph' | 'save_continue' | 'pause' | 'resume';
  parameters?: Record<string, any>;
}

export interface Template {
  id: string;
  section: 'section_7' | 'section_8' | 'section_11';
  name: string;
  description: string;
  language: 'fr' | 'en';
  version: string;
  is_active: boolean;
  content: {
    structure: {
      title: string;
      sections: Array<{
        name: string;
        title: string;
        template: string;
        required: boolean;
        voice_triggers: string[];
      }>;
    };
    voice_commands: VoiceCommand[];
    formatting_rules: Record<string, any>;
    validation_rules: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

export type CNESSTSection = 'section_7' | 'section_8' | 'section_11';

export type TranscriptionMode = 'word_for_word' | 'smart_dictation' | 'ambient';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

// Frontend-specific types
// Enhanced segment tracking for partial results
export interface Segment {
  id: string;
  text: string;
  startTime?: number | null;
  endTime?: number | null;
  isFinal: boolean;
  speaker?: string | null;     // PATIENT vs CLINICIAN
  isProtected?: boolean;       // Protected from formatting
}

export interface TranscriptionState {
  isRecording: boolean;
  isConnected: boolean;
  currentTranscript: string;
  finalTranscripts: Transcript[];
  currentSection: CNESSTSection;
  mode: TranscriptionMode;
  sessionId?: string;
  error?: string;
  reconnectionAttempts: number;
}

export interface AudioConfig {
  sampleRate: number;
  channelCount: number;
  bitsPerSample: number;
}

export interface WebSocketMessage {
  type: 'start_transcription' | 'stop_transcription' | 'audio_chunk' | 'voice_command' | 'ping' | 'pong';
  payload?: any;
  sessionId?: string;
}

export interface TranscriptionResult {
  type: 'partial' | 'final';
  transcript: string;
  confidence?: number;
  language?: 'fr' | 'en';
  timestamp: number;
}

export interface VoiceCommandResult {
  command: VoiceCommand;
  detected: boolean;
  confidence: number;
  timestamp: number;
}

export interface ExportConfig {
  type: 'transcript_only' | 'structured_report' | 'full_form';
  format: 'docx' | 'pdf';
  sections: CNESSTSection[];
  includeSignature: boolean;
  locale: 'fr' | 'en';
}

export interface ExportResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

// UI Component types
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Form types
export interface SessionFormData {
  patientId: string;
  caseId?: number; // Optional case ID to associate with session
  consentVerified: boolean;
  mode: TranscriptionMode;
  currentSection: CNESSTSection;
}

export interface UserFormData {
  name: string;
  email: string;
  role: 'doctor' | 'admin' | 'assistant';
  clinicId?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Store types
export interface AppState {
  user: User | null;
  session: Session | null;
  transcription: TranscriptionState;
  templates: Template[];
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  updateTranscription: (updates: Partial<TranscriptionState>) => void;
  setTemplates: (templates: Template[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

// Hook types
export interface UseTranscriptionReturn {
  isRecording: boolean;
  isConnected: boolean;
  currentTranscript: string;
  finalTranscripts: Transcript[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  sendVoiceCommand: (command: string) => void;
  error: string | null;
  reconnectionAttempts: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  error: string | null;
  reconnect: () => void;
}

// Theme types
export interface Theme {
  mode: 'light' | 'dark';
  language: 'fr' | 'en';
}

// Localization types
export interface Localization {
  language: 'fr' | 'en';
  translations: Record<string, string>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Performance types
export interface PerformanceMetrics {
  transcriptionLatency: number;
  audioQuality: number;
  connectionStability: number;
  memoryUsage: number;
  timestamp: number;
}

export type TranscriptionLanguage = 'fr-CA' | 'en-US';

export interface TranscriptionConfig {
  languageCode: TranscriptionLanguage;
  identifyLanguage?: boolean;
  languageOptions?: TranscriptionLanguage[];
  mediaSampleRateHertz?: number;
  mediaEncoding?: 'pcm' | 'pcm16' | 'ogg-opus' | 'flac';
  showSpeakerLabels?: boolean;
  maxSpeakerLabels?: number;
}
