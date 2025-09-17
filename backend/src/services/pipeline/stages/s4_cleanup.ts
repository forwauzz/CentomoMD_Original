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
      if (!cleanupProfile) {
        throw new Error(`Invalid cleanup profile: ${profile}`);
      }
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
    // Language-specific filler patterns
    const fillerPatterns = {
      EN: /\b(um|uh|er|ah|mm|hmm|like)\b/gi,
      FR: /\b(euh|ben|alors|donc|voilà|heu)\b/gi
    };

    let cleaned = text;
    
    // Apply both language patterns (text might contain mixed languages)
    for (const pattern of Object.values(fillerPatterns)) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove repeated fillers
    cleaned = cleaned.replace(/\b(euh|um|uh|er|ah|mm|hmm)\s+\1+/gi, '');
    
    // Clean up punctuation left behind by filler removal
    cleaned = cleaned.replace(/,\s*,+/g, ','); // Remove multiple commas
    cleaned = cleaned.replace(/^\s*,\s*/g, ''); // Remove leading comma
    cleaned = cleaned.replace(/,\s*$/g, ''); // Remove trailing comma
    cleaned = cleaned.replace(/,\s*,/g, ','); // Remove double commas
    cleaned = cleaned.replace(/,\s*,/g, ','); // Remove double commas again
    cleaned = cleaned.replace(/^\s*,\s*/g, ''); // Remove leading comma again
    
    return cleaned;
  }

  /**
   * Preserve medical abbreviations and terms from being removed
   */
  // private preserveMedicalTokens(text: string): string {
  //   // This method ensures medical terms are not accidentally removed
  //   // by other cleanup processes
  //   return text; // For now, medical preservation is handled in removeRepetitions
  // }

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
        // Skip the repetition by incrementing i
        i++; // Skip the next word since it's a repetition
        continue;
      }
      
      if (currentWord && currentWord.trim()) {
        cleaned.push(currentWord);
      }
    }
    
    return cleaned.join(' ');
  }

  private isMedicalTerm(word: string): boolean {
    // Medical abbreviations and terms whitelist
    const medicalTerms = [
      // Medical abbreviations
      'dr', 'dr.', 'mg', 'ml', 'cc', 'bpm', 'mmhg', 'nsaids', 'nsaid',
      'pt', 'pt.', 'ptt', 'inr', 'bun', 'creatinine', 'glucose',
      // Medical terms (French)
      'douleur', 'symptôme', 'diagnostic', 'traitement', 'médicament',
      'prescription', 'dosage', 'contre-indication', 'effet', 'secondaire',
      // Medical terms (English)
      'pain', 'symptom', 'diagnosis', 'treatment', 'medication',
      'prescription', 'dosage', 'contraindication', 'side', 'effect',
      'blood', 'pressure', 'heart', 'rate', 'temperature'
    ];
    
    const lowerWord = word.toLowerCase().replace(/[.,!?;:]/g, ''); // Remove punctuation
    return medicalTerms.some(term => lowerWord === term || lowerWord.startsWith(term + '.'));
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
