/**
 * Mode 3 Pipeline Orchestrator
 * S1-S5: AWS JSON → IrDialog → Role-mapped → Cleaned → Narrative
 */

import { 
  AWSTranscribeResult, 
  IrDialog, 
  RoleMap, 
  CleanedDialog, 
  PipelineArtifacts,
  StageResult 
} from '../../types/ir.js';
import { S1IngestAWS } from './stages/s1_ingest_aws.js';
import { S2Merge } from './stages/s2_merge.js';
import { S3RoleMap } from './stages/s3_role_map.js';
import { S4Cleanup } from './stages/s4_cleanup.js';
import { S5Narrative } from './stages/s5_narrative.js';
import { PIPELINE_CONFIG } from '../../config/pipeline.js';

export class Mode3Pipeline {
  private s1Ingest: S1IngestAWS;
  private s2Merge: S2Merge;
  private s3RoleMap: S3RoleMap;
  private s4Cleanup: S4Cleanup;
  private s5Narrative: S5Narrative;

  constructor() {
    this.s1Ingest = new S1IngestAWS();
    this.s2Merge = new S2Merge();
    this.s3RoleMap = new S3RoleMap();
    this.s4Cleanup = new S4Cleanup();
    this.s5Narrative = new S5Narrative();
  }

  /**
   * Execute the complete Mode 3 pipeline
   */
  async execute(
    awsResult: AWSTranscribeResult,
    cleanupProfile: 'default' | 'clinical_light' = 'default'
  ): Promise<StageResult<PipelineArtifacts>> {
    const pipelineStartTime = Date.now();
    const artifacts: Partial<PipelineArtifacts> = {
      processingTime: {
        s1_ingest: 0,
        s2_merge: 0,
        s3_role_map: 0,
        s4_cleanup: 0,
        s5_narrative: 0,
        total: 0
      }
    };

    try {
      // S1: Ingest AWS JSON → IrDialog
      console.log('[Mode3Pipeline] Starting S1: Ingest AWS JSON');
      const s1Result = await this.s1Ingest.execute(awsResult);
      if (!s1Result.success || !s1Result.data) {
        throw new Error(`S1 failed: ${s1Result.error}`);
      }
      artifacts.ir = s1Result.data;
      artifacts.processingTime!.s1_ingest = s1Result.processingTime;

      // S2: Merge adjacent turns
      console.log('[Mode3Pipeline] Starting S2: Merge turns');
      const s2Result = await this.s2Merge.execute(s1Result.data);
      if (!s2Result.success || !s2Result.data) {
        throw new Error(`S2 failed: ${s2Result.error}`);
      }
      artifacts.ir = s2Result.data; // Update with merged dialog
      artifacts.processingTime!.s2_merge = s2Result.processingTime;

      // S3: Role mapping
      console.log('[Mode3Pipeline] Starting S3: Role mapping');
      const s3Result = await this.s3RoleMap.execute(s2Result.data);
      if (!s3Result.success || !s3Result.data) {
        throw new Error(`S3 failed: ${s3Result.error}`);
      }
      artifacts.roleMap = s3Result.data;
      artifacts.processingTime!.s3_role_map = s3Result.processingTime;

      // S4: Cleanup
      console.log('[Mode3Pipeline] Starting S4: Cleanup');
      const s4Result = await this.s4Cleanup.execute(s2Result.data, s3Result.data, cleanupProfile);
      if (!s4Result.success || !s4Result.data) {
        throw new Error(`S4 failed: ${s4Result.error}`);
      }
      artifacts.cleaned = s4Result.data;
      artifacts.processingTime!.s4_cleanup = s4Result.processingTime;

      // S5: Generate narrative
      console.log('[Mode3Pipeline] Starting S5: Generate narrative');
      const s5Result = await this.s5Narrative.execute(s4Result.data);
      if (!s5Result.success || !s5Result.data) {
        throw new Error(`S5 failed: ${s5Result.error}`);
      }
      artifacts.narrative = s5Result.data;
      artifacts.processingTime!.s5_narrative = s5Result.processingTime;

      // Calculate total processing time
      const totalTime = Date.now() - pipelineStartTime;
      artifacts.processingTime!.total = totalTime;

      console.log(`[Mode3Pipeline] Pipeline completed in ${totalTime}ms`);

      return {
        success: true,
        data: {
          ir: artifacts.ir!,
          roleMap: artifacts.roleMap!,
          narrative: artifacts.narrative!,
          processingTime: artifacts.processingTime!
        },
        processingTime: totalTime
      };

    } catch (error) {
      const totalTime = Date.now() - pipelineStartTime;
      console.error('[Mode3Pipeline] Pipeline failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown pipeline error',
        processingTime: totalTime
      };
    }
  }

  /**
   * Execute individual pipeline stages for testing/debugging
   */
  async executeStage<T, R>(
    stageName: string,
    input: T
  ): Promise<StageResult<R>> {
    switch (stageName) {
      case 's1_ingest':
        return await this.s1Ingest.execute(input as AWSTranscribeResult) as StageResult<R>;
      case 's2_merge':
        return await this.s2Merge.execute(input as IrDialog) as StageResult<R>;
      case 's3_role_map':
        return await this.s3RoleMap.execute(input as IrDialog) as StageResult<R>;
      case 's4_cleanup':
        const { dialog, roleMap, profile } = input as { dialog: IrDialog; roleMap: RoleMap; profile: 'default' | 'clinical_light' };
        return await this.s4Cleanup.execute(dialog, roleMap, profile) as StageResult<R>;
      case 's5_narrative':
        return await this.s5Narrative.execute(input as CleanedDialog) as StageResult<R>;
      default:
        throw new Error(`Unknown stage: ${stageName}`);
    }
  }

  /**
   * Get pipeline configuration
   */
  getConfig() {
    return PIPELINE_CONFIG;
  }

  /**
   * Validate AWS Transcribe result before processing
   */
  validateAWSResult(awsResult: AWSTranscribeResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!awsResult) {
      errors.push('AWS result is null or undefined');
      return { valid: false, errors };
    }

    if (!awsResult.speaker_labels?.segments) {
      errors.push('Missing speaker_labels.segments');
    }

    if (!awsResult.results?.items) {
      errors.push('Missing results.items');
    }

    if (awsResult.speaker_labels?.segments && awsResult.speaker_labels.segments.length === 0) {
      errors.push('Empty speaker_labels.segments');
    }

    if (awsResult.results?.items && awsResult.results.items.length === 0) {
      errors.push('Empty results.items');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
