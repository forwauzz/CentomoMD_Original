/**
 * Unit tests for OrderGuard
 * Tests chronological ordering of mixed dates (1er octobre, Oct 1, 2019, etc.)
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('OrderGuard', () => {
  
  describe('French (FR) chronology tests', () => {
    test('should detect out-of-order dates and flag violation', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 15 juin 2019.
Le travailleur revoit le docteur Durusso, le 10 mai 2019.
Le travailleur revoit le docteur Durusso, le 20 juillet 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).toContain('chronology_fail');
      expect(result.metadata.date_reorderings).toBeDefined();
      expect(result.metadata.date_reorderings.length).toBeGreaterThan(0);
    });

    test('should accept correctly ordered dates', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 10 mai 2019.
Le travailleur revoit le docteur Durusso, le 15 juin 2019.
Le travailleur revoit le docteur Durusso, le 20 juillet 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).not.toContain('chronology_fail');
    });

    test('should handle "1er" dates correctly', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 1er mai 2019.
Le travailleur revoit le docteur Durusso, le 15 mai 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).not.toContain('chronology_fail');
    });

    test('should handle mixed "le" and without "le" dates', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 10 mai 2019.
Le travailleur revoit le docteur Durusso, 15 juin 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).not.toContain('chronology_fail');
    });
  });

  describe('English (EN) chronology tests', () => {
    test('should detect out-of-order dates and flag violation', () => {
      const input = `The worker consults Dr. Smith, on June 15, 2019.
The worker reviews with Dr. Smith, on May 10, 2019.
The worker reviews with Dr. Smith, on July 20, 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'en');
      
      expect(result.violations).toContain('chronology_fail');
      expect(result.metadata.date_reorderings).toBeDefined();
    });

    test('should accept correctly ordered dates', () => {
      const input = `The worker consults Dr. Smith, on May 10, 2019.
The worker reviews with Dr. Smith, on June 15, 2019.
The worker reviews with Dr. Smith, on July 20, 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'en');
      
      expect(result.violations).not.toContain('chronology_fail');
    });

    test('should handle dates with and without commas', () => {
      const input = `The worker consults Dr. Smith, on May 10, 2019.
The worker reviews with Dr. Smith, on June 15 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'en');
      
      expect(result.violations).not.toContain('chronology_fail');
    });
  });

  describe('Edge cases', () => {
    test('should handle input without dates', () => {
      const input = `Le travailleur consulte le docteur Durusso. Il diagnostique une entorse.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).not.toContain('chronology_fail');
      expect(result.metadata.date_reorderings).toHaveLength(0);
    });

    test('should handle single date', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      expect(result.violations).not.toContain('chronology_fail');
    });

    test('should handle ambiguous dates gracefully', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 10 mai 2019.
Le travailleur revoit le docteur Durusso, le 10 mai 2019.`;
      
      const result = Section7Guards.orderGuard(input, 'fr');
      
      // Same dates should not trigger chronology failure
      expect(result.violations).not.toContain('chronology_fail');
    });
  });
});
