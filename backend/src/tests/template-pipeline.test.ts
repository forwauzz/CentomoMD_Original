import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplatePipeline } from '../services/formatter/TemplatePipeline.js';
import { CleanedInput } from '../../shared/types/clinical.js';

// Mock the shared formatter
const mockFormatWithGuardrails = vi.fn();
vi.mock('../services/formatter/shared.js', () => ({
  formatWithGuardrails: mockFormatWithGuardrails
}));

// Mock the names utility
const mockExtractNameWhitelist = vi.fn();
vi.mock('../utils/names.js', () => ({
  extractNameWhitelist: mockExtractNameWhitelist
}));

describe('TemplatePipeline', () => {
  let pipeline: TemplatePipeline;
  
  beforeEach(() => {
    pipeline = new TemplatePipeline();
    vi.clearAllMocks();
    
    // Setup default mocks
    mockExtractNameWhitelist.mockReturnValue(['Dr. Smith', 'Patient']);
    mockFormatWithGuardrails.mockResolvedValue({
      formatted: 'Formatted text',
      issues: [],
      confidence_score: 0.9
    });
  });

  describe('Section 7 Processing', () => {
    const mockCleanedInput: CleanedInput = {
      cleaned_text: 'Patient presents with knee pain for 2 weeks. Pain is rated 7/10.',
      clinical_entities: {
        injury_location: 'knee',
        injury_type: 'pain',
        onset: '2 weeks ago',
        pain_severity: '7/10',
        functional_limitations: ['difficulty walking'],
        previous_injuries: [],
        treatment_to_date: [],
        imaging_done: [],
        return_to_work: 'May need modified duties',
        language: 'en',
        confidence: 0.9
      },
      meta: {
        processing_ms: 1500,
        source: 'ambient',
        language: 'en',
        used_cache: false
      }
    };

    it('should process Section 7 with clinical entities', async () => {
      const result = await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '7',
        templateId: 'test-template'
      });

      expect(result.formatted).toBe('Formatted text');
      expect(result.clinical_entities).toEqual(mockCleanedInput.clinical_entities);
      expect(result.confidence_score).toBe(0.9);
      expect(result.issues).toEqual([]);

      // Verify that formatWithGuardrails was called with cleaned text
      expect(mockFormatWithGuardrails).toHaveBeenCalledWith(
        '7',
        'en',
        mockCleanedInput.cleaned_text,
        undefined,
        { nameWhitelist: ['Dr. Smith', 'Patient'] }
      );
    });

    it('should extract name whitelist from cleaned text', async () => {
      await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '7',
        templateId: 'test-template'
      });

      expect(mockExtractNameWhitelist).toHaveBeenCalledWith(mockCleanedInput.cleaned_text);
    });

    it('should handle French language correctly', async () => {
      const frenchCleanedInput: CleanedInput = {
        ...mockCleanedInput,
        cleaned_text: 'Le patient présente une douleur au genou depuis 2 semaines.',
        clinical_entities: {
          ...mockCleanedInput.clinical_entities,
          language: 'fr'
        },
        meta: {
          ...mockCleanedInput.meta,
          language: 'fr'
        }
      };

      const result = await pipeline.process(frenchCleanedInput, {
        language: 'fr',
        section: '7',
        templateId: 'test-template'
      });

      expect(result.formatted).toBe('Formatted text');
      expect(result.clinical_entities.language).toBe('fr');

      expect(mockFormatWithGuardrails).toHaveBeenCalledWith(
        '7',
        'fr',
        frenchCleanedInput.cleaned_text,
        undefined,
        { nameWhitelist: ['Dr. Smith', 'Patient'] }
      );
    });
  });

  describe('Section 8 Processing', () => {
    const mockCleanedInput: CleanedInput = {
      cleaned_text: 'Physical examination reveals swelling and tenderness.',
      clinical_entities: {
        injury_location: 'knee',
        language: 'en'
      },
      meta: {
        processing_ms: 1000,
        source: 'ambient',
        language: 'en'
      }
    };

    it('should process Section 8 (not yet implemented)', async () => {
      const result = await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '8',
        templateId: 'test-template'
      });

      expect(result.formatted).toBe(mockCleanedInput.cleaned_text);
      expect(result.clinical_entities).toEqual(mockCleanedInput.clinical_entities);
      expect(result.confidence_score).toBe(0.5);
      expect(result.issues).toContain('Section 8 AI formatting not yet implemented');
    });
  });

  describe('Section 11 Processing', () => {
    const mockCleanedInput: CleanedInput = {
      cleaned_text: 'Recommend follow-up in 2 weeks.',
      clinical_entities: {
        injury_location: 'knee',
        language: 'en'
      },
      meta: {
        processing_ms: 1000,
        source: 'ambient',
        language: 'en'
      }
    };

    it('should process Section 11 (not yet implemented)', async () => {
      const result = await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '11',
        templateId: 'test-template'
      });

      expect(result.formatted).toBe(mockCleanedInput.cleaned_text);
      expect(result.clinical_entities).toEqual(mockCleanedInput.clinical_entities);
      expect(result.confidence_score).toBe(0.5);
      expect(result.issues).toContain('Section 11 AI formatting not yet implemented');
    });
  });

  describe('Error Handling', () => {
    const mockCleanedInput: CleanedInput = {
      cleaned_text: 'Test transcript',
      clinical_entities: {
        language: 'en'
      },
      meta: {
        processing_ms: 1000,
        source: 'ambient',
        language: 'en'
      }
    };

    it('should handle formatWithGuardrails errors gracefully', async () => {
      mockFormatWithGuardrails.mockRejectedValue(new Error('Formatting failed'));

      const result = await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '7',
        templateId: 'test-template'
      });

      expect(result.formatted).toBe(mockCleanedInput.cleaned_text);
      expect(result.clinical_entities).toEqual(mockCleanedInput.clinical_entities);
      expect(result.confidence_score).toBe(0);
      expect(result.issues).toContain('Section 7 processing error: Formatting failed');
    });

    it('should handle unsupported section gracefully', async () => {
      const result = await pipeline.process(mockCleanedInput, {
        language: 'en',
        section: '99' as any,
        templateId: 'test-template'
      });

      expect(result.formatted).toBe(mockCleanedInput.cleaned_text);
      expect(result.clinical_entities).toEqual(mockCleanedInput.clinical_entities);
      expect(result.confidence_score).toBe(0);
      expect(result.issues).toContain('Template pipeline error: Unsupported section: 99');
    });
  });

  describe('Clinical Entities Preservation', () => {
    it('should preserve all clinical entities in the result', async () => {
      const complexCleanedInput: CleanedInput = {
        cleaned_text: 'Complex medical case with multiple issues.',
        clinical_entities: {
          injury_location: 'multiple sites',
          injury_type: 'chronic pain',
          onset: '6 months ago',
          pain_severity: '8/10',
          functional_limitations: ['unable to work', 'difficulty sleeping'],
          previous_injuries: ['back injury 2019', 'knee surgery 2020'],
          treatment_to_date: ['physiotherapy', 'pain medication'],
          imaging_done: ['MRI spine', 'X-ray knee'],
          return_to_work: 'Not recommended until further assessment',
          language: 'en',
          confidence: 0.95,
          issues: ['complex case']
        },
        meta: {
          processing_ms: 2000,
          source: 'smart_dictation',
          language: 'en',
          used_cache: true
        }
      };

      const result = await pipeline.process(complexCleanedInput, {
        language: 'en',
        section: '7',
        templateId: 'complex-template'
      });

      expect(result.clinical_entities).toEqual(complexCleanedInput.clinical_entities);
      expect(result.clinical_entities.functional_limitations).toHaveLength(2);
      expect(result.clinical_entities.previous_injuries).toHaveLength(2);
      expect(result.clinical_entities.treatment_to_date).toHaveLength(2);
      expect(result.clinical_entities.imaging_done).toHaveLength(2);
      expect(result.clinical_entities.confidence).toBe(0.95);
      expect(result.clinical_entities.issues).toContain('complex case');
    });
  });
});
