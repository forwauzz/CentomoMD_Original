import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UniversalCleanupLayer } from '../services/layers/UniversalCleanupLayer.js';
import { ClinicalEntities, CleanedInput } from '../../shared/types/clinical.js';

// Mock crypto
vi.mock('node:crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash')
  }))
}));

describe('UniversalCleanupLayer', () => {
  let layer: UniversalCleanupLayer;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env['OPENAI_API_KEY'] = 'test-key';
    process.env['OPENAI_MODEL'] = 'gpt-4o-mini';
    process.env['OPENAI_TEMPERATURE'] = '0.1';
    
    // Create mock client
    mockClient = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };
    
    // Create layer with injected mock client
    layer = new UniversalCleanupLayer(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Bilingual Parity Tests', () => {
    const frenchTranscript = `
      Le patient présente une douleur au genou droit depuis 2 semaines.
      Il a subi une chute en jouant au football.
      La douleur est évaluée à 7/10 sur l'échelle de douleur.
      Il a des difficultés à monter les escaliers.
      Aucune radiographie n'a été effectuée à ce jour.
    `;

    const englishTranscript = `
      The patient presents with right knee pain for 2 weeks.
      He fell while playing football.
      Pain is rated 7/10 on the pain scale.
      He has difficulty climbing stairs.
      No X-rays have been performed to date.
    `;

    it('should extract clinical entities from French transcript', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
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
              confidence: 0.9,
              issues: []
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await layer.process(frenchTranscript, {
        language: 'fr',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.clinical_entities.injury_location).toBe("genou droit");
      expect(cleanedInput.clinical_entities.pain_severity).toBe("7/10");
      expect(cleanedInput.clinical_entities.language).toBe("fr");
      expect(cleanedInput.meta.language).toBe("fr");
    });

    it('should extract clinical entities from English transcript', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "right knee",
              injury_type: "pain",
              onset: "2 weeks ago",
              pain_severity: "7/10",
              functional_limitations: ["difficulty climbing stairs"],
              previous_injuries: [],
              treatment_to_date: [],
              imaging_done: [],
              return_to_work: "Not applicable at this time",
              language: "en",
              confidence: 0.9,
              issues: []
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await layer.process(englishTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.clinical_entities.injury_location).toBe("right knee");
      expect(cleanedInput.clinical_entities.pain_severity).toBe("7/10");
      expect(cleanedInput.clinical_entities.language).toBe("en");
      expect(cleanedInput.meta.language).toBe("en");
    });

    it('should use correct prompt for French language', async () => {
      mockClient.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{}' } }]
      });

      await layer.process(frenchTranscript, {
        language: 'fr',
        source: 'ambient'
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Vous êtes un assistant NLP clinique')
            })
          ])
        })
      );
    });

    it('should use correct prompt for English language', async () => {
      mockClient.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{}' } }]
      });

      await layer.process(englishTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('You are a clinical NLP assistant')
            })
          ])
        })
      );
    });
  });

  describe('No-Entity Grace Tests', () => {
    it('should handle empty transcript gracefully', async () => {
      const result = await layer.process('', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.cleaned_text).toBe('');
      expect(cleanedInput.clinical_entities).toBeDefined();
      expect(cleanedInput.clinical_entities.issues).toContain('Empty transcript provided');
    });

    it('should handle short transcript gracefully', async () => {
      const shortTranscript = 'Hello';
      
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: undefined,
              injury_type: undefined,
              onset: undefined,
              pain_severity: undefined,
              functional_limitations: [],
              previous_injuries: [],
              treatment_to_date: [],
              imaging_done: [],
              return_to_work: undefined,
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await layer.process(shortTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.cleaned_text).toBe(shortTranscript);
      expect(cleanedInput.clinical_entities).toBeDefined();
      expect(cleanedInput.clinical_entities.injury_location).toBeUndefined();
    });

    it('should handle non-medical transcript gracefully', async () => {
      const nonMedicalTranscript = 'The weather is nice today. I went for a walk.';
      
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: undefined,
              injury_type: undefined,
              onset: undefined,
              pain_severity: undefined,
              functional_limitations: [],
              previous_injuries: [],
              treatment_to_date: [],
              imaging_done: [],
              return_to_work: undefined,
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await layer.process(nonMedicalTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.cleaned_text).toBe(nonMedicalTranscript);
      expect(cleanedInput.clinical_entities).toBeDefined();
    });
  });

  describe('Determinism Tests', () => {
    const testTranscript = `
      Patient presents with left shoulder pain for 3 days.
      Pain started after lifting heavy boxes at work.
      Pain is rated 6/10 on the pain scale.
      Patient has difficulty reaching overhead.
      No previous injuries to the shoulder.
    `;

    it('should produce identical results with temperature 0.1 (3 runs)', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "left shoulder",
              injury_type: "pain",
              onset: "3 days ago",
              pain_severity: "6/10",
              functional_limitations: ["difficulty reaching overhead"],
              previous_injuries: [],
              treatment_to_date: [],
              imaging_done: [],
              return_to_work: "May need modified duties",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      // Run the same request 3 times
      const results = await Promise.all([
        layer.process(testTranscript, { language: 'en', source: 'ambient' }),
        layer.process(testTranscript, { language: 'en', source: 'ambient' }),
        layer.process(testTranscript, { language: 'en', source: 'ambient' })
      ]);

      // All results should be identical
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);

      const cleanedInput1 = results[0].data as CleanedInput;
      const cleanedInput2 = results[1].data as CleanedInput;
      const cleanedInput3 = results[2].data as CleanedInput;

      expect(cleanedInput1.clinical_entities).toEqual(cleanedInput2.clinical_entities);
      expect(cleanedInput2.clinical_entities).toEqual(cleanedInput3.clinical_entities);
    });

    it('should use temperature 0.1 for deterministic results', async () => {
      mockClient.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{}' } }]
      });

      await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.1
        })
      );
    });
  });

  describe('Performance Logging Tests', () => {
    it('should include processing_ms in meta', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "test",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await layer.process('Test transcript', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.meta.processing_ms).toBeDefined();
      expect(typeof cleanedInput.meta.processing_ms).toBe('number');
      expect(cleanedInput.meta.processing_ms).toBeGreaterThan(0);
    });

    it('should warn if processing takes longer than 2 seconds', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock a slow response
      mockClient.completions.create.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            choices: [{
              message: {
                content: JSON.stringify({
                  injury_location: "test",
                  language: "en"
                })
              }
            }]
          }), 2500) // 2.5 seconds
        )
      );

      const result = await layer.process('Test transcript', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Universal Cleanup processing took longer than 2 seconds')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Tests', () => {
    it('should return cached result for same transcript and language', async () => {
      const testTranscript = 'Patient has knee pain';
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "knee",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      // First call
      const result1 = await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      // Second call with same transcript
      const result2 = await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Second call should use cache (no OpenAI call)
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);

      const cleanedInput1 = result1.data as CleanedInput;
      const cleanedInput2 = result2.data as CleanedInput;

      expect(cleanedInput1.clinical_entities).toEqual(cleanedInput2.clinical_entities);
      expect(cleanedInput2.meta.used_cache).toBe(true);
    });

    it('should not cache different languages for same transcript', async () => {
      const testTranscript = 'Patient has knee pain';
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "knee",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      // Call with English
      await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      // Call with French
      await layer.process(testTranscript, {
        language: 'fr',
        source: 'ambient'
      });

      // Should make 2 OpenAI calls (different languages)
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    it('should not cache different transcripts', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "knee",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      // Call with first transcript
      await layer.process('Patient has knee pain', {
        language: 'en',
        source: 'ambient'
      });

      // Call with different transcript
      await layer.process('Patient has back pain', {
        language: 'en',
        source: 'ambient'
      });

      // Should make 2 OpenAI calls (different transcripts)
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockClient.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'));

      const result = await layer.process('Test transcript', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.clinical_entities.issues).toContain(
        expect.stringContaining('Extraction failed: OpenAI API error')
      );
    });

    it('should handle malformed JSON response gracefully', async () => {
      mockClient.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      });

      const result = await layer.process('Test transcript', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.clinical_entities.issues).toContain(
        expect.stringContaining('Extraction failed')
      );
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env['OPENAI_API_KEY'];

      const result = await layer.process('Test transcript', {
        language: 'en',
        source: 'ambient'
      });

      expect(result.success).toBe(true); // Should fallback gracefully
      expect(result.data).toBeDefined();
      
      const cleanedInput = result.data as CleanedInput;
      expect(cleanedInput.clinical_entities.issues).toContain(
        expect.stringContaining('Extraction failed')
      );
    });
  });

  describe('Template Swap Reuse Tests', () => {
    it('should reuse clinical entities for same transcript hash', async () => {
      const testTranscript = 'Patient has shoulder pain for 1 week';
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              injury_location: "shoulder",
              injury_type: "pain",
              onset: "1 week ago",
              language: "en"
            })
          }
        }]
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      // First call
      const result1 = await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      // Second call with identical transcript (should use cache)
      const result2 = await layer.process(testTranscript, {
        language: 'en',
        source: 'ambient'
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Should only call OpenAI once
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);

      const cleanedInput1 = result1.data as CleanedInput;
      const cleanedInput2 = result2.data as CleanedInput;

      // Results should be identical
      expect(cleanedInput1.clinical_entities).toEqual(cleanedInput2.clinical_entities);
      expect(cleanedInput2.meta.used_cache).toBe(true);
    });
  });
});
