import { Mode1Formatter } from '../services/formatter/mode1.js';
import { Section7Validator } from '../services/formatter/validators/section7.js';
import { Section8Validator } from '../services/formatter/validators/section8.js';
import { Section11Validator } from '../services/formatter/validators/section11.js';

describe('Mode 1 Formatter', () => {
  let formatter: Mode1Formatter;

  beforeEach(() => {
    formatter = new Mode1Formatter();
  });

  describe('Basic Formatting', () => {
    test('should format basic transcript with punctuation', () => {
      const transcript = 'le travailleur consulte le docteur pour une douleur au genou';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: false,
        preserve_verbatim: true
      });

      expect(result.formatted).toBeDefined();
      expect(result.issues).toEqual([]);
      expect(result.verbatim_blocks).toEqual([]);
    });

    test('should handle voice commands', () => {
      const transcript = 'nouveau paragraphe le travailleur consulte pause reprendre';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: false,
        preserve_verbatim: true
      });

      expect(result.formatted).toContain('\n\n');
      expect(result.formatted).toContain('[PAUSE]');
      expect(result.formatted).toContain('[RESUME]');
    });

    test('should protect verbatim blocks', () => {
      const transcript = 'début verbatim rapport radiologique genou normal fin verbatim';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: false,
        preserve_verbatim: true
      });

      expect(result.formatted).toContain('___VERBATIM_START___');
      expect(result.formatted).toContain('___VERBATIM_END___');
      expect(result.verbatim_blocks.length).toBeGreaterThan(0);
    });

    test('should handle radiology mode', () => {
      const transcript = 'rapport radiologique genou normal fin rapport';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: true,
        preserve_verbatim: true
      });

      expect(result.formatted).toContain('___VERBATIM_START___');
      expect(result.formatted).toContain('___VERBATIM_END___');
    });
  });

  describe('Section Validators', () => {
    describe('Section 7 Validator', () => {
      let validator: Section7Validator;

      beforeEach(() => {
        validator = new Section7Validator();
      });

      test('should validate worker-first rule', () => {
        const content = 'Le travailleur consulte le docteur le 15/01/2025.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should reject date-first sentences', () => {
        const content = 'Le 15/01/2025, le travailleur consulte le docteur.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(false);
        expect(result.critical_issues.length).toBeGreaterThan(0);
      });

      test('should validate doctor title format', () => {
        const content = 'Le travailleur consulte le docteur Jean Dupont.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.warnings).toEqual([]);
      });
    });

    describe('Section 8 Validator', () => {
      let validator: Section8Validator;

      beforeEach(() => {
        validator = new Section8Validator();
      });

      test('should validate VAS format', () => {
        const content = 'Douleur VAS: 7/10';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should reject invalid VAS format', () => {
        const content = 'Douleur VAS: 15/10';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(false);
        expect(result.critical_issues.length).toBeGreaterThan(0);
      });

      test('should validate MRC format', () => {
        const content = 'Force MRC: 4/5';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should validate ROM format', () => {
        const content = 'ROM: 90°';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });
    });

    describe('Section 11 Validator', () => {
      let validator: Section11Validator;

      beforeEach(() => {
        validator = new Section11Validator();
      });

      test('should validate required headings', () => {
        const content = 'Résumé: Le patient présente une douleur au genou.\nDiagnostics: Entorse du genou.\nDate de consolidation: 15/01/2025.\nSoins nécessaires: Repos et glace.\nDéficience permanente: 5% (source: S7).\nLimitations: Limitation de la marche (source: S8).\nÉvaluation: Cas simple.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should validate source tags', () => {
        const content = 'Diagnostics: Entorse du genou (source: S7).';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should reject missing source tags', () => {
        const content = 'Diagnostics: Entorse du genou.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(false);
        expect(result.critical_issues.length).toBeGreaterThan(0);
      });

      test('should validate consolidation date format', () => {
        const content = 'Date de consolidation: 15/01/2025.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });

      test('should accept "not specified" for consolidation date', () => {
        const content = 'Date de consolidation: non précisée au dossier.';
        const result = validator.validate(content, 'fr');

        expect(result.isValid).toBe(true);
        expect(result.critical_issues).toEqual([]);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should format and validate Section 7 content', () => {
      const transcript = 'le travailleur consulte le docteur jean dupont le 15 janvier 2025 pour une douleur au genou nouveau paragraphe il présente une entorse';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: false,
        preserve_verbatim: true
      });

      const validator = new Section7Validator();
      const validation = validator.validate(result.formatted, 'fr');

      expect(result.formatted).toBeDefined();
      expect(validation.isValid).toBe(true);
    });

    test('should format and validate Section 8 content', () => {
      const transcript = 'questionnaire subjectif douleur vas 7 sur 10 force mrc 4 sur 5 rom 90 degrés';
      const result = formatter.format(transcript, {
        language: 'fr',
        quote_style: 'smart',
        radiology_mode: false,
        preserve_verbatim: true
      });

      const validator = new Section8Validator();
      const validation = validator.validate(result.formatted, 'fr');

      expect(result.formatted).toBeDefined();
      expect(validation.isValid).toBe(true);
    });
  });
});
