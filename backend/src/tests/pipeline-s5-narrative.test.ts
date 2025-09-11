import { describe, it, expect, beforeEach } from 'vitest';
import { S5Narrative } from '../services/pipeline/stages/s5_narrative.js';
import { CleanedDialog } from '../types/ir.js';

describe('S5: Narrative Generation', () => {
  let s5Narrative: S5Narrative;

  beforeEach(() => {
    s5Narrative = new S5Narrative();
  });

  describe('Single Block Format', () => {
    it('should generate single block for single speaker', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'je souffre de douleur',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('single_block');
      expect(result.data!.content).toBe('Je souffre de douleur.');
    });

    it('should handle multiple turns from single speaker', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 3.0,
            endTime: 5.0,
            text: 'je souffre de douleur',
            confidence: 0.8,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 2,
          cleanedTurnCount: 2,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('single_block');
      expect(result.data!.content).toBe('Bonjour docteur.\nJe souffre de douleur.');
    });
  });

  describe('Role Prefixed Format', () => {
    it('should generate role prefixed format for multiple speakers', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            role: 'CLINICIAN',
            startTime: 3.0,
            endTime: 5.0,
            text: 'comment allez-vous',
            confidence: 0.8,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 2,
          cleanedTurnCount: 2,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('role_prefixed');
      expect(result.data!.content).toBe('PATIENT: Bonjour docteur.\nCLINICIAN: Comment allez-vous.');
    });

    it('should handle multiple turns from different speakers', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            role: 'CLINICIAN',
            startTime: 3.0,
            endTime: 5.0,
            text: 'comment allez-vous',
            confidence: 0.8,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 6.0,
            endTime: 8.0,
            text: 'je vais bien',
            confidence: 0.85,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 3,
          cleanedTurnCount: 3,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('role_prefixed');
      expect(result.data!.content).toBe(
        'PATIENT: Bonjour.\nCLINICIAN: Comment allez-vous.\nPATIENT: Je vais bien.'
      );
    });
  });

  describe('Text Formatting', () => {
    it('should capitalize first letter of each turn', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.content).toBe('Bonjour docteur.');
    });

    it('should add period if no sentence ending', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.content).toBe('Bonjour docteur.');
    });

    it('should not add period if already has sentence ending', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur!',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.content).toBe('Bonjour docteur!');
    });

    it('should handle text wrapping for long lines', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'this is a very long sentence that should be wrapped when it exceeds the maximum line length',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.content).toContain('\n');
      expect(result.data!.content.split('\n').every(line => line.length <= 80)).toBe(true);
    });
  });

  describe('Metadata Calculation', () => {
    it('should calculate correct metadata for single speaker', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toEqual({
        totalSpeakers: 1,
        patientTurns: 1,
        clinicianTurns: 0,
        totalDuration: 2.0,
        wordCount: 2
      });
    });

    it('should calculate correct metadata for multiple speakers', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour docteur',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            role: 'CLINICIAN',
            startTime: 3.0,
            endTime: 5.0,
            text: 'comment allez-vous',
            confidence: 0.8,
            isPartial: false
          },
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 6.0,
            endTime: 8.0,
            text: 'je vais bien',
            confidence: 0.85,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 3,
          cleanedTurnCount: 3,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toEqual({
        totalSpeakers: 2,
        patientTurns: 2,
        clinicianTurns: 1,
        totalDuration: 8.0,
        wordCount: 7 // bonjour + docteur + comment + allez-vous + je + vais + bien
      });
    });

    it('should handle empty dialog', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [],
        profile: 'default',
        metadata: {
          originalTurnCount: 0,
          cleanedTurnCount: 0,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.metadata).toEqual({
        totalSpeakers: 0,
        patientTurns: 0,
        clinicianTurns: 0,
        totalDuration: 0,
        wordCount: 0
      });
    });
  });

  describe('Format Determination', () => {
    it('should use single_block for single speaker', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour',
            confidence: 0.9,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 1,
          cleanedTurnCount: 1,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('single_block');
    });

    it('should use role_prefixed for multiple speakers', async () => {
      const cleanedDialog: CleanedDialog = {
        turns: [
          {
            speaker: 'spk_0',
            role: 'PATIENT',
            startTime: 0.0,
            endTime: 2.0,
            text: 'bonjour',
            confidence: 0.9,
            isPartial: false
          },
          {
            speaker: 'spk_1',
            role: 'CLINICIAN',
            startTime: 3.0,
            endTime: 5.0,
            text: 'comment allez-vous',
            confidence: 0.8,
            isPartial: false
          }
        ],
        profile: 'default',
        metadata: {
          originalTurnCount: 2,
          cleanedTurnCount: 2,
          removedFillers: 0,
          removedRepetitions: 0
        }
      };

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(true);
      expect(result.data!.format).toBe('role_prefixed');
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Create invalid dialog to trigger error
      const cleanedDialog = null as any;

      const result = await s5Narrative.execute(cleanedDialog);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error in S5 narrative');
    });
  });
});
