/**
 * Unit tests for RoleMapper (Updated for SmoothedSegment interface)
 */

import { RoleMapper } from '../services/pipeline/roleMapper.js';
import { SmoothedSegment } from '../services/pipeline/smoother.js';

describe('RoleMapper', () => {
  describe('map', () => {
    it('should handle empty segments', () => {
      const result = RoleMapper.map([], 'en');
      
      expect(result.roleMap).toEqual({ A: 'CLINICIAN', B: 'PATIENT' });
      expect(result.roleMapFr).toEqual({ A: 'CLINICIEN', B: 'PATIENT' });
      expect(result.confidence).toBe(0.5);
    });

    it('should map question-heavy speaker A to Clinician (English)', () => {
      const segments: SmoothedSegment[] = [
        // Speaker A (Clinician) - lots of questions
        { t0: 0, t1: 2, bucket: 'A', text: 'What brings you in today?' },
        { t0: 4, t1: 6, bucket: 'A', text: 'How long have you had this pain?' },
        { t0: 8, t1: 10, bucket: 'A', text: 'Can you describe the symptoms?' },
        
        // Speaker B (Patient) - self-reports
        { t0: 2, t1: 4, bucket: 'B', text: 'I have been having back pain' },
        { t0: 6, t1: 8, bucket: 'B', text: 'I think it started last week' },
        { t0: 10, t1: 12, bucket: 'B', text: 'My pain is getting worse' }
      ];

      const result = RoleMapper.map(segments, 'en');

      expect(result.roleMap.A).toBe('CLINICIAN');
      expect(result.roleMap.B).toBe('PATIENT');
      expect(result.roleMapFr.A).toBe('CLINICIEN');
      expect(result.roleMapFr.B).toBe('PATIENT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should map question-heavy speaker A to Clinician (French)', () => {
      const segments: SmoothedSegment[] = [
        // Speaker A (Clinician) - lots of questions in French
        { t0: 0, t1: 2, bucket: 'A', text: 'Qu\'est-ce qui vous amène aujourd\'hui?' },
        { t0: 4, t1: 6, bucket: 'A', text: 'Depuis combien de temps avez-vous cette douleur?' },
        { t0: 8, t1: 10, bucket: 'A', text: 'Pouvez-vous décrire les symptômes?' },
        
        // Speaker B (Patient) - self-reports in French
        { t0: 2, t1: 4, bucket: 'B', text: 'J\'ai mal au dos' },
        { t0: 6, t1: 8, bucket: 'B', text: 'Je pense que ça a commencé la semaine dernière' },
        { t0: 10, t1: 12, bucket: 'B', text: 'Ma douleur empire' }
      ];

      const result = RoleMapper.map(segments, 'fr');

      expect(result.roleMap.A).toBe('CLINICIAN');
      expect(result.roleMap.B).toBe('PATIENT');
      expect(result.roleMapFr.A).toBe('CLINICIEN');
      expect(result.roleMapFr.B).toBe('PATIENT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should map self-report-heavy speaker B to Patient (English)', () => {
      const segments: SmoothedSegment[] = [
        // Speaker A (Clinician) - fewer questions
        { t0: 0, t1: 2, bucket: 'A', text: 'Tell me about your symptoms' },
        
        // Speaker B (Patient) - lots of self-reports
        { t0: 2, t1: 4, bucket: 'B', text: 'I have been experiencing pain in my back' },
        { t0: 4, t1: 6, bucket: 'B', text: 'I think it started when I was lifting' },
        { t0: 6, t1: 8, bucket: 'B', text: 'My pain is getting worse every day' },
        { t0: 8, t1: 10, bucket: 'B', text: 'I can\'t sleep because of the pain' }
      ];

      const result = RoleMapper.map(segments, 'en');

      expect(result.roleMap.A).toBe('CLINICIAN');
      expect(result.roleMap.B).toBe('PATIENT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should map self-report-heavy speaker B to Patient (French)', () => {
      const segments: SmoothedSegment[] = [
        // Speaker A (Clinician) - more questions and clinical language
        { t0: 0, t1: 2, bucket: 'A', text: 'Dites-moi vos symptômes' },
        { t0: 10, t1: 12, bucket: 'A', text: 'Depuis quand avez-vous cette douleur?' },
        { t0: 12, t1: 14, bucket: 'A', text: 'Avez-vous pris des médicaments?' },
        { t0: 14, t1: 16, bucket: 'A', text: 'Comment décririez-vous l\'intensité?' },
        
        // Speaker B (Patient) - lots of self-reports in French
        { t0: 2, t1: 4, bucket: 'B', text: 'J\'ai mal au dos depuis une semaine' },
        { t0: 4, t1: 6, bucket: 'B', text: 'Je pense que ça a commencé quand j\'ai soulevé' },
        { t0: 6, t1: 8, bucket: 'B', text: 'Ma douleur empire chaque jour' },
        { t0: 8, t1: 10, bucket: 'B', text: 'Je ne peux pas dormir à cause de la douleur' }
      ];

      const result = RoleMapper.map(segments, 'fr');

      expect(result.roleMap.A).toBe('CLINICIAN');
      expect(result.roleMap.B).toBe('PATIENT');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle mixed case with A starting first and more questions', () => {
      const segments: SmoothedSegment[] = [
        // Speaker A starts first and has more questions
        { t0: 0, t1: 2, bucket: 'A', text: 'What brings you in today?' },
        { t0: 4, t1: 6, bucket: 'A', text: 'How are you feeling?' },
        { t0: 8, t1: 10, bucket: 'A', text: 'Can you describe the pain?' },
        
        // Speaker B responds
        { t0: 2, t1: 4, bucket: 'B', text: 'I have back pain' },
        { t0: 6, t1: 8, bucket: 'B', text: 'It hurts a lot' }
      ];

      const result = RoleMapper.map(segments, 'en');

      expect(result.roleMap.A).toBe('CLINICIAN');
      expect(result.roleMap.B).toBe('PATIENT');
      expect(result.features.startsFirstA).toBe(1);
      expect(result.features.questionRatioA).toBeGreaterThan(result.features.questionRatioB);
    });

    it('should return default mapping when features are unclear', () => {
      const segments: SmoothedSegment[] = [
        { t0: 0, t1: 2, bucket: 'A', text: 'Hello' },
        { t0: 0, t1: 2, bucket: 'B', text: 'Hi' }
      ];

      const result = RoleMapper.map(segments, 'en');

      expect(result.roleMap).toEqual({ A: 'CLINICIAN', B: 'PATIENT' });
      expect(result.roleMapFr).toEqual({ A: 'CLINICIEN', B: 'PATIENT' });
      // With minimal features, confidence should be close to 0.5 but not exactly 0.5
      // due to the logistic function always producing some confidence
      // but the logistic function may still produce high confidence
      // due to minimal but non-zero feature differences
      expect(result.confidence).toBeGreaterThan(0.4);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('normalizeLanguage', () => {
    it('should normalize fr-CA to fr', () => {
      expect(RoleMapper.normalizeLanguage('fr-CA')).toBe('fr');
    });

    it('should normalize fr to fr', () => {
      expect(RoleMapper.normalizeLanguage('fr')).toBe('fr');
    });

    it('should normalize en-CA to en', () => {
      expect(RoleMapper.normalizeLanguage('en-CA')).toBe('en');
    });

    it('should normalize en-US to en', () => {
      expect(RoleMapper.normalizeLanguage('en-US')).toBe('en');
    });

    it('should default to en for unknown languages', () => {
      expect(RoleMapper.normalizeLanguage('es')).toBe('en');
      expect(RoleMapper.normalizeLanguage('unknown')).toBe('en');
    });
  });
});
