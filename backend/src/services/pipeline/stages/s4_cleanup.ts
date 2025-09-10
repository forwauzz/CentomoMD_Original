/**
 * S4: Cleanup with two profiles
 * default: fillers/spacing cleanup
 * clinical_light: guarded toggles for clinical context
 */

import { IrDialog, RoleMap, CleanedDialog, CleanedTurn, StageResult } from '../../../types/ir.js';
import { PIPELINE_CONFIG } from '../../../config/pipeline.js';

export class S4Cleanup {
  private config = PIPELINE_CONFIG.cleanupProfiles;

  async execute(
    dialog: IrDialog, 
    roleMap: RoleMap, 
    profile: 'default' | 'clinical_light' = 'default'
  ): Promise<StageResult<CleanedDialog>> {
    const startTime = Date.now();

    try {
      const cleanupProfile = this.config[profile];
      const cleanedTurns = this.cleanTurns(dialog.turns, roleMap, cleanupProfile);
      
      const cleanedDialog: CleanedDialog = {
        turns: cleanedTurns,
        profile: profile,
        metadata: {
          originalTurnCount: dialog.turns.length,
          cleanedTurnCount: cleanedTurns.length,
          removedFillers: this.countRemovedFillers(dialog.turns, cleanedTurns),
          removedRepetitions: this.countRemovedRepetitions(dialog.turns, cleanedTurns)
        }
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: cleanedDialog,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in S4 cleanup',
        processingTime
      };
    }
  }

  private cleanTurns(
    turns: IrDialog['turns'], 
    roleMap: RoleMap, 
    profile: typeof PIPELINE_CONFIG.cleanupProfiles.default
  ): CleanedTurn[] {
    return turns.map(turn => {
      let cleanedText = turn.text;

      // Apply cleanup based on profile
      if (profile.removeFillers) {
        cleanedText = this.removeFillers(cleanedText, profile);
      }

      if (profile.normalizeSpacing) {
        cleanedText = this.normalizeSpacing(cleanedText);
      }

      if (profile.removeRepetitions) {
        cleanedText = this.removeRepetitions(cleanedText, profile);
      }

      return {
        speaker: turn.speaker,
        role: roleMap[turn.speaker] || 'PATIENT',
        startTime: turn.startTime,
        endTime: turn.endTime,
        text: cleanedText,
        confidence: turn.confidence,
        isPartial: Boolean(turn.isPartial)
      };
    }).filter(turn => turn.text.trim().length > 0); // Remove empty turns
  }

  private removeFillers(text: string, _profile: typeof PIPELINE_CONFIG.cleanupProfiles.default): string {
    // Common fillers in French and English
    const fillers = [
      // French fillers
      'euh', 'ah', 'oh', 'ben', 'alors', 'donc', 'voilà', 'enfin', 'bref',
      'hein', 'quoi', 'tu vois', 'tu sais', 'je veux dire', 'genre',
      // English fillers
      'um', 'uh', 'ah', 'oh', 'well', 'so', 'like', 'you know', 'i mean',
      'basically', 'actually', 'literally', 'obviously', 'clearly'
    ];

    let cleaned = text;
    
    for (const filler of fillers) {
      // Remove standalone fillers
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove repeated fillers
    cleaned = cleaned.replace(/\b(euh|um|uh)\s+\1+/gi, '');
    
    return cleaned;
  }

  private normalizeSpacing(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces to single space
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1$2') // Remove space between punctuation
      .trim();
  }

  private removeRepetitions(text: string, profile: typeof PIPELINE_CONFIG.cleanupProfiles.default): string {
    if (!profile.removeRepetitions) {
      return text;
    }

    // Remove repeated words (but preserve medical terms if clinical_light)
    const words = text.split(/\s+/);
    const cleaned: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      
      // Skip if this is a repetition
      if (currentWord === nextWord) {
        // Check if we should preserve this repetition (medical terms)
        if (profile.clinicalGuards.preserveMedicalTerms && currentWord && this.isMedicalTerm(currentWord)) {
          cleaned.push(currentWord);
        }
        // Skip the repetition
        continue;
      }
      
      if (currentWord) {
        cleaned.push(currentWord);
      }
    }
    
    return cleaned.join(' ');
  }

  private isMedicalTerm(word: string): boolean {
    // Simple medical term detection (could be expanded)
    const medicalTerms = [
      'douleur', 'symptôme', 'diagnostic', 'traitement', 'médicament',
      'pain', 'symptom', 'diagnosis', 'treatment', 'medication',
      'mg', 'ml', 'cc', 'mg/kg', 'bpm', 'mmhg'
    ];
    
    const lowerWord = word.toLowerCase();
    return medicalTerms.some(term => lowerWord.includes(term));
  }

  private countRemovedFillers(original: IrDialog['turns'], cleaned: CleanedTurn[]): number {
    // Simple estimation based on text length difference
    const originalLength = original.reduce((sum, turn) => sum + turn.text.length, 0);
    const cleanedLength = cleaned.reduce((sum, turn) => sum + turn.text.length, 0);
    return Math.max(0, originalLength - cleanedLength);
  }

  private countRemovedRepetitions(original: IrDialog['turns'], _cleaned: CleanedTurn[]): number {
    // Count repeated words in original text
    let repetitionCount = 0;
    
    for (const turn of original) {
      const words = turn.text.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1]) {
          repetitionCount++;
        }
      }
    }
    
    return repetitionCount;
  }
}
