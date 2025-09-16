/**
 * S1: Ingest AWS Transcribe JSON → IrDialog
 * Parses streaming format with speaker info in Items[].Speaker
 */

import { 
  IrDialog, 
  IrTurn, 
  AWSTranscribeResult, 
  AWSTranscriptItem,
  StageResult 
} from '../../../types/ir.js';

export class S1IngestAWS {

  async execute(awsResult: AWSTranscribeResult): Promise<StageResult<IrDialog>> {
    const startTime = Date.now();

    try {
      if (!awsResult.results?.items) {
        throw new Error('Invalid AWS Transcribe result: missing results items');
      }

      // For streaming, check if any items have speaker labels
      const hasSpeakerLabels = awsResult.results.items.some(item => item.Speaker);
      if (!hasSpeakerLabels) {
        throw new Error('Invalid AWS Transcribe result: no speaker labels found in items');
      }

      const turns = this.parseItemsToTurns(awsResult.results.items);

      const dialog: IrDialog = {
        turns,
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA', // TODO: Extract from AWS result
          totalDuration: this.calculateTotalDuration(turns),
          speakerCount: this.countDistinctSpeakers(turns),
          createdAt: new Date()
        }
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: dialog,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in S1 ingest',
        processingTime
      };
    }
  }

  private parseItemsToTurns(items: AWSTranscriptItem[]): IrTurn[] {
    const turns: IrTurn[] = [];
    let currentTurn: IrTurn | null = null;
    let confidenceSum = 0;
    let confidenceCount = 0;
    
    for (const item of items) {
      const content = item.alternatives[0]?.content || '';
      const confidence = parseFloat(item.alternatives[0]?.confidence || '0');
      
      if (item.Speaker) {
        // New speaker - start new turn
        if (currentTurn) {
          // Finalize previous turn
          currentTurn.confidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
          turns.push(currentTurn);
        }
        
        currentTurn = {
          speaker: item.Speaker,
          startTime: parseFloat(item.start_time || '0'),
          endTime: parseFloat(item.end_time || '0'),
          text: content,
          confidence: confidence,
          isPartial: false
        };
        confidenceSum = confidence;
        confidenceCount = 1;
      } else if (currentTurn) {
        // Continue current turn - add all content (including spaces and punctuation)
        currentTurn.text += content;
        currentTurn.endTime = parseFloat(item.end_time || currentTurn.endTime.toString());
        confidenceSum += confidence;
        confidenceCount++;
      }
    }
    
    if (currentTurn) {
      // Finalize last turn
      currentTurn.confidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;
      turns.push(currentTurn);
    }
    
    // Sort turns by start time
    return turns.sort((a, b) => a.startTime - b.startTime);
  }

  private calculateTotalDuration(turns: IrTurn[]): number {
    if (turns.length === 0) return 0;
    const lastTurn = turns[turns.length - 1];
    return lastTurn?.endTime || 0;
  }

  private countDistinctSpeakers(turns: IrTurn[]): number {
    const speakers = new Set(turns.map(turn => turn.speaker));
    return speakers.size;
  }
}