/**
 * Unit tests for VertebraeGuard
 * Tests normalization of spine levels with hyphen (C5-C6, L5-S1, etc.)
 */

import { Section7Guards } from '../src/services/formatter/section7AI-hardened';

describe('VertebraeGuard', () => {
  
  describe('Spine level normalization tests', () => {
    test('should normalize C5-C6 with inconsistent spacing', () => {
      const input = `Le travailleur présente des douleurs au niveau C 5 - C 6.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('C5-C6');
      expect(result.text).not.toContain('C 5 - C 6');
      expect(result.violations).toHaveLength(0);
    });

    test('should normalize L5-S1 with various spacing', () => {
      const input = `Lésion discale au niveau L 5 – S 1.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('L5-S1');
      expect(result.text).not.toContain('L 5 – S 1');
    });

    test('should normalize T12-L1 with en-dash', () => {
      const input = `Fracture au niveau T 12 – L 1.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('T12-L1');
      expect(result.text).not.toContain('T 12 – L 1');
    });

    test('should handle multiple vertebrae levels', () => {
      const input = `Douleurs au niveau C 5 - C 6 et L 4 - L 5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('C5-C6');
      expect(result.text).toContain('L4-L5');
      expect(result.text).not.toContain('C 5 - C 6');
      expect(result.text).not.toContain('L 4 - L 5');
    });

    test('should preserve already correct formatting', () => {
      const input = `Douleurs au niveau C5-C6 et L4-L5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Inconsistent spacing detection', () => {
    test('should flag inconsistent vertebrae spacing', () => {
      const input = `Douleurs au niveau C 5 C 6 sans trait d'union.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.violations).toContain('inconsistent_vertebrae_spacing');
    });

    test('should flag multiple inconsistent patterns', () => {
      const input = `Douleurs C 5 C 6 et L 4 L 5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.violations).toContain('inconsistent_vertebrae_spacing');
    });

    test('should not flag when spacing is correct', () => {
      const input = `Douleurs au niveau C5-C6 et L4-L5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.violations).not.toContain('inconsistent_vertebrae_spacing');
    });
  });

  describe('Different vertebrae types', () => {
    test('should handle cervical vertebrae (C)', () => {
      const input = `Cervicalgie au niveau C 3 - C 4.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('C3-C4');
    });

    test('should handle thoracic vertebrae (T)', () => {
      const input = `Dorsalgie au niveau T 6 - T 7.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('T6-T7');
    });

    test('should handle lumbar vertebrae (L)', () => {
      const input = `Lombalgie au niveau L 2 - L 3.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('L2-L3');
    });

    test('should handle sacral vertebrae (S)', () => {
      const input = `Douleur sacrée au niveau S 1 - S 2.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('S1-S2');
    });
  });

  describe('Edge cases', () => {
    test('should handle input without vertebrae references', () => {
      const input = `Le travailleur consulte le docteur Durusso. Il diagnostique une entorse.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should handle single vertebrae references', () => {
      const input = `Douleur au niveau C 5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      // Single vertebrae should not be affected
      expect(result.text).toBe(input);
      expect(result.violations).toHaveLength(0);
    });

    test('should handle mixed correct and incorrect formatting', () => {
      const input = `Douleurs au niveau C5-C6 et L 4 - L 5.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('C5-C6');
      expect(result.text).toContain('L4-L5');
      expect(result.text).not.toContain('L 4 - L 5');
    });

    test('should handle complex medical text', () => {
      const input = `IRM révèle une hernie discale au niveau L 4 - L 5 avec compression radiculaire. 
      Également, sténose foraminale au niveau C 5 - C 6.`;
      
      const result = Section7Guards.vertebraeGuard(input);
      
      expect(result.text).toContain('L4-L5');
      expect(result.text).toContain('C5-C6');
      expect(result.text).not.toContain('L 4 - L 5');
      expect(result.text).not.toContain('C 5 - C 6');
    });
  });
});
