/**
 * S3: Role mapping with heuristic rules
 * Maps spk_0, spk_1, etc. to PATIENT/CLINICIAN roles
 */

import { IrDialog, RoleMap, StageResult, IrTurn } from '../../../types/ir.js';
import { PIPELINE_CONFIG } from '../../../config/pipeline.js';

export class S3RoleMap {
  private config = PIPELINE_CONFIG.roleMapping;

  async execute(dialog: IrDialog): Promise<StageResult<RoleMap>> {
    const startTime = Date.now();

    try {
      const roleMap = this.generateRoleMap(dialog);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: roleMap,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in S3 role mapping',
        processingTime
      };
    }
  }

  /**
   * Apply role swap for support use (not doctor)
   * Swaps PATIENT ↔ CLINICIAN roles
   */
  applyRoleSwap(roleMap: RoleMap): RoleMap {
    const swapped: RoleMap = {};
    
    for (const [speaker, role] of Object.entries(roleMap)) {
      swapped[speaker] = role === 'PATIENT' ? 'CLINICIAN' : 'PATIENT';
    }
    
    return swapped;
  }

  private generateRoleMap(dialog: IrDialog): RoleMap {
    const speakers = this.getDistinctSpeakers(dialog);
    const roleMap: RoleMap = {};

    if (speakers.length === 0) {
      return roleMap;
    }

    // Single speaker case
    if (speakers.length === 1) {
      const speaker = speakers[0];
      if (speaker) {
        roleMap[speaker] = 'PATIENT';
      }
      return roleMap;
    }

    // Multi-speaker case: apply heuristics
    const speakerScores = this.calculateSpeakerScores(dialog, speakers);
    
    // Sort speakers by score (higher = more likely to be patient)
    const sortedSpeakers = speakers.sort((a, b) => (speakerScores[b] || 0) - (speakerScores[a] || 0));
    
    // Assign roles based on heuristic rules
    if (this.config.heuristics.firstDistinctSpeakerIsPatient) {
      // First distinct speaker (by appearance order) gets patient role
      const firstSpeaker = this.getFirstSpeakerByOrder(dialog);
      if (firstSpeaker) {
        roleMap[firstSpeaker] = 'PATIENT';
        
        // Assign remaining speakers
        for (const speaker of speakers) {
          if (speaker !== firstSpeaker) {
            roleMap[speaker] = 'CLINICIAN';
          }
        }
      }
    } else {
      // Use score-based assignment
      const patientSpeaker = sortedSpeakers[0];
      if (patientSpeaker) {
        roleMap[patientSpeaker] = 'PATIENT';
      }
      
      for (let i = 1; i < sortedSpeakers.length; i++) {
        const speaker = sortedSpeakers[i];
        if (speaker) {
          roleMap[speaker] = 'CLINICIAN';
        }
      }
    }

    return roleMap;
  }

  private getDistinctSpeakers(dialog: IrDialog): string[] {
    const speakers = new Set<string>();
    for (const turn of dialog.turns) {
      speakers.add(turn.speaker);
    }
    return Array.from(speakers);
  }

  private getFirstSpeakerByOrder(dialog: IrDialog): string | null {
    if (dialog.turns.length === 0) return null;
    return dialog.turns[0]?.speaker || null;
  }

  private calculateSpeakerScores(dialog: IrDialog, speakers: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    for (const speaker of speakers) {
      scores[speaker] = 0;
    }

    // Calculate scores for each speaker
    for (const speaker of speakers) {
      const speakerTurns = dialog.turns.filter(turn => turn.speaker === speaker);
      
      // Cue word analysis
      const cueScore = this.analyzeCueWords(speakerTurns);
      scores[speaker] = (scores[speaker] || 0) + cueScore * this.config.heuristics.cueWordWeight;
      
      // Position analysis (earlier speakers more likely to be patient)
      const positionScore = this.analyzePosition(speaker, dialog);
      scores[speaker] = (scores[speaker] || 0) + positionScore * this.config.heuristics.positionWeight;
      
      // Length analysis (patients often speak more)
      const lengthScore = this.analyzeLength(speakerTurns);
      scores[speaker] = (scores[speaker] || 0) + lengthScore * this.config.heuristics.lengthWeight;
    }

    return scores;
  }

  private analyzeCueWords(turns: IrTurn[]): number {
    const allText = turns.map(turn => turn.text.toLowerCase()).join(' ');
    let score = 0;

    // Patient cues (positive score)
    for (const cue of this.config.patientCues) {
      const matches = (allText.match(new RegExp(`\\b${cue}\\b`, 'g')) || []).length;
      score += matches * 1;
    }

    // Clinician cues (negative score)
    for (const cue of this.config.clinicianCues) {
      const matches = (allText.match(new RegExp(`\\b${cue}\\b`, 'g')) || []).length;
      score -= matches * 1;
    }

    return score;
  }

  private analyzePosition(speaker: string, dialog: IrDialog): number {
    const firstTurnIndex = dialog.turns.findIndex(turn => turn.speaker === speaker);
    if (firstTurnIndex === -1) return 0;
    
    // Earlier speakers get higher scores
    const totalTurns = dialog.turns.length;
    return (totalTurns - firstTurnIndex) / totalTurns;
  }

  private analyzeLength(turns: IrTurn[]): number {
    if (turns.length === 0) return 0;
    
    const totalWords = turns.reduce((sum, turn) => {
      return sum + turn.text.split(/\s+/).length;
    }, 0);
    
    const totalDuration = turns.reduce((sum, turn) => {
      return sum + (turn.endTime - turn.startTime);
    }, 0);
    
    // Normalize by duration to get words per second
    return totalDuration > 0 ? totalWords / totalDuration : 0;
  }
}
