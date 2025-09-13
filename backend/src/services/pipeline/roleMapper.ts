/**
 * Role Mapper for Speaker Diarization
 * 
 * Maps normalized A/B speaker buckets to Clinician/Patient roles using
 * bilingual heuristics (French/English) with zero user interaction.
 */

import { SmoothedSegment } from './smoother.js';
import { PipelineInvariantError } from './errors.js';

export interface Turn {
  speaker: string;
  startTime: number;
  endTime: number;
  text: string;
  isPartial?: boolean;
}

export interface RoleMappingInputs {
  speakers: string[];
  turns: Turn[];
}

export interface RoleMappingResult {
  roleMap: { A: 'CLINICIAN' | 'PATIENT'; B: 'CLINICIAN' | 'PATIENT' };
  roleMapFr: { A: 'CLINICIEN' | 'PATIENT'; B: 'CLINICIEN' | 'PATIENT' };
  confidence: number;
  features: {
    questionRatioA: number;
    questionRatioB: number;
    selfReportRatioA: number;
    selfReportRatioB: number;
    startsFirstA: number;
    talkShareA: number;
    talkShareB: number;
  };
}

export class RoleMapper {
  // Bilingual lexicons for role detection
  private static readonly FR_WH = [
    'qui', 'quoi', 'quand', 'où', 'pourquoi', 'comment', 'lequel', 'laquelle',
    'combien', 'quel', 'quelle', 'quels', 'quelles'
  ];

  private static readonly EN_WH = [
    'who', 'what', 'when', 'where', 'why', 'how', 'which', 'whom',
    'how many', 'how much', 'how long', 'how often'
  ];

  private static readonly FR_SELF = [
    'je', 'j\'', 'j\'', 'moi', 'mon', 'ma', 'mes', 'j\'ai', 'douleur',
    'j\'ai', 'j ai', 'mal', 'j\'ai mal', 'j\'éprouve', 'je ressens',
    'je me sens', 'je pense', 'je crois', 'je voudrais', 'je veux'
  ];

  private static readonly EN_SELF = [
    'i', 'my', 'me', 'pain', 'ache', 'hurts', 'i have', 'i feel',
    'i think', 'i believe', 'i would like', 'i want', 'i need',
    'i\'m experiencing', 'i\'m having', 'i\'m feeling'
  ];

  // Note: CLINICIAN_PREFIX arrays are reserved for future use in more sophisticated role detection
  // private static readonly CLINICIAN_FR_PREFIX = [
  //   'd\'accord', 'parfait', 'dites-moi', 'pouvez-vous', 'décrivez',
  //   'montrez', 'expliquez', 'racontez', 'pouvez-vous me dire',
  //   'est-ce que', 'avez-vous', 'comment vous sentez-vous'
  // ];

  // private static readonly CLINICIAN_EN_PREFIX = [
  //   'alright', 'okay', 'tell me', 'can you', 'describe', 'show me',
  //   'explain', 'let me know', 'can you tell me', 'do you have',
  //   'how do you feel', 'what brings you', 'what\'s going on'
  // ];

  /**
   * Map smoothed segments to Clinician/Patient roles
   */
  static map(segments: SmoothedSegment[], language: 'fr' | 'en'): RoleMappingResult {
    if (segments.length === 0) {
      return this.getDefaultMapping();
    }

    // Group segments by bucket
    const bucketA = segments.filter(segment => segment.bucket === 'A');
    const bucketB = segments.filter(segment => segment.bucket === 'B');

    if (bucketA.length === 0 || bucketB.length === 0) {
      return this.getDefaultMapping();
    }

    // Extract features for each bucket
    const featuresA = this.extractFeatures(bucketA, language);
    const featuresB = this.extractFeatures(bucketB, language);

    // Calculate total duration for normalization
    const totalDuration = featuresA.talkShare + featuresB.talkShare;
    
    // Normalize talk share
    const normalizedTalkShareA = totalDuration > 0 ? featuresA.talkShare / totalDuration : 0.5;
    const normalizedTalkShareB = totalDuration > 0 ? featuresB.talkShare / totalDuration : 0.5;

    // Determine who starts first
    const aStartsFirst = bucketA.length > 0 && bucketB.length > 0 && 
      Math.min(...bucketA.map(s => s.t0)) < Math.min(...bucketB.map(s => s.t0));
    const bStartsFirst = bucketA.length > 0 && bucketB.length > 0 && 
      Math.min(...bucketB.map(s => s.t0)) < Math.min(...bucketA.map(s => s.t0));

    // Calculate deltas (A - B)
    const deltaQuestion = featuresA.questionRatio - featuresB.questionRatio;
    const deltaSelfReport = featuresA.selfReportRatio - featuresB.selfReportRatio;
    const deltaStartsFirst = aStartsFirst ? 1 : (bStartsFirst ? -1 : 0);
    const deltaTalkShare = normalizedTalkShareA - normalizedTalkShareB;

    // Check if features are truly minimal (unclear)
    const totalQuestions = featuresA.questionRatio + featuresB.questionRatio;
    const totalSelfReports = featuresA.selfReportRatio + featuresB.selfReportRatio;
    const featuresAreMinimal = totalQuestions === 0 && totalSelfReports === 0 && 
                              Math.abs(deltaTalkShare) < 0.1 && Math.abs(deltaStartsFirst) < 0.1;

    // Calculate score using logistic function
    // Higher weights for question ratio and starts first, lower for self-report
    const score = 1 / (1 + Math.exp(-(
      3.0 * deltaQuestion +      // Strong emphasis on questions
      1.0 * deltaStartsFirst +   // Moderate emphasis on who starts first
      0.5 * deltaTalkShare +     // Light emphasis on talk share
      -0.3 * deltaSelfReport     // Negative weight for self-reports (patients have more)
    )));

    // Determine role assignment
    const aIsClinician = score >= 0.5;
    const confidence = featuresAreMinimal ? 0.5 : Math.max(score, 1 - score);

    const roleMap: { A: 'CLINICIAN' | 'PATIENT'; B: 'CLINICIAN' | 'PATIENT' } = {
      A: aIsClinician ? 'CLINICIAN' : 'PATIENT',
      B: aIsClinician ? 'PATIENT' : 'CLINICIAN'
    };

    const roleMapFr: { A: 'CLINICIEN' | 'PATIENT'; B: 'CLINICIEN' | 'PATIENT' } = {
      A: aIsClinician ? 'CLINICIEN' : 'PATIENT',
      B: aIsClinician ? 'PATIENT' : 'CLINICIEN'
    };

    return {
      roleMap,
      roleMapFr,
      confidence,
      features: {
        questionRatioA: featuresA.questionRatio,
        questionRatioB: featuresB.questionRatio,
        selfReportRatioA: featuresA.selfReportRatio,
        selfReportRatioB: featuresB.selfReportRatio,
        startsFirstA: aStartsFirst ? 1 : 0,
        talkShareA: normalizedTalkShareA,
        talkShareB: normalizedTalkShareB
      }
    };
  }

  /**
   * Defensive role mapping with explicit failure handling
   * Maps speakers to roles with safe defaults and explicit error reporting
   */
  static mapRoles(
    inputs: RoleMappingInputs, 
    options: { allowHeuristics?: boolean } = {}
  ): { [speaker: string]: 'CLINICIAN' | 'PATIENT' } {
    const { allowHeuristics = false } = options;
    const { speakers, turns } = inputs;

    // Guard: Ensure speakers exist
    if (!speakers || speakers.length === 0) {
      throw new PipelineInvariantError("ROLEMAP_NO_SPEAKERS", { speakers, turns });
    }

    // Initialize empty roleMap - do NOT default to PATIENT/PROVIDER silently
    const roleMap: { [speaker: string]: 'CLINICIAN' | 'PATIENT' } = {};

    // Detect canonical speaker names like "spk_0", "spk_1"
    const canonicalSpeakers = speakers.filter(speaker => 
      /^spk_\d+$/.test(speaker) || /^speaker_\d+$/i.test(speaker)
    );

    if (canonicalSpeakers.length > 0) {
      // For canonical speakers, initialize empty object without defaults
      canonicalSpeakers.forEach(speaker => {
        roleMap[speaker] = undefined as any; // Explicitly undefined, not defaulted
      });
    }

    // If heuristics are allowed, attempt to map roles
    if (allowHeuristics && turns && turns.length > 0) {
      try {
        // Convert turns to SmoothedSegment format for existing heuristics
        const segments: SmoothedSegment[] = turns.map(turn => ({
          t0: turn.startTime,
          t1: turn.endTime,
          bucket: 'A', // Default bucket, will be updated based on speaker
          text: turn.text,
          confidence: 1.0,
          isFiller: false
        }));

        // Group segments by speaker and assign buckets
        const speakerToBucket: { [speaker: string]: 'A' | 'B' } = {};
        let bucketCounter = 0;
        const buckets: ('A' | 'B')[] = ['A', 'B'];

        speakers.forEach(speaker => {
          if (!speakerToBucket[speaker]) {
            speakerToBucket[speaker] = buckets[bucketCounter % 2];
            bucketCounter++;
          }
        });

        // Update segments with correct buckets
        segments.forEach((segment, index) => {
          const turn = turns[index];
          if (turn && speakerToBucket[turn.speaker]) {
            segment.bucket = speakerToBucket[turn.speaker];
          }
        });

        // Use existing heuristics
        const normalizedLanguage = this.normalizeLanguage('en'); // Default to English
        const heuristicResult = this.map(segments, normalizedLanguage);

        // Map buckets back to speakers
        Object.entries(speakerToBucket).forEach(([speaker, bucket]) => {
          roleMap[speaker] = heuristicResult.roleMap[bucket];
        });
      } catch (error) {
        // If heuristics fail, keep empty roleMap
        console.warn('[RoleMapper] Heuristics failed, keeping empty roleMap:', error);
      }
    }

    // Guard: Ensure all speakers are mapped
    const unmappedSpeakers = speakers.filter(speaker => 
      !(speaker in roleMap) || roleMap[speaker] === undefined
    );

    if (unmappedSpeakers.length > 0) {
      throw new PipelineInvariantError("ROLEMAP_INCOMPLETE", { 
        speakers, 
        roleMap, 
        unmappedSpeakers 
      });
    }

    return roleMap;
  }

  /**
   * Extract features from a bucket of segments
   */
  private static extractFeatures(segments: SmoothedSegment[], language: 'fr' | 'en'): {
    questionRatio: number;
    selfReportRatio: number;
    startsFirst: number;
    talkShare: number;
  } {
    const totalDuration = segments.reduce((sum, segment) => sum + (segment.t1 - segment.t0), 0);
    const totalWords = segments.reduce((sum, segment) => sum + this.countWords(segment.text), 0);

    // Question ratio: turns ending with '?' or starting with wh-words
    const questionTurns = segments.filter(segment => {
      const text = segment.text.toLowerCase().trim();
      return text.endsWith('?') || this.startsWithWhWord(text, language);
    }).length;

    const questionRatio = segments.length > 0 ? questionTurns / segments.length : 0;

    // Self-report ratio: count of self-referential words per 100 words
    const selfReportWords = segments.reduce((sum, segment) => {
      return sum + this.countSelfReportWords(segment.text, language);
    }, 0);

    const selfReportRatio = totalWords > 0 ? (selfReportWords / totalWords) * 100 : 0;

    // Starts first: 1 if this bucket has the earliest start time
    const startsFirst = segments.length > 0 ? 1 : 0;

    // Talk share: proportion of total speaking time (will be normalized later)
    const talkShare = totalDuration;

    return {
      questionRatio,
      selfReportRatio,
      startsFirst,
      talkShare
    };
  }

  /**
   * Check if text starts with a wh-word
   */
  private static startsWithWhWord(text: string, language: 'fr' | 'en'): boolean {
    const whWords = language === 'fr' ? this.FR_WH : this.EN_WH;
    const firstWord = text.split(/\s+/)[0]?.toLowerCase();
    return whWords.some(wh => firstWord?.startsWith(wh));
  }

  /**
   * Count self-report words in text
   */
  private static countSelfReportWords(text: string, language: 'fr' | 'en'): number {
    const selfWords = language === 'fr' ? this.FR_SELF : this.EN_SELF;
    const words = text.toLowerCase().split(/\s+/);
    
    return words.reduce((count, word) => {
      return count + (selfWords.some(selfWord => word.includes(selfWord)) ? 1 : 0);
    }, 0);
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get default mapping when features can't be extracted
   */
  private static getDefaultMapping(): RoleMappingResult {
    return {
      roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
      roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
      confidence: 0.5,
      features: {
        questionRatioA: 0,
        questionRatioB: 0,
        selfReportRatioA: 0,
        selfReportRatioB: 0,
        startsFirstA: 0,
        talkShareA: 0.5,
        talkShareB: 0.5
      }
    };
  }

  /**
   * Normalize language code to 'fr' or 'en'
   */
  static normalizeLanguage(languageCode: string): 'fr' | 'en' {
    if (languageCode === 'fr-CA' || languageCode === 'fr') {
      return 'fr';
    }
    return 'en';
  }
}
