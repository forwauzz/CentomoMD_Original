import { config } from '../../config/env.js';
import { TemplatePipeline } from '../formatter/TemplatePipeline.js';
import { ShadowComparison, ShadowComparisonResult } from './ShadowComparison.js';
import { ClinicalEntities } from '../../shared/types/clinical.js';

export interface ShadowModeOptions {
  transcript: string;
  section: string;
  language: 'fr' | 'en';
  templateId?: string;
}

export class ShadowModeHook {
  private static templatePipeline = new TemplatePipeline();

  static async runShadowComparison(options: ShadowModeOptions): Promise<ShadowComparisonResult | null> {
    // Only run in development and when shadow mode is enabled
    if (process.env['NODE_ENV'] !== 'development' || !config.features.universalCleanupShadow) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      console.log('🔄 SHADOW MODE: Running both legacy and universal cleanup paths...');
      
      // Run both paths in parallel
      const [legacyResult, universalResult] = await Promise.all([
        this.runLegacyPath(options),
        this.runUniversalPath(options)
      ]);

      // Compare the results
      const comparison = await ShadowComparison.compareOutputs(
        legacyResult.formatted,
        universalResult.formatted,
        legacyResult.clinical_entities,
        universalResult.clinical_entities,
        startTime
      );

      return comparison;
    } catch (error) {
      console.error('❌ SHADOW MODE ERROR:', error);
      return null;
    }
  }

  private static async runLegacyPath(options: ShadowModeOptions): Promise<{
    formatted: string;
    clinical_entities: ClinicalEntities | null;
  }> {
    // Import the legacy formatter dynamically to avoid circular dependencies
    const { Mode2Formatter } = await import('../formatter/mode2.js');
    
    // Temporarily disable universal cleanup for legacy path
    const originalFlag = process.env['UNIVERSAL_CLEANUP_ENABLED'];
    process.env['UNIVERSAL_CLEANUP_ENABLED'] = 'false';
    
    try {
      const formatter = new Mode2Formatter();
      const result = await formatter.format(options.transcript, {
        language: options.language,
        section: options.section as '7' | '8' | '11',
        case_id: options.templateId || ''
      });
      
      return {
        formatted: result.formatted || '',
        clinical_entities: result.clinical_entities || null
      };
    } finally {
      // Restore original flag
      if (originalFlag !== undefined) {
        process.env['UNIVERSAL_CLEANUP_ENABLED'] = originalFlag;
      } else {
        delete process.env['UNIVERSAL_CLEANUP_ENABLED'];
      }
    }
  }

  private static async runUniversalPath(options: ShadowModeOptions): Promise<{
    formatted: string;
    clinical_entities: ClinicalEntities | null;
  }> {
    // Import the universal cleanup layer dynamically
    const { UniversalCleanupLayer } = await import('../layers/UniversalCleanupLayer.js');
    
    // Temporarily enable universal cleanup for universal path
    const originalFlag = process.env['UNIVERSAL_CLEANUP_ENABLED'];
    process.env['UNIVERSAL_CLEANUP_ENABLED'] = 'true';
    
    try {
      // First run universal cleanup to get CleanedInput
      const universalCleanupLayer = new UniversalCleanupLayer();
      const cleanupResult = await universalCleanupLayer.process(options.transcript, {
        language: options.language,
        source: 'ambient'
      });
      
      if (!cleanupResult.success || !cleanupResult.data) {
        throw new Error('Universal cleanup failed');
      }
      
      // Then run template pipeline with the cleaned input
      const result = await this.templatePipeline.process(cleanupResult.data, {
        section: options.section as '7' | '8' | '11',
        language: options.language,
        templateId: options.templateId
      });
      
      return {
        formatted: result.formatted || '',
        clinical_entities: result.clinical_entities || null
      };
    } finally {
      // Restore original flag
      if (originalFlag !== undefined) {
        process.env['UNIVERSAL_CLEANUP_ENABLED'] = originalFlag;
      } else {
        delete process.env['UNIVERSAL_CLEANUP_ENABLED'];
      }
    }
  }
}
