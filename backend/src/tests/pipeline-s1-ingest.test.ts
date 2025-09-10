import { describe, it, expect, beforeEach } from 'vitest';
import { S1IngestAWS } from '../services/pipeline/stages/s1_ingest_aws.js';
import { AWSTranscribeResult } from '../types/ir.js';

describe('S1: Ingest AWS Transcribe JSON', () => {
  let s1Ingest: S1IngestAWS;

  beforeEach(() => {
    s1Ingest = new S1IngestAWS();
  });

  describe('Valid AWS Result Processing', () => {
    it('should parse AWS result with speaker labels and transcript items', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.5',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '1.0',
                  speaker_label: 'spk_0'
                },
                {
                  start_time: '1.0',
                  end_time: '2.5',
                  speaker_label: 'spk_0'
                }
              ]
            },
            {
              start_time: '3.0',
              end_time: '5.0',
              speaker_label: 'spk_1',
              items: [
                {
                  start_time: '3.0',
                  end_time: '5.0',
                  speaker_label: 'spk_1'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.0',
              alternatives: [{ confidence: '0.95', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              start_time: '1.0',
              end_time: '2.5',
              alternatives: [{ confidence: '0.88', content: 'docteur' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: '.' }],
              type: 'punctuation'
            },
            {
              start_time: '3.0',
              end_time: '5.0',
              alternatives: [{ confidence: '0.92', content: 'Comment' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: '?' }],
              type: 'punctuation'
            }
          ]
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.turns).toHaveLength(2);
      expect(result.data!.turns[0]).toEqual({
        speaker: 'spk_0',
        startTime: 0.0,
        endTime: 2.5,
        text: 'Bonjour docteur.',
        confidence: expect.any(Number),
        isPartial: false
      });
      expect(result.data!.turns[1]).toEqual({
        speaker: 'spk_1',
        startTime: 3.0,
        endTime: 5.0,
        text: 'Comment?',
        confidence: expect.any(Number),
        isPartial: false
      });
      expect(result.data!.metadata.speakerCount).toBe(2);
      expect(result.data!.metadata.totalDuration).toBe(5.0);
    });

    it('should handle single speaker correctly', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '3.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '3.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.90', content: 'Je' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ' ' }],
              type: 'punctuation'
            },
            {
              start_time: '1.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.85', content: 'souffre' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(1);
      expect(result.data!.turns[0].speaker).toBe('spk_0');
      expect(result.data!.turns[0].text).toBe('Je souffre');
      expect(result.data!.metadata.speakerCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should fail with missing speaker_labels', async () => {
      const awsResult: AWSTranscribeResult = {
        results: {
          items: []
        }
      } as any;

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing speaker_labels');
    });

    it('should fail with missing results', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: []
        }
      } as any;

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing speaker_labels or results');
    });

    it('should handle empty segments gracefully', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: []
        },
        results: {
          items: []
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(0);
      expect(result.data!.metadata.speakerCount).toBe(0);
      expect(result.data!.metadata.totalDuration).toBe(0);
    });
  });

  describe('Text Processing', () => {
    it('should correctly combine pronunciation and punctuation items', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '1.0',
                  speaker_label: 'spk_0'
                },
                {
                  start_time: '1.0',
                  end_time: '2.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.0',
              alternatives: [{ confidence: '0.95', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ',' }],
              type: 'punctuation'
            },
            {
              start_time: '1.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.88', content: 'docteur' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: '.' }],
              type: 'punctuation'
            }
          ]
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour,docteur.');
    });

    it('should calculate confidence correctly', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '1.0',
                  speaker_label: 'spk_0'
                },
                {
                  start_time: '1.0',
                  end_time: '2.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.0',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              start_time: '1.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.80', content: 'docteur' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      // Should be weighted average: (0.90 * 1.0 + 0.80 * 1.0) / 2.0 = 0.85
      expect(result.data!.turns[0].confidence).toBeCloseTo(0.85, 2);
    });
  });

  describe('Metadata Generation', () => {
    it('should generate correct metadata', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [{ start_time: '0.0', end_time: '2.0', speaker_label: 'spk_0' }]
            },
            {
              start_time: '3.0',
              end_time: '5.0',
              speaker_label: 'spk_1',
              items: [{ start_time: '3.0', end_time: '5.0', speaker_label: 'spk_1' }]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              start_time: '3.0',
              end_time: '5.0',
              alternatives: [{ confidence: '0.85', content: 'Comment' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await s1Ingest.execute(awsResult);

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toEqual({
        source: 'aws_transcribe',
        language: 'fr-CA',
        totalDuration: 5.0,
        speakerCount: 2,
        createdAt: expect.any(Date)
      });
    });
  });
});
