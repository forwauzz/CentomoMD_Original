import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UniversalCleanupLayer } from '../services/layers/UniversalCleanupLayer.js';
import { TemplatePipeline } from '../services/formatter/TemplatePipeline.js';
import { Mode2Formatter } from '../services/formatter/mode2.js';
import { ClinicalEntities, CleanedInput } from '../../shared/types/clinical.js';

// Mock OpenAI
const mockCreate = vi.fn();
const mockOpenAI = vi.fn(() => ({
  chat: {
    completions: {
      create: mockCreate
    }
  }
}));

vi.mock('openai', () => ({
  default: mockOpenAI
}));

// Mock crypto
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash')
  }))
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

describe('Universal Cleanup Integration Tests', () => {
  let universalCleanupLayer: UniversalCleanupLayer;
  let templatePipeline: TemplatePipeline;
  let mode2Formatter: Mode2Formatter;
  
  beforeEach(() => {
    universalCleanupLayer = new UniversalCleanupLayer();
    templatePipeline = new TemplatePipeline();
    mode2Formatter = new Mode2Formatter();
    
    vi.clearAllMocks();
    
    // Setup environment variables
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['OPENAI_MODEL'] = 'gpt-4o-mini';
    process.env['OPENAI_TEMPERATURE'] = '0.1';
    process.env['UNIVERSAL_CLEANUP_ENABLED'] = 'true';
    
    // Setup default mocks
    mockExtractNameWhitelist.mockReturnValue(['Dr. Smith', 'Patient']);
    mockFormatWithGuardrails.mockResolvedValue({
      formatted: 'AI formatted text',
      issues: [],
      confidence_score: 0.9
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Flow Tests', () => {
    it('should complete full S7→S8 pipeline with French transcript', async () => {
      const frenchTranscript = `
        Le patient présente une douleur au genou droit depuis 2 semaines.
        Il a subi une chute en jouant au football.
        La douleur est évaluée à 7/10 sur l'échelle de douleur.
        Il a des difficultés à monter les escaliers.
        Aucune radiographie n'a été effectuée à ce jour.
      `;

      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "genou droit",
        injury_type: "douleur",
        onset: "il y a 2 semaines",
        pain_severity: "7/10",
        functional_limitations: ["difficultés à monter les escaliers"],
        previous_injuries: [],
        treatment_to_date: [],
        imaging_done: [],
        return_to_work: "Non applicable pour le moment",
        language: "fr",
        confidence: 0.9
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      // Step 1: Universal Cleanup (S7)
      const cleanupResult = await universalCleanupLayer.process(frenchTranscript, {
        language: 'fr',
        source: 'ambient'
      });

      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.data).toBeDefined();

      const cleanedInput = cleanupResult.data as CleanedInput;
      expect(cleanedInput.cleaned_text).toContain('genou droit');
      expect(cleanedInput.clinical_entities).toEqual(mockClinicalEntities);
      expect(cleanedInput.meta.language).toBe('fr');

      // Step 2: Template Pipeline (S8)
      const pipelineResult = await templatePipeline.process(cleanedInput, {
        language: 'fr',
        section: '7',
        templateId: 'test-template'
      });

      expect(pipelineResult.formatted).toBe('AI formatted text');
      expect(pipelineResult.clinical_entities).toEqual(mockClinicalEntities);
      expect(pipelineResult.confidence_score).toBe(0.9);

      // Step 3: Mode2Formatter integration
      const formatterResult = await mode2Formatter.format(frenchTranscript, {
        language: 'fr',
        section: '7'
      });

      expect(formatterResult.formatted).toBe('AI formatted text');
      expect(formatterResult.clinical_entities).toEqual(mockClinicalEntities);
      expect(formatterResult.confidence_score).toBe(0.9);
    });

    it('should complete full S7→S8 pipeline with English transcript', async () => {
      const englishTranscript = `
        Patient presents with right knee pain for 2 weeks.
        He fell while playing football.
        Pain is rated 7/10 on the pain scale.
        He has difficulty climbing stairs.
        No X-rays have been performed to date.
      `;

      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "right knee",
        injury_type: "pain",
        onset: "2 weeks ago",
        pain_severity: "7/10",
        functional_limitations: ["difficulty climbing stairs"],
        previous_injuries: [],
        treatment_to_date: [],
        imaging_done: [],
        return_to_work: "May need modified duties",
        language: "en",
        confidence: 0.9
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      // Step 1: Universal Cleanup (S7)
      const cleanupResult = await universalCleanupLayer.process(englishTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.data).toBeDefined();

      const cleanedInput = cleanupResult.data as CleanedInput;
      expect(cleanedInput.cleaned_text).toContain('right knee');
      expect(cleanedInput.clinical_entities).toEqual(mockClinicalEntities);
      expect(cleanedInput.meta.language).toBe('en');

      // Step 2: Template Pipeline (S8)
      const pipelineResult = await templatePipeline.process(cleanedInput, {
        language: 'en',
        section: '7',
        templateId: 'test-template'
      });

      expect(pipelineResult.formatted).toBe('AI formatted text');
      expect(pipelineResult.clinical_entities).toEqual(mockClinicalEntities);
      expect(pipelineResult.confidence_score).toBe(0.9);

      // Step 3: Mode2Formatter integration
      const formatterResult = await mode2Formatter.format(englishTranscript, {
        language: 'en',
        section: '7'
      });

      expect(formatterResult.formatted).toBe('AI formatted text');
      expect(formatterResult.clinical_entities).toEqual(mockClinicalEntities);
      expect(formatterResult.confidence_score).toBe(0.9);
    });
  });

  describe('Performance and Determinism Tests', () => {
    it('should maintain determinism across multiple runs', async () => {
      const testTranscript = 'Patient has shoulder pain for 1 week';
      
      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "shoulder",
        injury_type: "pain",
        onset: "1 week ago",
        pain_severity: "6/10",
        functional_limitations: [],
        previous_injuries: [],
        treatment_to_date: [],
        imaging_done: [],
        return_to_work: "May need modified duties",
        language: "en",
        confidence: 0.9
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      // Run the same request multiple times
      const results = await Promise.all([
        mode2Formatter.format(testTranscript, { language: 'en', section: '7' }),
        mode2Formatter.format(testTranscript, { language: 'en', section: '7' }),
        mode2Formatter.format(testTranscript, { language: 'en', section: '7' })
      ]);

      // All results should be identical
      expect(results[0].formatted).toBe(results[1].formatted);
      expect(results[1].formatted).toBe(results[2].formatted);
      expect(results[0].clinical_entities).toEqual(results[1].clinical_entities);
      expect(results[1].clinical_entities).toEqual(results[2].clinical_entities);
    });

    it('should complete processing within 2 seconds', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "knee",
        language: "en"
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      const startTime = Date.now();
      const result = await mode2Formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });
      const endTime = Date.now();

      expect(result.formatted).toBe('AI formatted text');
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Cache Behavior Tests', () => {
    it('should use cache for identical transcripts', async () => {
      const testTranscript = 'Patient has back pain for 3 days';
      
      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "back",
        language: "en"
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      // First call
      const result1 = await mode2Formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      // Second call with same transcript
      const result2 = await mode2Formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result1.formatted).toBe('AI formatted text');
      expect(result2.formatted).toBe('AI formatted text');
      expect(result1.clinical_entities).toEqual(result2.clinical_entities);

      // Should only call OpenAI once (cached on second call)
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should not cache different transcripts', async () => {
      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "knee",
        language: "en"
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValue(mockOpenAIResponse);

      // First call
      await mode2Formatter.format('Patient has knee pain', {
        language: 'en',
        section: '7'
      });

      // Second call with different transcript
      await mode2Formatter.format('Patient has back pain', {
        language: 'en',
        section: '7'
      });

      // Should call OpenAI twice (different transcripts)
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from OpenAI API errors', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      // First call fails
      mockCreate.mockRejectedValueOnce(new Error('OpenAI API error'));
      
      // Second call succeeds
      const mockClinicalEntities: ClinicalEntities = {
        injury_location: "knee",
        language: "en"
      };

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockClinicalEntities)
          }
        }]
      };

      mockCreate.mockResolvedValueOnce(mockOpenAIResponse);

      const result = await mode2Formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('AI formatted text');
      expect(result.clinical_entities).toEqual(mockClinicalEntities);
    });

    it('should handle malformed JSON responses gracefully', async () => {
      const testTranscript = 'Patient has knee pain for 2 weeks';
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      const result = await mode2Formatter.format(testTranscript, {
        language: 'en',
        section: '7'
      });

      expect(result.formatted).toBe('AI formatted text');
      expect(result.issues).toContain('Universal Cleanup failed, using original transcript');
    });
  });

  describe('Bilingual Consistency Tests', () => {
    it('should maintain consistent structure across languages', async () => {
      const frenchTranscript = 'Le patient a mal au genou';
      const englishTranscript = 'The patient has knee pain';
      
      const mockFrenchEntities: ClinicalEntities = {
        injury_location: "genou",
        language: "fr"
      };

      const mockEnglishEntities: ClinicalEntities = {
        injury_location: "knee",
        language: "en"
      };

      mockCreate
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockFrenchEntities)
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(mockEnglishEntities)
            }
          }]
        });

      const frenchResult = await mode2Formatter.format(frenchTranscript, {
        language: 'fr',
        section: '7'
      });

      const englishResult = await mode2Formatter.format(englishTranscript, {
        language: 'en',
        section: '7'
      });

      // Both should have the same structure
      expect(frenchResult.clinical_entities).toHaveProperty('injury_location');
      expect(frenchResult.clinical_entities).toHaveProperty('language');
      expect(englishResult.clinical_entities).toHaveProperty('injury_location');
      expect(englishResult.clinical_entities).toHaveProperty('language');

      // But different values
      expect(frenchResult.clinical_entities.language).toBe('fr');
      expect(englishResult.clinical_entities.language).toBe('en');
    });
  });
});
