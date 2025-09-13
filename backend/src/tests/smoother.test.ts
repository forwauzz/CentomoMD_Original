/**
 * Unit tests for Smoother
 */

import { Smoother } from '../services/pipeline/smoother.js';
import { NormalizedItem } from '../services/pipeline/speakerNormalizer.js';

describe('Smoother', () => {
  describe('smooth', () => {
    it('should handle empty items', () => {
      const result = Smoother.smooth([]);
      
      expect(result.segments).toEqual([]);
      expect(result.smoothing).toEqual({
        flipsBefore: 0,
        flipsAfter: 0,
        merged: 0,
        crumbsAbsorbed: 0
      });
    });

    it('should apply windowed majority vote to reduce rapid flips', () => {
      const items: NormalizedItem[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello', conf: 0.9, filler: false },
        { t0: 1, t1: 2, bucket: 'B', text: 'Hi there', conf: 0.8, filler: false },
        { t0: 2, t1: 3, bucket: 'A', text: 'How are you', conf: 0.9, filler: false },
        { t0: 3, t1: 4, bucket: 'B', text: 'I am fine', conf: 0.8, filler: false },
        { t0: 4, t1: 5, bucket: 'A', text: 'That is good', conf: 0.9, filler: false }
      ];

      const result = Smoother.smooth(items);

      expect(result.segments.length).toBeLessThanOrEqual(items.length);
      expect(result.smoothing.flipsAfter).toBeLessThanOrEqual(result.smoothing.flipsBefore);
    });

    it('should merge adjacent same-bucket segments', () => {
      const items: NormalizedItem[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello', conf: 0.9, filler: false },
        { t0: 1.1, t1: 2, bucket: 'A', text: 'there', conf: 0.8, filler: false },
        { t0: 2.5, t1: 3, bucket: 'B', text: 'Hi', conf: 0.9, filler: false }
      ];

      const result = Smoother.smooth(items);

      expect(result.segments.length).toBeLessThan(items.length);
      expect(result.smoothing.merged).toBeGreaterThan(0);
    });

    it('should absorb short segments (crumbs)', () => {
      const items: NormalizedItem[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello', conf: 0.9, filler: false },
        { t0: 1, t1: 1.2, bucket: 'B', text: 'um', conf: 0.8, filler: true }, // Short segment
        { t0: 1.3, t1: 2.3, bucket: 'A', text: 'How are you', conf: 0.9, filler: false }
      ];

      const result = Smoother.smooth(items);

      expect(result.smoothing.crumbsAbsorbed).toBeGreaterThan(0);
    });

    it('should enforce minimum hold time', () => {
      const items: NormalizedItem[] = [
        { t0: 0, t1: 0.5, bucket: 'A', text: 'Hello', conf: 0.9, filler: false },
        { t0: 0.6, t1: 1.0, bucket: 'B', text: 'Hi', conf: 0.8, filler: false },
        { t0: 1.1, t1: 1.5, bucket: 'A', text: 'How are you', conf: 0.9, filler: false }
      ];

      const result = Smoother.smooth(items);

      // Should have fewer flips due to minimum hold time
      expect(result.smoothing.flipsAfter).toBeLessThanOrEqual(result.smoothing.flipsBefore);
    });

    it('should handle single item', () => {
      const items: NormalizedItem[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello', conf: 0.9, filler: false }
      ];

      const result = Smoother.smooth(items);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].bucket).toBe('A');
      expect(result.segments[0].text).toBe('Hello');
    });
  });

  describe('cleanDisfluencies', () => {
    it('should clean English fillers', () => {
      const text = 'Hello um uh like how are you';
      const result = Smoother.cleanDisfluencies(text, 'en');
      
      expect(result).toBe('Hello um how are you');
    });

    it('should clean French fillers', () => {
      const text = 'Bonjour euh heu comment allez-vous';
      const result = Smoother.cleanDisfluencies(text, 'fr');
      
      expect(result).toBe('Bonjour euh comment allez-vous');
    });

    it('should handle text with no fillers', () => {
      const text = 'Hello how are you today';
      const result = Smoother.cleanDisfluencies(text, 'en');
      
      expect(result).toBe('Hello how are you today');
    });

    it('should handle empty text', () => {
      const result = Smoother.cleanDisfluencies('', 'en');
      
      expect(result).toBe('');
    });
  });
});
