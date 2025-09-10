import { describe, it, expect, beforeEach } from 'vitest';
import { S2Merge } from '../services/pipeline/stages/s2_merge.js';
import { IrDialog, IrTurn } from '../types/ir.js';

describe('S2: Merge Adjacent Turns', () => {
  let s2Merge: S2Merge;

  beforeEach(() => {
    s2Merge = new S2Merge();
  });

  describe('Turn Merging Logic', () => {
    it('should merge adjacent turns from same speaker', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 2.1,
            endTime: 4.0,
            text: 'docteur',
            confidence: 0.8,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 5.0,
            endTime: 7.0,
            text: 'Comment allez-vous?',
            confidence: 0.95,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 7.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(2);
      
      // First turn should be merged
      expect(result.data!.turns[0]).toEqual({
        speaker: 'spk_0',
        startTime: 0.0,
        endTime: 4.0,
        text: 'Bonjour docteur',
        confidence: expect.any(Number),
        isPartial: false
      });
      
      // Second turn should remain unchanged
      expect(result.data!.turns[1]).toEqual({
        speaker: 'spk_1',
        startTime: 5.0,
        endTime: 7.0,
        text: 'Comment allez-vous?',
        confidence: 0.95,
        isPartial: false
      });
    });

    it('should not merge turns from different speakers', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 2.1,
            endTime: 4.0,
            text: 'Comment allez-vous?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 4.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(2);
      expect(result.data!.turns[0].speaker).toBe('spk_0');
      expect(result.data!.turns[1].speaker).toBe('spk_1');
    });

    it('should not merge turns with large time gaps', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 5.0, // Large gap (3 seconds)
            endTime: 7.0,
            text: 'docteur',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 7.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(2);
      expect(result.data!.turns[0].text).toBe('Bonjour');
      expect(result.data!.turns[1].text).toBe('docteur');
    });

    it('should not merge turns that would exceed max duration', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 15.0, // Already long turn
            text: 'This is a very long turn that should not be merged',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 15.1,
            endTime: 17.0,
            text: 'with this',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 17.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(2);
    });
  });

  describe('Text Combination', () => {
    it('should handle punctuation correctly when merging', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour.',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 2.1,
            endTime: 4.0,
            text: 'Comment allez-vous?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 4.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour. Comment allez-vous?');
    });

    it('should handle comma punctuation correctly', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour,',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 2.1,
            endTime: 4.0,
            text: 'docteur',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 4.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour, docteur');
    });

    it('should add space when no punctuation', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 2.1,
            endTime: 4.0,
            text: 'docteur',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 4.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour docteur');
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate weighted average confidence', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 1.0, // 1 second duration
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            startTime: 1.1,
            endTime: 3.1, // 2 seconds duration
            text: 'docteur',
            confidence: 0.6,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 3.1,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      // Weighted average: (0.9 * 1.0 + 0.6 * 2.0) / 3.0 = 0.7
      expect(result.data!.turns[0].confidence).toBeCloseTo(0.7, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dialog', async () => {
      const dialog: IrDialog = {
        turns: [],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 0,
          speakerCount: 0,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(0);
    });

    it('should handle single turn', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 2.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(1);
      expect(result.data!.turns[0].text).toBe('Bonjour');
    });

    it('should preserve isPartial flag', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour',
            confidence: 0.9,
            isPartial: true
          },
          {
            speaker: 'spk_0',
            startTime: 2.1,
            endTime: 4.0,
            text: 'docteur',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 4.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const result = await s2Merge.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].isPartial).toBe(true);
    });
  });
});
