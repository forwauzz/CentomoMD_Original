/**
 * Pipeline configuration for Mode 3 (Ambient/Transcribe)
 * S1-S5: AWS JSON → IrDialog → Role-mapped → Cleaned → Narrative
 */

import { CleanupProfile } from '../types/ir.js';

export const PIPELINE_CONFIG = {
  // S1: Ingest configuration
  ingest: {
    minConfidence: 0.5,
    maxPartialResults: 10,
    mergeThreshold: 0.1, // seconds
  },

  // S2: Merge configuration
  merge: {
    maxGapSeconds: 1.0,      // MERGE_GAP_SEC
    minTurnDuration: 0.5,
    maxTurnDuration: 15.0,   // MAX_TURN_SEC
  },

  // S3: Role mapping configuration
  roleMapping: {
    // Cue words that bias toward PATIENT role
    patientCues: [
      'je', 'moi', 'mon', 'ma', 'mes', 'me', 'm\'', 'j\'ai', 'j\'étais', 'j\'ai eu',
      'i', 'my', 'me', 'i\'m', 'i was', 'i had', 'i feel', 'i think', 'i need',
      'douleur', 'mal', 'souffre', 'sensation', 'symptôme', 'problème',
      'pain', 'hurt', 'ache', 'symptom', 'problem', 'issue', 'feel'
    ],
    
    // Cue words that bias toward CLINICIAN role
    clinicianCues: [
      'docteur', 'dr', 'médecin', 'infirmier', 'infirmière', 'thérapeute',
      'doctor', 'dr', 'physician', 'nurse', 'therapist', 'specialist',
      'diagnostic', 'traitement', 'médicament', 'prescription', 'examen',
      'diagnosis', 'treatment', 'medication', 'prescription', 'exam', 'test',
      'comment', 'depuis', 'combien', 'où', 'quand', 'pourquoi',
      'how', 'since', 'how long', 'where', 'when', 'why', 'what'
    ],

    // Heuristic rules
    heuristics: {
      firstDistinctSpeakerIsPatient: true,
      cueWordWeight: 0.3,
      positionWeight: 0.2,
      lengthWeight: 0.1,
    }
  },

  // S4: Cleanup profiles
  cleanupProfiles: {
    default: {
      name: 'default',
      removeFillers: true,
      normalizeSpacing: true,
      removeRepetitions: true,
      clinicalGuards: {
        preserveMedicalTerms: false,
        preserveNumbers: false,
        preserveDates: false,
      }
    } as CleanupProfile,

    clinical_light: {
      name: 'clinical_light',
      removeFillers: true,
      normalizeSpacing: true,
      removeRepetitions: false, // Keep repetitions in clinical context
      clinicalGuards: {
        preserveMedicalTerms: true,
        preserveNumbers: true,
        preserveDates: true,
      }
    } as CleanupProfile
  },

  // S5: Narrative configuration
  narrative: {
    defaultFormat: 'role_prefixed' as const,
    singleBlockThreshold: 1, // Use single block if only 1 speaker
    maxLineLength: 80,
    preserveTimestamps: false,
  },

  // Artifacts storage
  artifacts: {
    saveIntermediateResults: true,
    compressionEnabled: false,
    retentionDays: 30,
  }
};

export type PipelineConfig = typeof PIPELINE_CONFIG;
