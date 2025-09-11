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
      const segmentResult = this.extractTextForSegment(segment, items);
      
      if (segmentResult.text.trim()) {
        const confidence = this.calculateSegmentConfidence(segment, items);
        
        turns.push({
          speaker,
          startTime,
          endTime: segmentResult.endTime, // Use actual end time from last word
          text: segmentResult.text,
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
  ): { text: string; endTime: number } {
    const segmentStartTime = parseFloat(segment.start_time);
    const segmentEndTime = parseFloat(segment.end_time);
    
    // First, collect all pronunciation items within this segment
    const segmentWords: Array<{ content: string; startTime: number; endTime: number; index: number }> = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === 'pronunciation' && item.alternatives[0]?.content) {
        const itemStartTime = item.start_time ? parseFloat(item.start_time) : 0;
        const itemEndTime = item.end_time ? parseFloat(item.end_time) : 0;
        
        if (itemStartTime < segmentEndTime && itemEndTime > segmentStartTime) {
          segmentWords.push({
            content: item.alternatives[0].content,
            startTime: itemStartTime,
            endTime: itemEndTime,
            index: i
          });
        }
      }
    }

    if (segmentWords.length === 0) {
      return { text: '', endTime: segmentStartTime };
    }

    // Sort by start time
    segmentWords.sort((a, b) => a.startTime - b.startTime);

    // Build text by joining words and attaching punctuation
    let text = '';
    let lastEndTime = segmentStartTime;

    for (let i = 0; i < segmentWords.length; i++) {
      const word = segmentWords[i];
      
      // Add space before word if there's previous content
      if (text) {
        text += ' ';
      }
      text += word.content;
      lastEndTime = word.endTime;

      // Look for punctuation items that come after this word
      for (let j = word.index + 1; j < items.length; j++) {
        const nextItem = items[j];
        if (nextItem.type === 'punctuation' && nextItem.alternatives[0]?.content) {
          const punct = nextItem.alternatives[0].content;
          // Skip space-only punctuation (it's handled by word spacing)
          if (punct.trim() === '' || punct === ' ') {
            continue;
          }
          // Attach punctuation if we haven't already attached it
          if (!text.endsWith(punct)) {
            text = this.joinWordAndPunct(text, punct);
          }
        } else if (nextItem.type === 'pronunciation') {
          // Stop at the next pronunciation item
          break;
        }
      }
    }

    return { text: text.trim(), endTime: lastEndTime };
  }

  /**
   * Helper to properly join words and punctuation with correct spacing
   */
  private joinWordAndPunct(prevText: string, punct: string): string {
    if (!prevText) return punct;
    
    // Remove trailing space if present
    const trimmed = prevText.trimEnd();
    
    // Punctuation that attaches directly (no space before)
    const directAttachPunct = ['.', ',', '?', '!', ';', ':'];
    
    if (directAttachPunct.includes(punct)) {
      return trimmed + punct;
    }
    
    // Other punctuation gets a space
    return trimmed + ' ' + punct;
  }

  /**
   * Helper to check if text ends with punctuation
   */
  private endsWithPunctuation(text: string): boolean {
    const punct = ['.', ',', '?', '!', ';', ':'];
    return punct.some(p => text.endsWith(p));
  }

  private calculateSegmentConfidence(
    segment: AWSSpeakerSegment, 
    items: AWSTranscriptItem[]
  ): number {
    const segmentStartTime = parseFloat(segment.start_time);
    const segmentEndTime = parseFloat(segment.end_time);
    
    // Get all pronunciation items that fall within this segment's time range
    const segmentItems = items.filter(item => {
      const itemStartTime = item.start_time ? parseFloat(item.start_time) : 0;
      const itemEndTime = item.end_time ? parseFloat(item.end_time) : 0;
      
      return item.type === 'pronunciation' && 
             itemStartTime < segmentEndTime && 
             itemEndTime > segmentStartTime;
    });

    if (segmentItems.length === 0) return 0;

    let totalConfidence = 0;
    let totalDuration = 0;

    for (const item of segmentItems) {
      const itemStartTime = item.start_time ? parseFloat(item.start_time) : 0;
      const itemEndTime = item.end_time ? parseFloat(item.end_time) : 0;
      const itemDuration = itemEndTime - itemStartTime;
      const confidence = parseFloat(item.alternatives[0]?.confidence || '0');
      
      totalConfidence += confidence * itemDuration;
      totalDuration += itemDuration;
    }

    return totalDuration > 0 ? totalConfidence / totalDuration : 0;
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
