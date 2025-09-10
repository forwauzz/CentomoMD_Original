/**
 * Unit tests for WorkerFirstGuard
 * Tests worker-first structure enforcement in FR & EN
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('WorkerFirstGuard', () => {
  
  describe('French (FR) tests', () => {
    test('should reject date-first opener and repair it', () => {
      const input = `Le 21 mai 2019, le travailleur consulte le docteur Durusso. Il diagnostique une entorse lombaire.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'fr');
      
      expect(result.violations).toContain('date_first_opener');
      expect(result.text).toContain('Le travailleur');
      expect(result.text).not.toMatch(/^Le 21 mai 2019/);
    });

    test('should reject "En mai" opener', () => {
      const input = `En mai 2019, la travailleuse consulte le docteur Martin.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'fr');
      
      expect(result.violations).toContain('date_first_opener');
    });

    test('should accept correct worker-first structure', () => {
      const input = `Le travailleur consulte le docteur Durusso, le 21 mai 2019. Il diagnostique une entorse lombaire.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'fr');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toBe(input);
    });

    test('should handle "La travailleuse" correctly', () => {
      const input = `La travailleuse consulte le docteur Martin, le 15 juin 2019.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'fr');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toBe(input);
    });
  });

  describe('English (EN) tests', () => {
    test('should reject "On May 21" opener', () => {
      const input = `On May 21, 2019, the worker consults Dr. Smith. He diagnoses a lumbar sprain.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'en');
      
      expect(result.violations).toContain('date_first_opener');
      expect(result.text).toContain('The worker');
    });

    test('should reject "On 21st" opener', () => {
      const input = `On 21st May, the worker meets Dr. Johnson.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'en');
      
      expect(result.violations).toContain('date_first_opener');
    });

    test('should accept correct worker-first structure', () => {
      const input = `The worker consults Dr. Smith, on May 21, 2019. He diagnoses a lumbar sprain.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'en');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toBe(input);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty input', () => {
      const result = Section7Guards.workerFirstGuard('', 'fr');
      
      expect(result.violations).toHaveLength(0);
      expect(result.text).toBe('');
    });

    test('should handle input without worker reference', () => {
      const input = `Le 21 mai 2019, consultation médicale.`;
      
      const result = Section7Guards.workerFirstGuard(input, 'fr');
      
      expect(result.violations).toContain('date_first_opener');
      // Should not be able to rewrite without worker reference
      expect(result.text).toBe(input);
    });
  });
});
