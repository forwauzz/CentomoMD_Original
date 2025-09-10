/**
 * S1: Ingest AWS Transcribe JSON → IrDialog
 * Parses speaker_labels.segments + results.items into structured turns
 */

import { 
  IrDialog, 
  IrTurn, 
  AWSTranscribeResult, 
  AWSSpeakerSegment, 
  AWSTranscriptItem,
  StageResult 
} from '../../../types/ir.js';

export class S1IngestAWS {

  async execute(awsResult: AWSTranscribeResult): Promise<StageResult<IrDialog>> {
    const startTime = Date.now();

    try {
      if (!awsResult.speaker_labels?.segments || !awsResult.results?.items) {
        throw new Error('Invalid AWS Transcribe result: missing speaker_labels or results');
      }

      const turns = this.parseSegmentsToTurns(
        awsResult.speaker_labels.segments,
        awsResult.results.items
      );

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

  private parseSegmentsToTurns(
    segments: AWSSpeakerSegment[], 
    items: AWSTranscriptItem[]
  ): IrTurn[] {
    const turns: IrTurn[] = [];

    for (const segment of segments) {
      const startTime = parseFloat(segment.start_time);
      const endTime = parseFloat(segment.end_time);
      const speaker = segment.speaker_label;

      // Find corresponding text items for this segment
      const segmentText = this.extractTextForSegment(segment, items);
      
      if (segmentText.trim()) {
        const confidence = this.calculateSegmentConfidence(segment, items);
        
        turns.push({
          speaker,
          startTime,
          endTime,
          text: segmentText,
          confidence,
          isPartial: false
        });
      }
    }

    // Sort turns by start time
    return turns.sort((a, b) => a.startTime - b.startTime);
  }

  private extractTextForSegment(
    segment: AWSSpeakerSegment, 
    items: AWSTranscriptItem[]
  ): string {
    const segmentItems = segment.items;
    const textParts: string[] = [];

    for (const segmentItem of segmentItems) {
      const itemStart = segmentItem.start_time ? parseFloat(segmentItem.start_time) : 0;
      const itemEnd = segmentItem.end_time ? parseFloat(segmentItem.end_time) : 0;

      // Find matching transcript item
      const transcriptItem = items.find(item => {
        const itemStartTime = item.start_time ? parseFloat(item.start_time) : 0;
        const itemEndTime = item.end_time ? parseFloat(item.end_time) : 0;
        
        return Math.abs(itemStartTime - itemStart) < 0.1 && 
               Math.abs(itemEndTime - itemEnd) < 0.1;
      });

      if (transcriptItem && transcriptItem.alternatives.length > 0) {
        const content = transcriptItem.alternatives[0]?.content;
        if (content) {
          if (transcriptItem.type === 'pronunciation') {
            textParts.push(content);
          } else if (transcriptItem.type === 'punctuation') {
            // Add punctuation without space
            textParts.push(content);
          }
        }
      }
    }

    return textParts.join(' ');
  }

  private calculateSegmentConfidence(
    segment: AWSSpeakerSegment, 
    items: AWSTranscriptItem[]
  ): number {
    let totalConfidence = 0;
    let itemCount = 0;

    for (const segmentItem of segment.items) {
      const itemStart = segmentItem.start_time ? parseFloat(segmentItem.start_time) : 0;
      const itemEnd = segmentItem.end_time ? parseFloat(segmentItem.end_time) : 0;

      const transcriptItem = items.find(item => {
        const itemStartTime = item.start_time ? parseFloat(item.start_time) : 0;
        const itemEndTime = item.end_time ? parseFloat(item.end_time) : 0;
        
        return Math.abs(itemStartTime - itemStart) < 0.1 && 
               Math.abs(itemEndTime - itemEnd) < 0.1;
      });

      if (transcriptItem && transcriptItem.alternatives.length > 0) {
        const confidence = parseFloat(transcriptItem.alternatives[0]?.confidence || '0');
        totalConfidence += confidence;
        itemCount++;
      }
    }

    return itemCount > 0 ? totalConfidence / itemCount : 0;
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
