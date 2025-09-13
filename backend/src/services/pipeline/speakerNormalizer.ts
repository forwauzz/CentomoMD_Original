/**
 * Speaker Normalizer for AWS Transcribe Results
 * 
 * Normalizes AWS speaker labels to consistent A/B buckets for role mapping.
 * Handles cases where AWS returns more than 2 speakers by merging least frequent ones.
 * Includes filler detection and confidence filtering.
 */

export interface NormalizedItem {
  t0: number;
  t1: number;
  bucket: 'A' | 'B';
  text: string;
  conf: number;
  filler?: boolean;
}

export interface NormalizationResult {
  items: NormalizedItem[];
  map: { [awsSpeaker: string]: 'A' | 'B' };
  stats: {
    uniqueBefore: number;
    uniqueAfter: number;
    droppedLowConf: number;
  };
}

export class SpeakerNormalizer {
  /**
   * Normalize AWS speaker labels to A/B buckets with filler detection
   */
  static normalize(awsResult: any): NormalizationResult {
    if (!awsResult || !awsResult.results) {
      return {
        items: [],
        map: {},
        stats: { uniqueBefore: 0, uniqueAfter: 0, droppedLowConf: 0 }
      };
    }

    // Build ordered tokens with speaker labels
    const tokens = this.buildTokens(awsResult);
    
    // Filter low confidence tokens and count dropped
    const originalCount = tokens.length;
    const filteredTokens = tokens.filter(token => token.confidence >= 0.5);
    const droppedLowConf = originalCount - filteredTokens.length;
    
    // Mark fillers
    const tokensWithFillers = this.markFillers(filteredTokens);
    
    // Merge contiguous same-speaker tokens
    const mergedTokens = this.mergeContiguousTokens(tokensWithFillers);
    
    // Get unique speaker labels
    const uniqueLabels = Array.from(new Set(mergedTokens.map(t => t.speaker_label)));
    
    // If more than 2 speakers, merge least frequent ones
    const { normalizedTokens, labelMap } = this.normalizeToTwoBuckets(mergedTokens, uniqueLabels);
    
    return {
      items: normalizedTokens,
      map: labelMap,
      stats: {
        uniqueBefore: uniqueLabels.length,
        uniqueAfter: 2,
        droppedLowConf
      }
    };
  }

  /**
   * Build ordered tokens from AWS result
   */
  private static buildTokens(awsResult: any): Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker_label: string;
  }> {
    const tokens: Array<{
      start: number;
      end: number;
      text: string;
      confidence: number;
      speaker_label: string;
    }> = [];

    // Extract from speaker_labels.segments if available
    if (awsResult.results?.speaker_labels?.segments) {
      for (const segment of awsResult.results.speaker_labels.segments) {
        for (const item of segment.items || []) {
          tokens.push({
            start: parseFloat(item.start_time || '0'),
            end: parseFloat(item.end_time || '0'),
            text: item.content || '',
            confidence: parseFloat(item.confidence || '0'),
            speaker_label: item.speaker_label || 'unknown'
          });
        }
      }
    }

    // Fallback: extract from items with speaker_label
    if (tokens.length === 0 && awsResult.results?.items) {
      for (const item of awsResult.results.items) {
        if (item.speaker_label) {
          tokens.push({
            start: parseFloat(item.start_time || '0'),
            end: parseFloat(item.end_time || '0'),
            text: item.alternatives?.[0]?.content || '',
            confidence: parseFloat(item.alternatives?.[0]?.confidence || '0'),
            speaker_label: item.speaker_label
          });
        }
      }
    }

    // Sort by start time
    return tokens.sort((a, b) => a.start - b.start);
  }

  /**
   * Mark filler words in tokens
   */
  private static markFillers(tokens: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker_label: string;
  }>): Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker_label: string;
    filler?: boolean;
  }> {
    const FILLERS_EN = /^(uh|um|mmm|er|ah|like)$/i;
    const FILLERS_FR = /^(euh|heu|ben|bah|alors|hum)$/i;
    
    return tokens.map(token => ({
      ...token,
      filler: FILLERS_EN.test(token.text) || FILLERS_FR.test(token.text)
    }));
  }

  /**
   * Merge contiguous tokens from the same speaker
   */
  private static mergeContiguousTokens(tokens: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker_label: string;
  }>): Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker_label: string;
  }> {
    if (tokens.length === 0) return [];

    const merged: Array<{
      start: number;
      end: number;
      text: string;
      confidence: number;
      speaker_label: string;
    }> = [];

    let current = { 
      start: tokens[0]?.start || 0,
      end: tokens[0]?.end || 0,
      text: tokens[0]?.text || '',
      confidence: tokens[0]?.confidence || 0,
      speaker_label: tokens[0]?.speaker_label || ''
    };

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;
      
      // If same speaker and contiguous (within 0.5s gap), merge
      if (token.speaker_label === current.speaker_label && 
          token.start - (current.end || 0) <= 0.5) {
        current.end = token.end;
        current.text += ' ' + token.text;
        current.confidence = Math.min(current.confidence || 0, token.confidence || 0);
      } else {
        merged.push(current);
        current = { 
          start: token.start,
          end: token.end,
          text: token.text,
          confidence: token.confidence,
          speaker_label: token.speaker_label
        };
      }
    }
    
    merged.push(current);
    return merged;
  }

  /**
   * Normalize to exactly 2 speaker buckets (A/B)
   */
  private static normalizeToTwoBuckets(
    tokens: Array<{
      start: number;
      end: number;
      text: string;
      confidence: number;
      speaker_label: string;
      filler?: boolean;
    }>,
    uniqueLabels: string[]
  ): {
    normalizedTokens: NormalizedItem[];
    labelMap: { [awsLabel: string]: 'A' | 'B' };
  } {
    if (uniqueLabels.length <= 2) {
      // Simple case: map to A/B
      const labelMap: { [awsLabel: string]: 'A' | 'B' } = {};
      uniqueLabels.forEach((label, index) => {
        labelMap[label] = index === 0 ? 'A' : 'B';
      });

      return {
        normalizedTokens: tokens.map(token => ({
          t0: token.start,
          t1: token.end,
          bucket: labelMap[token.speaker_label] as 'A' | 'B',
          text: token.text,
          conf: token.confidence,
          filler: token.filler
        })),
        labelMap
      };
    }

    // Complex case: merge least frequent speakers
    const labelCounts = this.countLabelFrequency(tokens);
    const sortedLabels = uniqueLabels.sort((a, b) => (labelCounts[b] || 0) - (labelCounts[a] || 0));
    
    // Keep the two most frequent labels
    const primaryLabels = sortedLabels.slice(0, 2);
    const labelsToMerge = sortedLabels.slice(2);
    
    // Create label map
    const labelMap: { [awsLabel: string]: 'A' | 'B' } = {};
    primaryLabels.forEach((label, index) => {
      labelMap[label] = index === 0 ? 'A' : 'B';
    });
    
    // Merge less frequent labels into nearest neighbor by time
    for (const labelToMerge of labelsToMerge) {
      const nearestPrimary = this.findNearestPrimaryLabel(labelToMerge, primaryLabels, tokens);
      labelMap[labelToMerge] = labelMap[nearestPrimary] as 'A' | 'B';
    }

    return {
      normalizedTokens: tokens.map(token => ({
        t0: token.start,
        t1: token.end,
        bucket: labelMap[token.speaker_label] as 'A' | 'B',
        text: token.text,
        conf: token.confidence,
        filler: token.filler
      })),
      labelMap
    };
  }

  /**
   * Count frequency of each speaker label
   */
  private static countLabelFrequency(tokens: Array<{ speaker_label: string }>): { [label: string]: number } {
    const counts: { [label: string]: number } = {};
    for (const token of tokens) {
      counts[token.speaker_label] = (counts[token.speaker_label] || 0) + 1;
    }
    return counts;
  }

  /**
   * Find the nearest primary label by time adjacency
   */
  private static findNearestPrimaryLabel(
    labelToMerge: string,
    primaryLabels: string[],
    tokens: Array<{ speaker_label: string; start: number; end: number }>
  ): string {
    const labelTokens = tokens.filter(t => t.speaker_label === labelToMerge);
    if (labelTokens.length === 0) return primaryLabels[0] || '';

    // Find the primary label with the closest time proximity
    let nearestPrimary = primaryLabels[0] || '';
    let minDistance = Infinity;

    for (const primaryLabel of primaryLabels) {
      const primaryTokens = tokens.filter(t => t.speaker_label === primaryLabel);
      
      for (const labelToken of labelTokens) {
        for (const primaryToken of primaryTokens) {
          const distance = Math.min(
            Math.abs(labelToken.start - primaryToken.end),
            Math.abs(primaryToken.start - labelToken.end)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestPrimary = primaryLabel;
          }
        }
      }
    }

    return nearestPrimary;
  }
}
