/**
 * S5: Generate narrative output
 * Outputs PATIENT:/CLINICIAN: narrative or single block if one speaker
 */

import { CleanedDialog, NarrativeOutput, StageResult } from '../../../types/ir.js';
import { PIPELINE_CONFIG } from '../../../config/pipeline.js';

export class S5Narrative {
  private config = PIPELINE_CONFIG.narrative;

  async execute(cleanedDialog: CleanedDialog): Promise<StageResult<NarrativeOutput>> {
    const startTime = Date.now();

    try {
      const narrative = this.generateNarrative(cleanedDialog);
      
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: narrative,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in S5 narrative',
        processingTime
      };
    }
  }

  private generateNarrative(cleanedDialog: CleanedDialog): NarrativeOutput {
    const uniqueRoles = this.getUniqueRoles(cleanedDialog);
    
    // Determine output format
    const format = this.determineFormat(uniqueRoles);
    
    let content: string;
    if (format === 'single_block') {
      content = this.generateSingleBlock(cleanedDialog);
    } else {
      content = this.generateRolePrefixed(cleanedDialog);
    }

    const metadata = this.calculateMetadata(cleanedDialog);

    return {
      format,
      content,
      metadata
    };
  }

  private getUniqueRoles(cleanedDialog: CleanedDialog): string[] {
    const roles = new Set<string>();
    for (const turn of cleanedDialog.turns) {
      roles.add(turn.role);
    }
    return Array.from(roles);
  }

  private determineFormat(uniqueRoles: string[]): 'single_block' | 'role_prefixed' {
    if (uniqueRoles.length <= this.config.singleBlockThreshold) {
      return 'single_block';
    }
    return this.config.defaultFormat;
  }

  private generateSingleBlock(cleanedDialog: CleanedDialog): string {
    const lines: string[] = [];
    
    for (const turn of cleanedDialog.turns) {
      const text = this.formatTurnText(turn.text);
      lines.push(text);
    }
    
    return lines.join('\n');
  }

  private generateRolePrefixed(cleanedDialog: CleanedDialog): string {
    const lines: string[] = [];
    
    for (const turn of cleanedDialog.turns) {
      const rolePrefix = `${turn.role}:`;
      const text = this.formatTurnText(turn.text);
      lines.push(`${rolePrefix} ${text}`);
    }
    
    return lines.join('\n');
  }

  private formatTurnText(text: string): string {
    let formatted = text.trim();
    
    // Ensure proper sentence capitalization
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    // Ensure proper sentence ending
    if (formatted.length > 0 && !/[.!?]$/.test(formatted)) {
      formatted += '.';
    }
    
    // Handle line length if configured
    if (this.config.maxLineLength > 0 && formatted.length > this.config.maxLineLength) {
      formatted = this.wrapText(formatted, this.config.maxLineLength);
    }
    
    return formatted;
  }

  private wrapText(text: string, maxLength: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  private calculateMetadata(cleanedDialog: CleanedDialog): NarrativeOutput['metadata'] {
    const roleCounts = this.countRoles(cleanedDialog);
    const totalDuration = this.calculateTotalDuration(cleanedDialog);
    const wordCount = this.calculateWordCount(cleanedDialog);
    
    return {
      totalSpeakers: roleCounts.size,
      patientTurns: roleCounts.get('PATIENT') || 0,
      clinicianTurns: roleCounts.get('CLINICIAN') || 0,
      totalDuration,
      wordCount
    };
  }

  private countRoles(cleanedDialog: CleanedDialog): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const turn of cleanedDialog.turns) {
      const current = counts.get(turn.role) || 0;
      counts.set(turn.role, current + 1);
    }
    
    return counts;
  }

  private calculateTotalDuration(cleanedDialog: CleanedDialog): number {
    if (cleanedDialog.turns.length === 0) return 0;
    
    const lastTurn = cleanedDialog.turns[cleanedDialog.turns.length - 1];
    return lastTurn?.endTime || 0;
  }

  private calculateWordCount(cleanedDialog: CleanedDialog): number {
    return cleanedDialog.turns.reduce((total, turn) => {
      return total + turn.text.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  }
}
