/**
 * Intermediate Representation (IR) types for Mode 3 pipeline
 * S1-S5: AWS JSON → IrDialog → Role-mapped → Cleaned → Narrative
 */

export interface IrDialog {
  turns: IrTurn[];
  metadata: {
    source: 'aws_transcribe';
    language: string;
    totalDuration: number;
    speakerCount: number;
    createdAt: Date;
  };
}

export interface IrTurn {
  speaker: string;           // spk_0, spk_1, etc.
  startTime: number;         // seconds
  endTime: number;           // seconds
  text: string;              // raw transcribed text
  confidence: number;        // 0-1
  isPartial?: boolean;       // true for partial results
}

export interface RoleMap {
  [speakerId: string]: 'PATIENT' | 'CLINICIAN';
}

export interface CleanupProfile {
  name: string;
  removeFillers: boolean;
  normalizeSpacing: boolean;
  removeRepetitions: boolean;
  clinicalGuards: {
    preserveMedicalTerms: boolean;
    preserveNumbers: boolean;
    preserveDates: boolean;
  };
}

export interface CleanedDialog {
  turns: CleanedTurn[];
  profile: string;
  metadata: {
    originalTurnCount: number;
    cleanedTurnCount: number;
    removedFillers: number;
    removedRepetitions: number;
  };
}

export interface CleanedTurn {
  speaker: string;           // spk_0, spk_1, etc.
  role: 'PATIENT' | 'CLINICIAN';
  startTime: number;
  endTime: number;
  text: string;              // cleaned text
  confidence: number;
  isPartial?: boolean;
}

export interface NarrativeOutput {
  format: 'single_block' | 'role_prefixed';
  content: string;
  metadata: {
    totalSpeakers: number;
    patientTurns: number;
    clinicianTurns: number;
    totalDuration: number;
    wordCount: number;
  };
}

export interface PipelineArtifacts {
  ir: IrDialog;
  roleMap: RoleMap;
  cleaned: CleanedDialog;
  narrative: NarrativeOutput;
  processingTime: {
    s1_ingest: number;
    s2_merge: number;
    s3_role_map: number;
    s4_cleanup: number;
    s5_narrative: number;
    total: number;
  };
}

// AWS Transcribe input types
export interface AWSTranscribeResult {
  speaker_labels?: {
    segments: AWSSpeakerSegment[];
  };
  results: {
    items: AWSTranscriptItem[];
  };
}

export interface AWSSpeakerSegment {
  start_time: string;
  end_time: string;
  speaker_label: string;
  items: AWSSegmentItem[];
}

export interface AWSSegmentItem {
  start_time?: string;
  end_time?: string;
  speaker_label: string;
}

export interface AWSTranscriptItem {
  start_time?: string;
  end_time?: string;
  alternatives: Array<{
    confidence: string;
    content: string;
  }>;
  type: 'pronunciation' | 'punctuation';
}

// Pipeline stage result types
export interface StageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
}

export interface PipelineStage {
  name: string;
  execute<T, R>(input: T): Promise<StageResult<R>>;
}
