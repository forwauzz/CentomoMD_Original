import { createHash } from 'node:crypto';
import { ClinicalEntities } from '../../shared/types/clinical.js';

export interface ShadowComparisonResult {
  legacyFormatted: string;
  universalFormatted: string;
  legacyChecksum: string;
  universalChecksum: string;
  checksumMatch: boolean;
  legacyClinicalEntities: ClinicalEntities | null;
  universalClinicalEntities: ClinicalEntities | null;
  clinicalEntitiesMatch: boolean;
  missingKeys: string[];
  extraKeys: string[];
  processingTimeMs: number;
  timestamp: string;
}

export class ShadowComparison {
  private static getChecksum(text: string): string {
    return createHash('sha256').update(text).digest('hex').substring(0, 16);
  }

  private static getClinicalEntitiesKeys(entities: ClinicalEntities | null): string[] {
    if (!entities) return [];
    return Object.keys(entities).filter(key => entities[key as keyof ClinicalEntities] !== undefined);
  }

  private static compareClinicalEntities(
    legacy: ClinicalEntities | null,
    universal: ClinicalEntities | null
  ): { match: boolean; missingKeys: string[]; extraKeys: string[] } {
    const legacyKeys = this.getClinicalEntitiesKeys(legacy);
    const universalKeys = this.getClinicalEntitiesKeys(universal);
    
    const missingKeys = legacyKeys.filter(key => !universalKeys.includes(key));
    const extraKeys = universalKeys.filter(key => !legacyKeys.includes(key));
    
    return {
      match: missingKeys.length === 0 && extraKeys.length === 0,
      missingKeys,
      extraKeys
    };
  }

  static async compareOutputs(
    legacyFormatted: string,
    universalFormatted: string,
    legacyClinicalEntities: ClinicalEntities | null,
    universalClinicalEntities: ClinicalEntities | null,
    startTime: number
  ): Promise<ShadowComparisonResult> {
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    const legacyChecksum = this.getChecksum(legacyFormatted);
    const universalChecksum = this.getChecksum(universalFormatted);
    const checksumMatch = legacyChecksum === universalChecksum;

    const clinicalComparison = this.compareClinicalEntities(
      legacyClinicalEntities,
      universalClinicalEntities
    );

    const result: ShadowComparisonResult = {
      legacyFormatted,
      universalFormatted,
      legacyChecksum,
      universalChecksum,
      checksumMatch,
      legacyClinicalEntities,
      universalClinicalEntities,
      clinicalEntitiesMatch: clinicalComparison.match,
      missingKeys: clinicalComparison.missingKeys,
      extraKeys: clinicalComparison.extraKeys,
      processingTimeMs,
      timestamp: new Date().toISOString()
    };

    // Log the comparison results
    this.logComparison(result);

    return result;
  }

  private static logComparison(result: ShadowComparisonResult): void {
    console.log('\n🔍 SHADOW MODE COMPARISON:');
    console.log('=' .repeat(50));
    console.log(`⏱️  Processing Time: ${result.processingTimeMs}ms`);
    console.log(`📝 Formatted Text Checksums:`);
    console.log(`   Legacy:    ${result.legacyChecksum}`);
    console.log(`   Universal: ${result.universalChecksum}`);
    console.log(`   Match:     ${result.checksumMatch ? '✅' : '❌'}`);
    
    console.log(`\n🏥 Clinical Entities:`);
    console.log(`   Legacy Keys:    [${this.getClinicalEntitiesKeys(result.legacyClinicalEntities).join(', ')}]`);
    console.log(`   Universal Keys: [${this.getClinicalEntitiesKeys(result.universalClinicalEntities).join(', ')}]`);
    console.log(`   Match:          ${result.clinicalEntitiesMatch ? '✅' : '❌'}`);
    
    if (result.missingKeys.length > 0) {
      console.log(`   Missing Keys:   [${result.missingKeys.join(', ')}]`);
    }
    if (result.extraKeys.length > 0) {
      console.log(`   Extra Keys:     [${result.extraKeys.join(', ')}]`);
    }
    
    console.log('=' .repeat(50));
    console.log('');
  }
}
