/**
 * Unit tests for SpeakerNormalizer
 */

import { SpeakerNormalizer } from '../services/pipeline/speakerNormalizer.js';

describe('SpeakerNormalizer', () => {
  describe('normalize', () => {
    it('should handle empty AWS result', () => {
      const result = SpeakerNormalizer.normalize(null);
      
      expect(result.items).toEqual([]);
      expect(result.map).toEqual({});
      expect(result.stats).toEqual({
        uniqueBefore: 0,
        uniqueAfter: 0,
        droppedLowConf: 0
      });
    });

    it('should normalize simple 2-speaker case (0/1 → A/B)', () => {
      const awsResult = {
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.0',
              alternatives: [{ content: 'Hello', confidence: '0.9' }],
              speaker_label: 'spk_0'
            },
            {
              start_time: '1.0',
              end_time: '2.0',
              alternatives: [{ content: 'Hi there', confidence: '0.8' }],
              speaker_label: 'spk_1'
            }
          ]
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].bucket).toBe('A');
      expect(result.items[1].bucket).toBe('B');
      expect(result.map).toEqual({
        'spk_0': 'A',
        'spk_1': 'B'
      });
      expect(result.stats.uniqueBefore).toBe(2);
      expect(result.stats.uniqueAfter).toBe(2);
    });

    it('should collapse multiple speakers to 2 buckets (0/1/2/5 → A/B)', () => {
      const awsResult = {
        results: {
          items: [
            { start_time: '0.0', end_time: '1.0', alternatives: [{ content: 'Speaker 0', confidence: '0.9' }], speaker_label: 'spk_0' },
            { start_time: '1.0', end_time: '2.0', alternatives: [{ content: 'Speaker 1', confidence: '0.8' }], speaker_label: 'spk_1' },
            { start_time: '2.0', end_time: '3.0', alternatives: [{ content: 'Speaker 2', confidence: '0.7' }], speaker_label: 'spk_2' },
            { start_time: '3.0', end_time: '4.0', alternatives: [{ content: 'Speaker 5', confidence: '0.6' }], speaker_label: 'spk_5' }
          ]
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(4);
      expect(result.stats.uniqueBefore).toBe(4);
      expect(result.stats.uniqueAfter).toBe(2);
      expect(result.stats.droppedLowConf).toBe(0);
      
      // All items should be mapped to either A or B
      const buckets = new Set(result.items.map(item => item.bucket));
      expect(buckets.size).toBe(2);
      expect(buckets.has('A')).toBe(true);
      expect(buckets.has('B')).toBe(true);
    });

    it('should filter low confidence tokens (< 0.5)', () => {
      const awsResult = {
        results: {
          items: [
            { start_time: '0.0', end_time: '1.0', alternatives: [{ content: 'High confidence', confidence: '0.9' }], speaker_label: 'spk_0' },
            { start_time: '1.0', end_time: '2.0', alternatives: [{ content: 'Low confidence', confidence: '0.3' }], speaker_label: 'spk_1' },
            { start_time: '2.0', end_time: '3.0', alternatives: [{ content: 'Medium confidence', confidence: '0.6' }], speaker_label: 'spk_0' }
          ]
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.conf >= 0.5)).toBe(true);
    });

    it('should merge contiguous same-speaker tokens', () => {
      const awsResult = {
        results: {
          items: [
            { start_time: '0.0', end_time: '1.0', alternatives: [{ content: 'Hello', confidence: '0.9' }], speaker_label: 'spk_0' },
            { start_time: '1.0', end_time: '2.0', alternatives: [{ content: 'there', confidence: '0.8' }], speaker_label: 'spk_0' },
            { start_time: '2.5', end_time: '3.0', alternatives: [{ content: 'How are you', confidence: '0.7' }], speaker_label: 'spk_1' }
          ]
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].text).toBe('Hello there');
      expect(result.items[0].t1).toBe(2.0);
      expect(result.items[1].text).toBe('How are you');
    });

    it('should handle speaker_labels from segments', () => {
      const awsResult = {
        results: {
          speaker_labels: {
            segments: [
              {
                items: [
                  { start_time: '0.0', end_time: '1.0', content: 'Hello', confidence: '0.9', speaker_label: 'spk_0' },
                  { start_time: '1.0', end_time: '2.0', content: 'Hi there', confidence: '0.8', speaker_label: 'spk_1' }
                ]
              }
            ]
          }
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].bucket).toBe('A');
      expect(result.items[1].bucket).toBe('B');
    });

    it('should handle stray one-word items', () => {
      const awsResult = {
        results: {
          items: [
            { start_time: '0.0', end_time: '1.0', alternatives: [{ content: 'Hello', confidence: '0.9' }], speaker_label: 'spk_0' },
            { start_time: '1.0', end_time: '2.0', alternatives: [{ content: 'Hi', confidence: '0.8' }], speaker_label: 'spk_1' },
            { start_time: '2.0', end_time: '3.0', alternatives: [{ content: 'Yes', confidence: '0.7' }], speaker_label: 'spk_2' },
            { start_time: '3.0', end_time: '4.0', alternatives: [{ content: 'No', confidence: '0.6' }], speaker_label: 'spk_3' }
          ]
        }
      };

      const result = SpeakerNormalizer.normalize(awsResult);

      expect(result.items).toHaveLength(4);
      expect(result.stats.uniqueBefore).toBe(4);
      expect(result.stats.uniqueAfter).toBe(2);
      expect(result.stats.droppedLowConf).toBe(0);
    });
  });
});
