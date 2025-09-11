import { describe, it, expect, beforeEach } from 'vitest';
import { S4Cleanup } from '../services/pipeline/stages/s4_cleanup.js';
import { IrDialog, RoleMap } from '../types/ir.js';

describe('S4: Cleanup', () => {
  let s4Cleanup: S4Cleanup;

  beforeEach(() => {
    s4Cleanup = new S4Cleanup();
  });

  describe('Robust Filler Removal', () => {
    it('should remove French fillers correctly', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh, ben alors, voilà, donc comment allez-vous?',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('voilà, comment allez-vous?');
    });

    it('should remove English fillers correctly', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Um, uh, er, ah, mm, hmm, like, how are you?',
            confidence: 0.9,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'en-US',
          totalDuration: 2.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('how are you?');
    });

    it('should remove repeated fillers', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh euh euh, um um um, comment allez-vous?',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('comment allez-vous?');
    });
  });

  describe('Default Profile', () => {
    it('should remove fillers and normalize spacing', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh, bonjour    docteur,   euh comment allez-vous?',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(1);
      expect(result.data!.turns[0].text).toBe('bonjour docteur, comment allez-vous?');
      expect(result.data!.turns[0].role).toBe('PATIENT');
      expect(result.data!.profile).toBe('default');
    });

    it('should remove repetitions', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je je souffre de douleur douleur',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Je je souffre de');
    });

    it('should handle English fillers', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Um, hello doctor, um how are you?',
            confidence: 0.9,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'en-US',
          totalDuration: 2.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('hello doctor, how are you?');
    });
  });

  describe('Clinical Light Profile', () => {
    it('should preserve medical terms and numbers', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je prends 50mg de médicament médicament',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'clinical_light');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Je prends 50mg de médicament médicament');
      expect(result.data!.profile).toBe('clinical_light');
    });

    it('should still remove fillers but preserve repetitions', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh, je je souffre de douleur douleur',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'clinical_light');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('je je souffre de douleur douleur');
    });
  });

  describe('Medical Token Preservation', () => {
    it('should preserve medical abbreviations like Dr. and NSAIDs', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Dr. Smith prescribed NSAIDs for the pain',
            confidence: 0.9,
            isPartial: false
          }
        ],
        metadata: {
          source: 'aws_transcribe',
          language: 'en-US',
          totalDuration: 2.0,
          speakerCount: 1,
          createdAt: new Date()
        }
      };

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Dr. Smith prescribed NSAIDs for the pain');
    });

    it('should preserve medical terms in clinical_light profile', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Je prends 50mg de médicament médicament',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'clinical_light');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Je prends 50mg de médicament médicament');
    });
  });

  describe('Text Normalization', () => {
    it('should normalize spacing correctly', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour   ,   docteur   .   Comment   ?',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour, docteur. Comment?');
    });

    it('should handle punctuation spacing', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Bonjour , docteur . Comment ?',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].text).toBe('Bonjour, docteur. Comment?');
    });
  });

  describe('Role Assignment', () => {
    it('should assign roles correctly from role map', async () => {
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(2);
      expect(result.data!.turns[0].role).toBe('PATIENT');
      expect(result.data!.turns[1].role).toBe('CLINICIAN');
    });

    it('should default to PATIENT for unmapped speakers', async () => {
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

      const roleMap: RoleMap = {}; // Empty role map

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns[0].role).toBe('PATIENT');
    });
  });

  describe('Metadata Generation', () => {
    it('should generate correct metadata', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh, bonjour bonjour docteur',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toEqual({
        originalTurnCount: 1,
        cleanedTurnCount: 1,
        removedFillers: expect.any(Number),
        removedRepetitions: expect.any(Number)
      });
    });
  });

  describe('Empty Turn Filtering', () => {
    it('should remove turns with empty text after cleanup', async () => {
      const dialog: IrDialog = {
        turns: [
          {
            speaker: 'spk_0',
            startTime: 0.0,
            endTime: 2.0,
            text: 'Euh, euh, euh',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            startTime: 3.0,
            endTime: 5.0,
            text: 'Bonjour docteur',
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT',
        'spk_1': 'CLINICIAN'
      };

      const result = await s4Cleanup.execute(dialog, roleMap, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.turns).toHaveLength(1);
      expect(result.data!.turns[0].speaker).toBe('spk_1');
      expect(result.data!.turns[0].text).toBe('Bonjour docteur');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid profile gracefully', async () => {
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

      const roleMap: RoleMap = {
        'spk_0': 'PATIENT'
      };

      // @ts-ignore - Testing invalid profile
      const result = await s4Cleanup.execute(dialog, roleMap, 'invalid_profile');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid cleanup profile');
    });
  });
});
