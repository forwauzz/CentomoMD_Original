/**
 * S2: Merge adjacent turns from same speaker
 * Consolidates fragmented speech into coherent turns
 */

import { IrDialog, IrTurn, StageResult } from '../../../types/ir.js';
import { PIPELINE_CONFIG } from '../../../config/pipeline.js';

export class S2Merge {
  private config = PIPELINE_CONFIG.merge;

  async execute(dialog: IrDialog): Promise<StageResult<IrDialog>> {
    const startTime = Date.now();

    try {
      const mergedTurns = this.mergeAdjacentTurns(dialog.turns);
      
      const mergedDialog: IrDialog = {
        ...dialog,
        turns: mergedTurns,
        metadata: {
          ...dialog.metadata,
          // Update metadata to reflect merged state
        }
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: mergedDialog,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in S2 merge',
        processingTime
      };
    }
  }

  private mergeAdjacentTurns(turns: IrTurn[]): IrTurn[] {
    if (turns.length === 0) return turns;

    const merged: IrTurn[] = [];
    let currentTurn: IrTurn | null = null;

    for (const turn of turns) {
      if (!currentTurn) {
        currentTurn = { ...turn };
        continue;
      }

      // Check if we can merge with current turn
      if (this.canMerge(currentTurn, turn)) {
        // Check if merging would exceed max duration
        const tentativeDuration = turn.endTime - currentTurn.startTime;
        if (tentativeDuration <= this.config.maxTurnDuration) {
          // Safe to merge
          currentTurn = this.mergeTurns(currentTurn, turn);
        } else {
          // Would exceed max duration, finalize current and start new
          merged.push(currentTurn);
          currentTurn = { ...turn };
        }
      } else {
        // Can't merge, finalize current turn and start new one
        merged.push(currentTurn);
        currentTurn = { ...turn };
      }
    }

    // Don't forget the last turn
    if (currentTurn) {
      merged.push(currentTurn);
    }

    return merged;
  }

  private canMerge(turn1: IrTurn, turn2: IrTurn): boolean {
    // Must be same speaker
    if (turn1.speaker !== turn2.speaker) {
      return false;
    }

    // Check time gap
    const gap = turn2.startTime - turn1.endTime;
    if (gap > this.config.maxGapSeconds) {
      return false;
    }

    return true;
  }

  private mergeTurns(turn1: IrTurn, turn2: IrTurn): IrTurn {
    // Combine text with appropriate spacing
    const text1 = turn1.text.trim();
    const text2 = turn2.text.trim();
    
    let combinedText: string;
    if (text1.endsWith('.') || text1.endsWith('!') || text1.endsWith('?')) {
      combinedText = `${text1} ${text2}`;
    } else if (text1.endsWith(',') || text1.endsWith(';') || text1.endsWith(':')) {
      combinedText = `${text1} ${text2}`;
    } else {
      // No punctuation, add space
      combinedText = `${text1} ${text2}`;
    }

    // Calculate weighted average confidence based on token counts
    const tokens1 = text1.split(/\s+/).length;
    const tokens2 = text2.split(/\s+/).length;
    const totalTokens = tokens1 + tokens2;
    
    const weightedConfidence = 
      (turn1.confidence * tokens1 + turn2.confidence * tokens2) / totalTokens;

    return {
      speaker: turn1.speaker,
      startTime: turn1.startTime,
      endTime: turn2.endTime,
      text: combinedText,
      confidence: weightedConfidence,
      isPartial: Boolean(turn1.isPartial || turn2.isPartial)
    };
  }
}
