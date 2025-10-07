/**
 * Unit tests for SectionHeaderGuard
 * Tests exactly one header line exists per language
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('SectionHeaderGuard', () => {
  
  describe('French (FR) header tests', () => {
    test('should add missing French section header', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      expect(result.text).toContain('7. Historique de faits et évolution');
      expect(result.violations).toContain('missing_section_header');
      expect(result.text.startsWith('7. Historique de faits et évolution')).toBe(true);
    });

    test('should preserve existing French header', () => {
      const input = `7. Historique de faits et évolution

Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should remove duplicate French headers', () => {
      const input = `7. Historique de faits et évolution

Le travailleur consulte le docteur Durusso, le 10 mai 2019.

7. Historique de faits et évolution

Le travailleur revoit le docteur Durusso, le 15 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      expect(result.violations).toContain('duplicate_section_headers');
      const headerCount = (result.text.match(/7\. Historique de faits et évolution/g) || []).length;
      expect(headerCount).toBe(1);
    });

    test('should handle header with extra whitespace', () => {
      const input = `  7. Historique de faits et évolution  

Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toContain('7. Historique de faits et évolution');
    });
  });

  describe('English (EN) header tests', () => {
    test('should add missing English section header', () => {
      const input = `The worker consults Dr. Smith, on May 10, 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'en');
      
      expect(result.text).toContain('7. History of Facts and Clinical Evolution');
      expect(result.violations).toContain('missing_section_header');
      expect(result.text.startsWith('7. History of Facts and Clinical Evolution')).toBe(true);
    });

    test('should preserve existing English header', () => {
      const input = `7. History of Facts and Clinical Evolution

The worker consults Dr. Smith, on May 10, 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'en');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should remove duplicate English headers', () => {
      const input = `7. History of Facts and Clinical Evolution

The worker consults Dr. Smith, on May 10, 2019.

7. History of Facts and Clinical Evolution

The worker reviews with Dr. Smith, on May 15, 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'en');
      
      expect(result.violations).toContain('duplicate_section_headers');
      const headerCount = (result.text.match(/7\. History of Facts and Clinical Evolution/g) || []).length;
      expect(headerCount).toBe(1);
    });

    test('should handle header with extra whitespace', () => {
      const input = `  7. History of Facts and Clinical Evolution  

The worker consults Dr. Smith, on May 10, 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'en');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toContain('7. History of Facts and Clinical Evolution');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty input', () => {
      const result = Section7Guards.sectionHeaderGuard('', 'fr');
      
      expect(result.text).toContain('7. Historique de faits et évolution');
      expect(result.violations).toContain('missing_section_header');
    });

    test('should handle input with only whitespace', () => {
      const result = Section7Guards.sectionHeaderGuard('   \n  \n  ', 'fr');
      
      expect(result.text).toContain('7. Historique de faits et évolution');
      expect(result.violations).toContain('missing_section_header');
    });

    test('should handle partial header matches', () => {
      const input = `7. Historique de faits

Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      // Should not match partial header
      expect(result.violations).toContain('missing_section_header');
    });

    test('should handle wrong language header', () => {
      const input = `7. History of Facts and Clinical Evolution

Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      // Should not match English header when expecting French
      expect(result.violations).toContain('missing_section_header');
    });

    test('should handle multiple duplicate headers', () => {
      const input = `7. Historique de faits et évolution

Le travailleur consulte le docteur Durusso, le 10 mai 2019.

7. Historique de faits et évolution

Le travailleur revoit le docteur Durusso, le 15 mai 2019.

7. Historique de faits et évolution

Le travailleur revoit le docteur Durusso, le 20 mai 2019.`;
      
      const result = Section7Guards.sectionHeaderGuard(input, 'fr');
      
      expect(result.violations).toContain('duplicate_section_headers');
      const headerCount = (result.text.match(/7\. Historique de faits et évolution/g) || []).length;
      expect(headerCount).toBe(1);
    });
  });
});
