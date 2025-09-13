/**
 * Unit tests for TurnBuilder
 */

import { TurnBuilder } from '../services/pipeline/turnBuilder.js';
import { SmoothedSegment } from '../services/pipeline/smoother.js';
import { RoleMappingResult } from '../services/pipeline/roleMapper.js';

describe('TurnBuilder', () => {
  describe('buildTurns', () => {
    it('should handle empty segments', () => {
      const segments: SmoothedSegment[] = [];
      const roleMapping: RoleMappingResult = {
        roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
        roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
        confidence: 0.8,
        features: {
          questionRatioA: 0.5,
          questionRatioB: 0.2,
          selfReportRatioA: 0.1,
          selfReportRatioB: 0.6,
          startsFirstA: 1,
          talkShareA: 0.6,
          talkShareB: 0.4
        }
      };

      const result = TurnBuilder.buildTurns(segments, roleMapping, 'en');

      expect(result.turns).toEqual([]);
      expect(result.stats).toEqual({
        totalTurns: 0,
        clinicianTurns: 0,
        patientTurns: 0,
        totalDuration: 0
      });
    });

    it('should build turns with role changes', () => {
      const segments: SmoothedSegment[] = [
        { t0: 0, t1: 2, bucket: 'A', text: 'Hello, how are you feeling today?' },
        { t0: 2.5, t1: 4, bucket: 'B', text: 'I have been having some pain in my back' },
        { t0: 4.5, t1: 6, bucket: 'A', text: 'Can you describe the pain for me?' }
      ];

      const roleMapping: RoleMappingResult = {
        roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
        roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
        confidence: 0.8,
        features: {
          questionRatioA: 0.5,
          questionRatioB: 0.2,
          selfReportRatioA: 0.1,
          selfReportRatioB: 0.6,
          startsFirstA: 1,
          talkShareA: 0.6,
          talkShareB: 0.4
        }
      };

      const result = TurnBuilder.buildTurns(segments, roleMapping, 'en');

      expect(result.turns).toHaveLength(3);
      expect(result.turns[0].role).toBe('Clinician');
      expect(result.turns[0].text).toBe('Hello, how are you feeling today?');
      expect(result.turns[1].role).toBe('Patient');
      expect(result.turns[1].text).toBe('I have been having some pain in my back');
      expect(result.turns[2].role).toBe('Clinician');
      expect(result.turns[2].text).toBe('Can you describe the pain for me?');
    });

    it('should merge segments with same bucket and small gaps', () => {
      const segments: SmoothedSegment[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello' },
        { t0: 1.2, t1: 2, bucket: 'A', text: 'how are you' },
        { t0: 2.5, t1: 3, bucket: 'B', text: 'I am fine' }
      ];

      const roleMapping: RoleMappingResult = {
        roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
        roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
        confidence: 0.8,
        features: {
          questionRatioA: 0.5,
          questionRatioB: 0.2,
          selfReportRatioA: 0.1,
          selfReportRatioB: 0.6,
          startsFirstA: 1,
          talkShareA: 0.6,
          talkShareB: 0.4
        }
      };

      const result = TurnBuilder.buildTurns(segments, roleMapping, 'en');

      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].role).toBe('Clinician');
      expect(result.turns[0].text).toBe('Hello how are you');
      expect(result.turns[1].role).toBe('Patient');
      expect(result.turns[1].text).toBe('I am fine');
    });

    it('should start new turn for large time gaps', () => {
      const segments: SmoothedSegment[] = [
        { t0: 0, t1: 1, bucket: 'A', text: 'Hello' },
        { t0: 5, t1: 6, bucket: 'A', text: 'How are you' } // Large gap
      ];

      const roleMapping: RoleMappingResult = {
        roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
        roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
        confidence: 0.8,
        features: {
          questionRatioA: 0.5,
          questionRatioB: 0.2,
          selfReportRatioA: 0.1,
          selfReportRatioB: 0.6,
          startsFirstA: 1,
          talkShareA: 0.6,
          talkShareB: 0.4
        }
      };

      const result = TurnBuilder.buildTurns(segments, roleMapping, 'en');

      expect(result.turns).toHaveLength(2);
      expect(result.turns[0].text).toBe('Hello');
      expect(result.turns[1].text).toBe('How are you');
    });

    it('should use French role labels when language is fr', () => {
      const segments: SmoothedSegment[] = [
        { t0: 0, t1: 2, bucket: 'A', text: 'Bonjour, comment allez-vous?' },
        { t0: 2.5, t1: 4, bucket: 'B', text: 'J\'ai mal au dos' }
      ];

      const roleMapping: RoleMappingResult = {
        roleMap: { A: 'CLINICIAN', B: 'PATIENT' },
        roleMapFr: { A: 'CLINICIEN', B: 'PATIENT' },
        confidence: 0.8,
        features: {
          questionRatioA: 0.5,
          questionRatioB: 0.2,
          selfReportRatioA: 0.1,
          selfReportRatioB: 0.6,
          startsFirstA: 1,
          talkShareA: 0.6,
          talkShareB: 0.4
        }
      };

      const result = TurnBuilder.buildTurns(segments, roleMapping, 'fr');

      expect(result.turns[0].role).toBe('Clinicien');
      expect(result.turns[1].role).toBe('Patient');
    });
  });

  describe('cleanTurnText', () => {
    it('should normalize whitespace', () => {
      const text = 'Hello    world   how   are   you';
      const result = TurnBuilder.cleanTurnText(text);
      
      expect(result).toBe('Hello world how are you');
    });

    it('should fix punctuation spacing', () => {
      const text = 'Hello , how are you ? I am fine .';
      const result = TurnBuilder.cleanTurnText(text);
      
      expect(result).toBe('Hello, how are you? I am fine.');
    });

    it('should handle empty text', () => {
      const result = TurnBuilder.cleanTurnText('');
      
      expect(result).toBe('');
    });
  });

  describe('formatTurnsForDisplay', () => {
    it('should format turns for display', () => {
      const turns = [
        { role: 'Clinician' as const, text: 'Hello, how are you?', t0: 0, t1: 2 },
        { role: 'Patient' as const, text: 'I am fine, thank you.', t0: 2.5, t1: 4 }
      ];

      const result = TurnBuilder.formatTurnsForDisplay(turns);

      expect(result).toBe('Clinician: Hello, how are you?\n\nPatient: I am fine, thank you.');
    });
  });

  describe('getTurnSummary', () => {
    it('should generate turn summary', () => {
      const turns = [
        { role: 'Clinician' as const, text: 'Hello', t0: 0, t1: 2 },
        { role: 'Patient' as const, text: 'Hi', t0: 2.5, t1: 3 },
        { role: 'Clinician' as const, text: 'How are you', t0: 3.5, t1: 5 }
      ];

      const result = TurnBuilder.getTurnSummary(turns);

      expect(result).toContain('Turns: 3');
      expect(result).toContain('2C/1P');
      expect(result).toContain('Duration: 5.0s');
    });
  });
});
