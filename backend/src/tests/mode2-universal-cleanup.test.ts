import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Mode2Formatter } from '../services/formatter/mode2.js';

// Mock the UniversalCleanupLayer
const mockUniversalCleanupLayer = {
  process: vi.fn()
};

// Mock the TemplatePipeline
const mockTemplatePipeline = {
  process: vi.fn()
};

// Mock the LayerManager
const mockLayerManager = {
  validateCombination: vi.fn(),
  getEnabledLayers: vi.fn(),
  processLayers: vi.fn()
};

vi.mock('../services/layers/UniversalCleanupLayer.js', () => ({
  UniversalCleanupLayer: vi.fn(() => mockUniversalCleanupLayer)
}));

vi.mock('../services/formatter/TemplatePipeline.js', () => ({
  TemplatePipeline: vi.fn(() => mockTemplatePipeline)
}));

vi.mock('../services/layers/LayerManager.js', () => ({
  LayerManager: vi.fn(() => mockLayerManager)
}));

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

describe('Mode2Formatter with Universal Cleanup', () => {
  let formatter: Mode2Formatter;
  
  beforeEach(() => {
    formatter = new Mode2Formatter();
    vi.clearAllMocks();
    
    // Setup default mocks
    mockExtractNameWhitelist.mockReturnValue(['Dr. Smith']);
    mockFormatWithGuardrails.mockResolvedValue({
      formatted: 'Formatted text',
      issues: [],
      confidence_score: 0.9
    });
    
    // Setup environment
    process.env['UNIVERSAL_CLEANUP_ENABLED'] = 'true';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Universal Cleanup Integration', () => {
    it('should use Universal Cleanup when flag is enabled', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            injury_type: 'pain',
            onset: '2 weeks ago',
            pain_severity: '7/10',
            functional_limitations: [],
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
        }
      };

      const mockPipelineResult = {
        formatted: 'Formatted clinical text',
        issues: [],
        confidence_score: 0.95,
        clinical_entities: mockCleanupResult.data.clinical_entities
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockTemplatePipeline.process.mockResolvedValue(mockPipelineResult);

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Formatted clinical text');
      expect(result.clinical_entities).toEqual(mockCleanupResult.data.clinical_entities);
      expect(result.confidence_score).toBe(0.95);
      expect(result.issues).toEqual([]);

      // Verify Universal Cleanup was called
      expect(mockUniversalCleanupLayer.process).toHaveBeenCalledWith(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      // Verify TemplatePipeline was called
      expect(mockTemplatePipeline.process).toHaveBeenCalledWith(
        mockCleanupResult.data,
        {
          language: 'en',
          section: '7',
          templateId: undefined
        }
      );
    });

    it('should fallback to legacy path when Universal Cleanup fails', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      mockUniversalCleanupLayer.process.mockResolvedValue({
        success: false,
        data: null
      });

      mockFormatWithGuardrails.mockResolvedValue({
        formatted: 'Legacy formatted text',
        issues: ['Universal Cleanup failed, using original transcript'],
        confidence_score: 0.8
      });

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Legacy formatted text');
      expect(result.issues).toContain('Universal Cleanup failed, using original transcript');
      expect(result.confidence_score).toBe(0.8);

      // Verify Universal Cleanup was attempted
      expect(mockUniversalCleanupLayer.process).toHaveBeenCalled();
      
      // Verify legacy formatting was used
      expect(mockFormatWithGuardrails).toHaveBeenCalledWith(
        '7',
        'en',
        testTranscript,
        undefined,
        { nameWhitelist: ['Dr. Smith'] }
      );
    });

    it('should use legacy path when flag is disabled', async () => {
      process.env['UNIVERSAL_CLEANUP_ENABLED'] = 'false';
      
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      mockFormatWithGuardrails.mockResolvedValue({
        formatted: 'Legacy formatted text',
        issues: [],
        confidence_score: 0.8
      });

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Legacy formatted text');
      expect(result.confidence_score).toBe(0.8);

      // Verify Universal Cleanup was NOT called
      expect(mockUniversalCleanupLayer.process).not.toHaveBeenCalled();
      
      // Verify legacy formatting was used
      expect(mockFormatWithGuardrails).toHaveBeenCalledWith(
        '7',
        'en',
        testTranscript,
        undefined,
        { nameWhitelist: ['Dr. Smith'] }
      );
    });
  });

  describe('Template Combinations with Universal Cleanup', () => {
    it('should use Universal Cleanup for template combinations when enabled', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            language: 'en'
          },
          meta: {
            processing_ms: 1500,
            source: 'ambient',
            language: 'en',
            used_cache: false
          }
        }
      };

      const mockPipelineResult = {
        formatted: 'Template combination formatted text',
        issues: [],
        confidence_score: 0.9,
        clinical_entities: mockCleanupResult.data.clinical_entities
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockTemplatePipeline.process.mockResolvedValue(mockPipelineResult);
      mockLayerManager.validateCombination.mockReturnValue({ valid: true });
      mockLayerManager.getEnabledLayers.mockReturnValue([]);

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7',
        templateCombo: 'universal-cleanup'
      });

      expect(result.formatted).toBe('Template combination formatted text');
      expect(result.clinical_entities).toEqual(mockCleanupResult.data.clinical_entities);

      // Verify Universal Cleanup was called
      expect(mockUniversalCleanupLayer.process).toHaveBeenCalled();
      
      // Verify TemplatePipeline was called
      expect(mockTemplatePipeline.process).toHaveBeenCalled();
    });

    it('should handle clinical extraction layer with Universal Cleanup', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            language: 'en'
          },
          meta: {
            processing_ms: 1500,
            source: 'ambient',
            language: 'en',
            used_cache: false
          }
        }
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockLayerManager.validateCombination.mockReturnValue({ valid: true });
      mockLayerManager.getEnabledLayers.mockReturnValue([
        { name: 'clinical-extraction-layer' }
      ]);

      mockFormatWithGuardrails.mockResolvedValue({
        formatted: 'Clinical extraction formatted text',
        issues: [],
        confidence_score: 0.9
      });

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7',
        templateCombo: 'template-clinical-extraction'
      });

      expect(result.formatted).toBe('Clinical extraction formatted text');
      expect(result.clinical_entities).toEqual(mockCleanupResult.data.clinical_entities);

      // Verify Universal Cleanup was called for clinical extraction
      expect(mockUniversalCleanupLayer.process).toHaveBeenCalled();
    });
  });

  describe('Performance and Caching', () => {
    it('should include processing time in results', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            language: 'en'
          },
          meta: {
            processing_ms: 1500,
            source: 'ambient',
            language: 'en',
            used_cache: false
          }
        }
      };

      const mockPipelineResult = {
        formatted: 'Formatted text',
        issues: [],
        confidence_score: 0.9,
        clinical_entities: mockCleanupResult.data.clinical_entities
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockTemplatePipeline.process.mockResolvedValue(mockPipelineResult);

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Formatted text');
      expect(result.clinical_entities).toBeDefined();
    });

    it('should handle cache hits in Universal Cleanup', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            language: 'en'
          },
          meta: {
            processing_ms: 0, // Cache hit
            source: 'ambient',
            language: 'en',
            used_cache: true
          }
        }
      };

      const mockPipelineResult = {
        formatted: 'Formatted text',
        issues: [],
        confidence_score: 0.9,
        clinical_entities: mockCleanupResult.data.clinical_entities
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockTemplatePipeline.process.mockResolvedValue(mockPipelineResult);

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Formatted text');
      expect(result.clinical_entities).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Universal Cleanup errors gracefully', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      mockUniversalCleanupLayer.process.mockRejectedValue(new Error('Cleanup failed'));

      mockFormatWithGuardrails.mockResolvedValue({
        formatted: 'Fallback formatted text',
        issues: ['Universal Cleanup failed, using original transcript'],
        confidence_score: 0.7
      });

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('Fallback formatted text');
      expect(result.issues).toContain('Universal Cleanup failed, using original transcript');
      expect(result.confidence_score).toBe(0.7);
    });

    it('should handle TemplatePipeline errors gracefully', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockCleanupResult = {
        success: true,
        data: {
          cleaned_text: 'Patient has knee pain for 2 weeks.',
          clinical_entities: {
            injury_location: 'knee',
            language: 'en'
          },
          meta: {
            processing_ms: 1500,
            source: 'ambient',
            language: 'en',
            used_cache: false
          }
        }
      };

      mockUniversalCleanupLayer.process.mockResolvedValue(mockCleanupResult);
      mockTemplatePipeline.process.mockRejectedValue(new Error('Pipeline failed'));

      const result = await formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe(testTranscript); // Fallback to original
      expect(result.issues).toContain('Universal Cleanup failed, using original transcript');
      expect(result.confidence_score).toBe(0);
    });
  });
});
