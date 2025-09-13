/**
 * Temporal Smoother for Speaker Diarization
 * 
 * Applies temporal smoothing to reduce rapid speaker changes and merge
 * adjacent segments with small gaps. Includes disfluency cleanup.
 */

import { NormalizedItem } from './speakerNormalizer.js';

export interface SmoothedSegment {
  t0: number;
  t1: number;
  bucket: 'A' | 'B';
  text: string;
}

export interface SmoothingResult {
  segments: SmoothedSegment[];
  smoothing: {
    flipsBefore: number;
    flipsAfter: number;
    merged: number;
    crumbsAbsorbed: number;
  };
}

export class Smoother {
  // Configuration constants
  private static readonly WINDOW = 1.0; // sliding window for majority vote
  private static readonly MIN_HOLD = 1.2; // minimum time to hold a bucket assignment
  private static readonly MERGE_GAP = 0.35; // merge segments with gaps smaller than this
  private static readonly MIN_SEG = 0.30; // absorb segments shorter than this
  private static readonly FILLER_DROP = true; // drop short filler-only segments

  /**
   * Apply temporal smoothing to normalized items
   */
  static smooth(items: NormalizedItem[]): SmoothingResult {
    if (items.length === 0) {
      return {
        segments: [],
        smoothing: { flipsBefore: 0, flipsAfter: 0, merged: 0, crumbsAbsorbed: 0 }
      };
    }

    // Count initial flips
    const flipsBefore = this.countFlips(items);

    // Apply windowed majority vote
    const windowedItems = this.applyWindowedMajorityVote(items);

    // Apply minimum hold time with hysteresis
    const stableItems = this.applyMinimumHold(windowedItems);

    // Merge adjacent same-bucket segments
    const mergedSegments = this.mergeAdjacentSegments(stableItems);

    // Absorb short segments (crumbs)
    const finalSegments = this.absorbCrumbs(mergedSegments);

    // Count final flips
    const flipsAfter = this.countFlips(finalSegments);

    return {
      segments: finalSegments,
      smoothing: {
        flipsBefore,
        flipsAfter,
        merged: items.length - finalSegments.length,
        crumbsAbsorbed: mergedSegments.length - finalSegments.length
      }
    };
  }

  /**
   * Apply windowed majority vote to smooth bucket assignments
   */
  private static applyWindowedMajorityVote(items: NormalizedItem[]): NormalizedItem[] {
    const smoothed: NormalizedItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const windowStart = item.t0 - this.WINDOW / 2;
      const windowEnd = item.t0 + this.WINDOW / 2;

      // Find items in the window
      const windowItems = items.filter(it => 
        it.t0 >= windowStart && it.t0 <= windowEnd
      );

      // Count bucket frequencies in window
      const bucketCounts = { A: 0, B: 0 };
      windowItems.forEach(it => {
        bucketCounts[it.bucket]++;
      });

      // Assign majority bucket
      const majorityBucket = bucketCounts.A >= bucketCounts.B ? 'A' : 'B';

      smoothed.push({
        ...item,
        bucket: majorityBucket
      });
    }

    return smoothed;
  }

  /**
   * Apply minimum hold time with hysteresis to prevent rapid flips
   */
  private static applyMinimumHold(items: NormalizedItem[]): NormalizedItem[] {
    if (items.length === 0) return [];

    const stable: NormalizedItem[] = [];
    let currentBucket = items[0].bucket;
    let lastFlipTime = items[0].t0;

    for (const item of items) {
      // If bucket changed, check if enough time has passed
      if (item.bucket !== currentBucket) {
        const timeSinceLastFlip = item.t0 - lastFlipTime;
        
        if (timeSinceLastFlip >= this.MIN_HOLD) {
          // Enough time passed, allow the flip
          currentBucket = item.bucket;
          lastFlipTime = item.t0;
        }
        // Otherwise, keep the previous bucket
      }

      stable.push({
        ...item,
        bucket: currentBucket
      });
    }

    return stable;
  }

  /**
   * Merge adjacent segments with the same bucket
   */
  private static mergeAdjacentSegments(items: NormalizedItem[]): SmoothedSegment[] {
    if (items.length === 0) return [];

    const segments: SmoothedSegment[] = [];
    let current = {
      t0: items[0].t0,
      t1: items[0].t1,
      bucket: items[0].bucket,
      text: items[0].text
    };

    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const gap = item.t0 - current.t1;

      // If same bucket and gap is small, merge
      if (item.bucket === current.bucket && gap <= this.MERGE_GAP) {
        current.t1 = item.t1;
        current.text += ' ' + item.text;
      } else {
        // Different bucket or large gap, start new segment
        segments.push({ ...current });
        current = {
          t0: item.t0,
          t1: item.t1,
          bucket: item.bucket,
          text: item.text
        };
      }
    }

    segments.push(current);
    return segments;
  }

  /**
   * Absorb short segments (crumbs) into neighbors
   */
  private static absorbCrumbs(segments: SmoothedSegment[]): SmoothedSegment[] {
    if (segments.length <= 1) return segments;

    const result: SmoothedSegment[] = [];
    let i = 0;

    while (i < segments.length) {
      const segment = segments[i];
      const duration = segment.t1 - segment.t0;

      // If segment is too short, try to absorb it
      if (duration < this.MIN_SEG) {
        const prevSegment = result[result.length - 1];
        const nextSegment = segments[i + 1];

        if (prevSegment && nextSegment) {
          // Both neighbors exist, choose the closer one
          const distToPrev = segment.t0 - prevSegment.t1;
          const distToNext = nextSegment.t0 - segment.t1;

          if (distToPrev <= distToNext) {
            // Absorb into previous
            prevSegment.t1 = segment.t1;
            prevSegment.text += ' ' + segment.text;
          } else {
            // Absorb into next
            nextSegment.t0 = segment.t0;
            nextSegment.text = segment.text + ' ' + nextSegment.text;
          }
        } else if (prevSegment) {
          // Only previous neighbor, absorb into it
          prevSegment.t1 = segment.t1;
          prevSegment.text += ' ' + segment.text;
        } else if (nextSegment) {
          // Only next neighbor, absorb into it
          nextSegment.t0 = segment.t0;
          nextSegment.text = segment.text + ' ' + nextSegment.text;
        } else {
          // No neighbors, keep the segment
          result.push(segment);
        }
      } else {
        // Segment is long enough, keep it
        result.push(segment);
      }

      i++;
    }

    return result;
  }

  /**
   * Count the number of bucket flips in a sequence
   */
  private static countFlips(items: Array<{ bucket: 'A' | 'B' }>): number {
    if (items.length <= 1) return 0;

    let flips = 0;
    for (let i = 1; i < items.length; i++) {
      if (items[i].bucket !== items[i - 1].bucket) {
        flips++;
      }
    }
    return flips;
  }

  /**
   * Clean disfluencies from text
   */
  static cleanDisfluencies(text: string, language: 'fr' | 'en'): string {
    const FILLERS_EN = /^(uh|um|mmm|er|ah|like)$/i;
    const FILLERS_FR = /^(euh|heu|ben|bah|alors|hum)$/i;
    
    const fillers = language === 'fr' ? FILLERS_FR : FILLERS_EN;
    
    // Split into words and filter out repeated fillers
    const words = text.split(/\s+/);
    const cleaned: string[] = [];
    let fillerCount = 0;

    for (const word of words) {
      if (fillers.test(word)) {
        fillerCount++;
        // Only keep one filler if there are multiple consecutive ones
        if (fillerCount === 1) {
          cleaned.push(word);
        }
      } else {
        fillerCount = 0;
        cleaned.push(word);
      }
    }

    return cleaned.join(' ').replace(/\s+/g, ' ').trim();
  }
}
