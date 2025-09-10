/**
 * Unit tests for QuoteGuard
 * Tests quote normalization and fixing half/mismatched quotes
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('QuoteGuard', () => {
  
  describe('French (FR) quote tests', () => {
    test('should normalize English quotes to French guillemets', () => {
      const input = `La fiche de réclamation décrit: "Je me suis blessé au dos."`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toContain('« Je me suis blessé au dos. »');
      expect(result.text).not.toContain('"Je me suis blessé au dos."');
      expect(result.violations).toHaveLength(0);
    });

    test('should normalize single quotes to French guillemets', () => {
      const input = `La fiche de réclamation décrit: 'Je me suis blessé au dos.'`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toContain('« Je me suis blessé au dos. »');
      expect(result.violations).toHaveLength(0);
    });

    test('should preserve correct French guillemets', () => {
      const input = `La fiche de réclamation décrit: « Je me suis blessé au dos. »`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should detect unbalanced French quotes', () => {
      const input = `La fiche de réclamation décrit: « Je me suis blessé au dos.`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.violations).toContain('unbalanced_quotes');
    });

    test('should handle multiple quotes correctly', () => {
      const input = `La fiche décrit: "Premier événement." L'employeur dit: "Accident confirmé."`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toContain('« Premier événement. »');
      expect(result.text).toContain('« Accident confirmé. »');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('English (EN) quote tests', () => {
    test('should normalize French guillemets to English quotes', () => {
      const input = `The claim form describes: « I hurt my back. »`;
      
      const result = Section7Guards.quoteGuard(input, 'en');
      
      expect(result.text).toContain('"I hurt my back."');
      expect(result.text).not.toContain('« I hurt my back. »');
      expect(result.violations).toHaveLength(0);
    });

    test('should normalize single quotes to English double quotes', () => {
      const input = `The claim form describes: 'I hurt my back.'`;
      
      const result = Section7Guards.quoteGuard(input, 'en');
      
      expect(result.text).toContain('"I hurt my back."');
      expect(result.violations).toHaveLength(0);
    });

    test('should preserve correct English quotes', () => {
      const input = `The claim form describes: "I hurt my back."`;
      
      const result = Section7Guards.quoteGuard(input, 'en');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should detect unbalanced English quotes', () => {
      const input = `The claim form describes: "I hurt my back.`;
      
      const result = Section7Guards.quoteGuard(input, 'en');
      
      expect(result.violations).toContain('unbalanced_quotes');
    });

    test('should handle multiple quotes correctly', () => {
      const input = `The form says: « First event. » The employer says: « Confirmed accident. »`;
      
      const result = Section7Guards.quoteGuard(input, 'en');
      
      expect(result.text).toContain('"First event."');
      expect(result.text).toContain('"Confirmed accident."');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle input without quotes', () => {
      const input = `Le travailleur consulte le docteur Durusso. Il diagnostique une entorse.`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should handle mixed quote types in same text', () => {
      const input = `La fiche dit: "Premier événement." L'employeur dit: « Deuxième événement. »`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toContain('« Premier événement. »');
      expect(result.text).toContain('« Deuxième événement. »');
      expect(result.violations).toHaveLength(0);
    });

    test('should handle nested quotes', () => {
      const input = `La fiche décrit: "Il a dit: 'Je me suis blessé.'"`;
      
      const result = Section7Guards.quoteGuard(input, 'fr');
      
      expect(result.text).toContain('« Il a dit: Je me suis blessé. »');
      expect(result.violations).toHaveLength(0);
    });
  });
});
