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
        currentTurn = this.mergeTurns(currentTurn, turn);
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

    // Check turn duration limits
    const mergedDuration = turn2.endTime - turn1.startTime;
    if (mergedDuration > this.config.maxTurnDuration) {
      return false;
    }

    // Check minimum turn duration (don't merge very short turns)
    if (turn1.endTime - turn1.startTime < this.config.minTurnDuration) {
      return true; // Allow merging short turns
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

    // Calculate weighted average confidence
    const duration1 = turn1.endTime - turn1.startTime;
    const duration2 = turn2.endTime - turn2.startTime;
    const totalDuration = duration1 + duration2;
    
    const weightedConfidence = 
      (turn1.confidence * duration1 + turn2.confidence * duration2) / totalDuration;

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
