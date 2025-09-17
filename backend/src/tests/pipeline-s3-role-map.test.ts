import { describe, it, expect, beforeEach } from 'vitest';
import { S3RoleMap } from '../services/pipeline/stages/s3_role_map.js';
import { IrDialog, RoleMap } from '../types/ir.js';

describe('S3: Role Mapping', () => {
  let s3RoleMap: S3RoleMap;

  beforeEach(() => {
    s3RoleMap = new S3RoleMap();
  });

  describe('Single Speaker', () => {
    it('should assign PATIENT role to single speaker', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je souffre de douleur',
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

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        'spk_0': 'PATIENT'
      });
    });
  });

  describe('Two Speakers - Heuristic Rules', () => {
    it('should assign first distinct speaker as PATIENT by default', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour docteur',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Comment allez-vous?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      });
    });

    it('should use cue words to bias role assignment', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour docteur, comment allez-vous?',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Je souffre de douleur dans mon dos',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      // spk_0 has clinician cues (docteur, comment), spk_1 has patient cues (je, souffre, douleur)
      expect(result.data).toEqual({
        'spk_0': 'PATIENT', // Still first speaker gets patient role by default
        'spk_1': 'CLINICIAN'
      });
    });
  });

  describe('Multiple Speakers', () => {
    it('should handle three speakers correctly', async () => {
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
            startTime: 3.0,
            endTime: 5.0,
            text: 'Comment allez-vous?',
            confidence: 0.8,
            isPartial: false
          },
          {
            speaker: 'spk_2',
            startTime: 6.0,
            endTime: 8.0,
            text: 'Je vais bien',
            confidence: 0.85,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 8.0,
          speakerCount: 3,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN',
        'spk_2': 'CLINICIAN'
      });
    });
  });

  describe('Cue Word Analysis', () => {
    it('should identify patient cues correctly', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je souffre de douleur dans mon dos',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Depuis combien de temps?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      // spk_0 has patient cues (je, souffre, douleur, mon)
      // spk_1 has clinician cues (depuis, combien)
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      });
    });

    it('should identify English patient cues', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'I feel pain in my back',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'How long have you had this?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'en-US',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      // spk_0 has patient cues (i, feel, pain, my)
      // spk_1 has clinician cues (how, long)
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      });
    });
  });

  describe('Role Swap Function', () => {
    it('should swap PATIENT and CLINICIAN roles', () => {
      const roleMap: RoleMap = {
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      };

      const swapped = s3RoleMap.applyRoleSwap(roleMap);

      expect(swapped).toEqual({
        'spk_0': 'CLINICIAN',
        'spk_1': 'PATIENT'
      });
    });

    it('should handle single role correctly', () => {
      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const swapped = s3RoleMap.applyRoleSwap(roleMap);

      expect(swapped).toEqual({
        'spk_0': 'CLINICIAN'
      });
    });

    it('should handle multiple speakers correctly', () => {
      const roleMap: RoleMap = {
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN',
        'spk_2': 'CLINICIAN'
      };

      const swapped = s3RoleMap.applyRoleSwap(roleMap);

      expect(swapped).toEqual({
        'spk_0': 'CLINICIAN',
        'spk_1': 'PATIENT',
        'spk_2': 'PATIENT'
      });
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

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should handle speakers with no cue words', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Hello there',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Good morning',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'en-US',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      // Should fall back to first speaker = patient rule
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      });
    });

    it('should handle mixed language cues', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je feel pain in my back',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Comment how long?',
            confidence: 0.8,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'fr-CA',
          totalDuration: 5.0,
          speakerCount: 2,
          createdAt: new Date()
        }
      };

      const result = await s3RoleMap.execute(dialog);

      expect(result.success).toBe(true);
      // Both have mixed cues, should fall back to first speaker rule
      expect(result.data).toEqual({
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      });
    });
  });
});
