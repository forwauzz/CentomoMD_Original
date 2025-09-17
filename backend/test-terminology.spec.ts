/**
 * Unit tests for TerminologyGuard
 * Tests enforcement of worker vs patient mapping per locale
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('TerminologyGuard', () => {
  
  describe('French (FR) terminology tests', () => {
    test('should replace "le patient" with "le travailleur"', () => {
      const input = `Le patient consulte le docteur Durusso. Le patient se plaint de douleurs.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toContain('Le travailleur consulte le docteur Durusso');
      expect(result.text).toContain('Le travailleur se plaint de douleurs');
      expect(result.text).not.toContain('Le patient');
      expect(result.metadata.terminology_changes).toHaveLength(1);
      expect(result.metadata.terminology_changes[0].count).toBe(2);
    });

    test('should replace "la patiente" with "la travailleuse"', () => {
      const input = `La patiente consulte le docteur Martin. La patiente se plaint de douleurs.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toContain('La travailleuse consulte le docteur Martin');
      expect(result.text).toContain('La travailleuse se plaint de douleurs');
      expect(result.text).not.toContain('La patiente');
      expect(result.metadata.terminology_changes).toHaveLength(1);
      expect(result.metadata.terminology_changes[0].count).toBe(2);
    });

    test('should replace "Docteur" with "docteur"', () => {
      const input = `Le travailleur consulte le Docteur Durusso. Le Docteur diagnostique une entorse.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toContain('le docteur Durusso');
      expect(result.text).toContain('Le docteur diagnostique');
      expect(result.text).not.toContain('Docteur');
      expect(result.metadata.terminology_changes).toHaveLength(1);
      expect(result.metadata.terminology_changes[0].count).toBe(2);
    });

    test('should handle mixed terminology replacements', () => {
      const input = `Le patient consulte le Docteur Durusso. La patiente revoit le docteur Martin.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toContain('Le travailleur consulte le docteur Durusso');
      expect(result.text).toContain('La travailleuse revoit le docteur Martin');
      expect(result.metadata.terminology_changes).toHaveLength(3);
    });

    test('should not replace when terminology is already correct', () => {
      const input = `Le travailleur consulte le docteur Durusso. La travailleuse revoit le docteur Martin.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toBe(input);
      expect(result.metadata.terminology_changes).toHaveLength(0);
    });
  });

  describe('English (EN) terminology tests', () => {
    test('should replace "the patient" with "the worker"', () => {
      const input = `The patient consults Dr. Smith. The patient complains of pain.`;
      
      const result = Section7Guards.terminologyGuard(input, 'en');
      
      expect(result.text).toContain('The worker consults Dr. Smith');
      expect(result.text).toContain('The worker complains of pain');
      expect(result.text).not.toContain('The patient');
      expect(result.metadata.terminology_changes).toHaveLength(1);
      expect(result.metadata.terminology_changes[0].count).toBe(2);
    });

    test('should replace "Doctor" with "Dr."', () => {
      const input = `The worker consults Doctor Smith. Doctor Smith diagnoses a sprain.`;
      
      const result = Section7Guards.terminologyGuard(input, 'en');
      
      expect(result.text).toContain('Dr. Smith');
      expect(result.text).toContain('Dr. Smith diagnoses');
      expect(result.text).not.toContain('Doctor');
      expect(result.metadata.terminology_changes).toHaveLength(1);
      expect(result.metadata.terminology_changes[0].count).toBe(2);
    });

    test('should handle mixed terminology replacements', () => {
      const input = `The patient consults Doctor Smith. The patient reviews with Dr. Johnson.`;
      
      const result = Section7Guards.terminologyGuard(input, 'en');
      
      expect(result.text).toContain('The worker consults Dr. Smith');
      expect(result.text).toContain('The worker reviews with Dr. Johnson');
      expect(result.metadata.terminology_changes).toHaveLength(2);
    });

    test('should not replace when terminology is already correct', () => {
      const input = `The worker consults Dr. Smith. The worker reviews with Dr. Johnson.`;
      
      const result = Section7Guards.terminologyGuard(input, 'en');
      
      expect(result.text).toBe(input);
      expect(result.metadata.terminology_changes).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    test('should handle input without terminology issues', () => {
      const input = `Le travailleur consulte le docteur Durusso. Il diagnostique une entorse.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
      expect(result.metadata.terminology_changes).toHaveLength(0);
    });

    test('should handle case-sensitive replacements', () => {
      const input = `le patient consulte LE PATIENT.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      expect(result.text).toContain('le travailleur consulte LE PATIENT');
      // Only lowercase "le patient" should be replaced
      expect(result.metadata.terminology_changes[0].count).toBe(1);
    });

    test('should handle partial word matches correctly', () => {
      const input = `Le patientèle consulte le docteur.`;
      
      const result = Section7Guards.terminologyGuard(input, 'fr');
      
      // Should not replace "patientèle" as it's not a complete word match
      expect(result.text).toBe(input);
      expect(result.metadata.terminology_changes).toHaveLength(0);
    });
  });
});
