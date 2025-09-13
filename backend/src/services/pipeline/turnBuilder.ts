/**
 * Turn Builder for Clean Speaker Rendering
 * 
 * Builds clean turns from smoothed segments with proper role mapping.
 * Eliminates inline speaker labels and provides clean turn-based output.
 */

import { SmoothedSegment } from './smoother.js';
import { RoleMappingResult } from './roleMapper.js';

export interface Turn {
  role: 'Clinician' | 'Patient' | 'Clinicien';
  text: string;
  t0: number;
  t1: number;
}

export interface TurnBuilderResult {
  turns: Turn[];
  stats: {
    totalTurns: number;
    clinicianTurns: number;
    patientTurns: number;
    totalDuration: number;
  };
}

export class TurnBuilder {
  private static readonly TURN_GAP_THRESHOLD = 2.5; // seconds

  /**
   * Build clean turns from smoothed segments and role mapping
   */
  static buildTurns(
    segments: SmoothedSegment[],
    roleMapping: RoleMappingResult,
    language: 'fr' | 'en'
  ): TurnBuilderResult {
    if (segments.length === 0) {
      return {
        turns: [],
        stats: { totalTurns: 0, clinicianTurns: 0, patientTurns: 0, totalDuration: 0 }
      };
    }

    const turns: Turn[] = [];
    let currentTurn: Turn | null = null;

    // Determine role labels based on language and convert to proper case
    const rawRoleLabels = language === 'fr' ? roleMapping.roleMapFr : roleMapping.roleMap;
    const roleLabels = {
      A: this.formatRoleLabel(rawRoleLabels.A, language),
      B: this.formatRoleLabel(rawRoleLabels.B, language)
    };

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const role = roleLabels[segment.bucket];

      // Check if we need to start a new turn
      if (this.shouldStartNewTurn(currentTurn, segment, roleMapping)) {
        // Save previous turn if exists
        if (currentTurn) {
          turns.push(currentTurn);
        }

        // Start new turn
        currentTurn = {
          role: role as 'Clinician' | 'Patient' | 'Clinicien',
          text: segment.text,
          t0: segment.t0,
          t1: segment.t1
        };
      } else {
        // Continue current turn
        if (currentTurn) {
          currentTurn.text += ' ' + segment.text;
          currentTurn.t1 = segment.t1;
        }
      }
    }

    // Add the last turn
    if (currentTurn) {
      turns.push(currentTurn);
    }

    // Calculate statistics
    const stats = this.calculateStats(turns);

    return { turns, stats };
  }

  /**
   * Format role label to proper case
   */
  private static formatRoleLabel(role: string, language: 'fr' | 'en'): string {
    if (language === 'fr') {
      return role === 'CLINICIEN' ? 'Clinicien' : 'Patient';
    } else {
      return role === 'CLINICIAN' ? 'Clinician' : 'Patient';
    }
  }

  /**
   * Determine if a new turn should be started
   */
  private static shouldStartNewTurn(
    currentTurn: Turn | null,
    segment: SmoothedSegment,
    roleMapping: RoleMappingResult
  ): boolean {
    if (!currentTurn) return true;

    // Check for role change by comparing buckets
    // We need to determine which bucket the current turn belongs to
    const currentBucket = currentTurn.role === 'Clinician' || currentTurn.role === 'Clinicien' ? 'A' : 'B';
    const roleChanged = currentBucket !== segment.bucket;
    if (roleChanged) return true;

    // Check for large time gap
    const gap = segment.t0 - currentTurn.t1;
    if (gap > this.TURN_GAP_THRESHOLD) return true;

    return false;
  }

  /**
   * Calculate turn statistics
   */
  private static calculateStats(turns: Turn[]): {
    totalTurns: number;
    clinicianTurns: number;
    patientTurns: number;
    totalDuration: number;
  } {
    const totalTurns = turns.length;
    const clinicianTurns = turns.filter(turn => 
      turn.role === 'Clinician' || turn.role === 'Clinicien'
    ).length;
    const patientTurns = turns.filter(turn => turn.role === 'Patient').length;
    
    // Calculate total duration as time span from first turn start to last turn end
    const totalDuration = turns.length > 0 
      ? Math.max(...turns.map(turn => turn.t1)) - Math.min(...turns.map(turn => turn.t0))
      : 0;

    return {
      totalTurns,
      clinicianTurns,
      patientTurns,
      totalDuration
    };
  }

  /**
   * Clean and format turn text
   */
  static cleanTurnText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([,.!?;:])\s+/g, '$1 ') // Ensure space after punctuation
      .trim();
  }

  /**
   * Format turns for display
   */
  static formatTurnsForDisplay(turns: Turn[]): string {
    return turns
      .map(turn => {
        const cleanText = this.cleanTurnText(turn.text);
        return `${turn.role}: ${cleanText}`;
      })
      .join('\n\n');
  }

  /**
   * Get turn summary for logging
   */
  static getTurnSummary(turns: Turn[]): string {
    const stats = this.calculateStats(turns);
    const avgTurnLength = stats.totalTurns > 0 ? stats.totalDuration / stats.totalTurns : 0;
    
    return `Turns: ${stats.totalTurns} (${stats.clinicianTurns}C/${stats.patientTurns}P), ` +
           `Duration: ${stats.totalDuration.toFixed(1)}s, ` +
           `Avg: ${avgTurnLength.toFixed(1)}s/turn`;
  }
}
