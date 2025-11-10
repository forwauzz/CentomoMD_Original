/**
 * Clinical Extraction Layer (S6) - Bilingual French-English Entity Extraction
 * Integrates with template-combinations system for seamless processing
 */

import { LayerProcessor, LayerOptions, LayerResult } from './LayerManager.js';
import { FLAGS } from '../../config/flags.js';
import { getAIProvider } from '../../lib/aiProvider.js';

export interface ClinicalEntities {
  injury_location: string;
  injury_type: string;
  onset: string;
  pain_severity: string;
  functional_limitations: string[];
  previous_injuries: string;
  treatment_to_date: string[];
  imaging_done: string[];
  return_to_work: string;
  metadata: {
    confidence: number;
    language: 'fr' | 'en';
    processingTime: number;
    extractedAt: string;
  };
}

export class ClinicalExtractionLayer implements LayerProcessor {
  private cache = new Map<string, ClinicalEntities>();
  private readonly cacheSize = 50; // Limit cache size per project rules

  // French-first clinical extraction prompt
  private readonly FRENCH_PROMPT = `
Vous êtes un assistant NLP clinique. Extrayez les champs suivants du transcript médecin-patient. Répondez uniquement en format JSON.

Champs requis:
- injury_location (localisation de la blessure)
- injury_type (type de blessure)
- onset (début des symptômes)
- pain_severity (sévérité de la douleur, ex: 7/10)
- functional_limitations (limitations fonctionnelles - liste)
- previous_injuries (blessures antérieures)
- treatment_to_date (traitement à ce jour - liste)
- imaging_done (imagerie effectuée - liste)
- return_to_work (retour au travail - résumé textuel)

Transcript:
{{TRANSCRIPT}}

Répondez UNIQUEMENT en format JSON.
`;

  // English fallback prompt
  private readonly ENGLISH_PROMPT = `
You are a clinical NLP assistant. Extract the following fields from the doctor-patient transcript. Respond only in JSON format.

Required fields:
- injury_location
- injury_type
- onset
- pain_severity (e.g. 7/10)
- functional_limitations (list)
- previous_injuries
- treatment_to_date (list)
- imaging_done (list)
- return_to_work (text summary)

Transcript:
{{TRANSCRIPT}}

Respond ONLY in JSON format.
`;

  async process(transcript: string, options: LayerOptions): Promise<LayerResult> {
    const startTime = Date.now();
    const correlationId = options.correlationId || 'no-correlation-id';
    
    try {
      console.log(`[${correlationId}] Clinical extraction started`, {
        transcriptLength: transcript.length,
        language: options.language
      });

      // Check cache first (S6.4 - Caching for Reuse)
      const cacheKey = this.createCacheKey(transcript, options.language);
      if (this.cache.has(cacheKey)) {
        console.log(`[${correlationId}] Clinical extraction cache hit`);
        const cached = this.cache.get(cacheKey)!;
        return {
          success: true,
          data: cached,
          metadata: {
            processingTime: Date.now() - startTime,
            cached: true,
            language: options.language
          }
        };
      }

      // S6.1 - Input Preprocessing
      const cleanedTranscript = this.preprocessTranscript(transcript);
      
      // S6.2 - Entity Extraction Engine
      const clinicalEntities = await this.extractClinicalEntities(cleanedTranscript, options.language);
      
      // S6.3 - Validation & Cleaning
      const validatedEntities = this.validateAndClean(clinicalEntities);
      
      // Add metadata
      const result: ClinicalEntities = {
        ...validatedEntities,
        metadata: {
          confidence: this.calculateConfidence(validatedEntities),
          language: options.language,
          processingTime: Date.now() - startTime,
          extractedAt: new Date().toISOString()
        }
      };

      // Cache result (S6.4)
      this.manageCache(cacheKey, result);

      console.log(`[${correlationId}] Clinical extraction completed`, {
        processingTime: result.metadata.processingTime,
        confidence: result.metadata.confidence,
        entityCount: Object.keys(validatedEntities).length - 1 // Exclude metadata
      });

      return {
        success: true,
        data: result,
        metadata: {
          processingTime: result.metadata.processingTime,
          language: options.language,
          confidence: result.metadata.confidence
        }
      };

    } catch (error) {
      console.error(`[${correlationId}] Clinical extraction failed:`, error);
      
      // Return empty entities on failure (graceful degradation)
      const emptyEntities: ClinicalEntities = {
        injury_location: '',
        injury_type: '',
        onset: '',
        pain_severity: '',
        functional_limitations: [],
        previous_injuries: '',
        treatment_to_date: [],
        imaging_done: [],
        return_to_work: '',
        metadata: {
          confidence: 0,
          language: options.language,
          processingTime: Date.now() - startTime,
          extractedAt: new Date().toISOString()
        }
      };

      return {
        success: false,
        data: emptyEntities,
        metadata: {
          processingTime: Date.now() - startTime,
          language: options.language,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private preprocessTranscript(transcript: string): string {
    // S6.1 - Strip timestamps, hesitations, normalize casing/punctuation
    return transcript
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3}/g, '') // Remove timestamps
      .replace(/\[.*?\]/g, '') // Remove hesitations [um], [uh]
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async extractClinicalEntities(transcript: string, language: 'fr' | 'en'): Promise<Partial<ClinicalEntities>> {
    // Use appropriate prompt based on language
    const prompt = language === 'fr' ? this.FRENCH_PROMPT : this.ENGLISH_PROMPT;
    const formattedPrompt = prompt.replace('{{TRANSCRIPT}}', transcript);

    try {
      // Use flag-controlled default model
      const defaultModel = FLAGS.USE_CLAUDE_SONNET_4_AS_DEFAULT 
        ? 'claude-3-5-sonnet'  // Maps to claude-sonnet-4-20250514
        : (process.env['OPENAI_MODEL'] || 'gpt-4o-mini');

      // Use AIProvider abstraction instead of direct OpenAI call
      const provider = getAIProvider(defaultModel);

      const response = await provider.createCompletion({
        model: defaultModel,
        messages: [
          {
            role: "system",
            content: formattedPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const content = response.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI extraction failed:', error);
      throw new Error(`Clinical entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndClean(entities: Partial<ClinicalEntities>): Omit<ClinicalEntities, 'metadata'> {
    // S6.3 - Validate required fields and clean data
    const cleaned: Omit<ClinicalEntities, 'metadata'> = {
      injury_location: this.cleanString(entities.injury_location) || '',
      injury_type: this.cleanString(entities.injury_type) || '',
      onset: this.cleanString(entities.onset) || '',
      pain_severity: this.cleanString(entities.pain_severity) || '',
      functional_limitations: this.cleanArray(entities.functional_limitations) || [],
      previous_injuries: this.cleanString(entities.previous_injuries) || '',
      treatment_to_date: this.cleanArray(entities.treatment_to_date) || [],
      imaging_done: this.cleanArray(entities.imaging_done) || [],
      return_to_work: this.cleanString(entities.return_to_work) || ''
    };

    return cleaned;
  }

  private cleanString(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  private cleanArray(value: any): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private calculateConfidence(entities: Omit<ClinicalEntities, 'metadata'>): number {
    // Calculate confidence based on completeness and quality
    const fields = [
      entities.injury_location,
      entities.injury_type,
      entities.onset,
      entities.pain_severity,
      entities.functional_limitations.length,
      entities.previous_injuries,
      entities.treatment_to_date.length,
      entities.imaging_done.length,
      entities.return_to_work
    ];

    const filledFields = fields.filter(field => 
      (typeof field === 'string' && field.length > 0) || 
      (typeof field === 'number' && field > 0)
    ).length;

    return Math.min(filledFields / fields.length, 1.0);
  }

  private createCacheKey(transcript: string, language: 'fr' | 'en'): string {
    // Create hash for caching (simple hash for now)
    const content = `${language}:${transcript.substring(0, 200)}`;
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  private manageCache(key: string, entities: ClinicalEntities): void {
    // S6.4 - Cache management with size limit
    if (this.cache.size >= this.cacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, entities);
  }

  // Public method to clear cache (for testing)
  clearCache(): void {
    this.cache.clear();
  }

  // Public method to get cache stats
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize
    };
  }
}
