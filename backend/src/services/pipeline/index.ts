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
import { RoleMapper } from './roleMapper.js';
import { PipelineInvariantError } from './errors.js';
import { StageTracer } from './StageTracer.js';
import { S1Output, S2Output, S3Output } from './schemas.js';

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
   * Execute the complete Mode 3 pipeline with automatic speaker mapping
   */
  async execute(
    awsResult: AWSTranscribeResult,
    cleanupProfile: 'default' | 'clinical_light' = 'default'
  ): Promise<StageResult<PipelineArtifacts>> {
    const pipelineStartTime = Date.now();
    const tracer = new StageTracer();
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
      // Validate AWS result before processing
      const validation = this.validateAWSResult(awsResult);
      if (!validation.valid) {
        throw new Error(`AWS result validation failed: ${validation.errors.join(', ')}`);
      }
      console.log('[Mode3Pipeline] AWS result validation passed');

      // S1: Ingest AWS JSON → IrDialog
      console.log('[Mode3Pipeline] Starting S1: Ingest AWS JSON');
      const s1Result = await this.s1Ingest.execute(awsResult);
      if (!s1Result.success || !s1Result.data) {
        throw new Error(`S1 failed: ${s1Result.error}`);
      }
      artifacts.ir = s1Result.data;
      artifacts.processingTime!.s1_ingest = s1Result.processingTime;

      // S1 Guard: Check speakers and segments
      const speakers = s1Result.data.turns?.map(t => t.speaker).filter(Boolean) || [];
      const segments = s1Result.data.turns || [];
      if (!speakers.length || !segments.length) {
        throw new PipelineInvariantError("S1_NO_SEGMENTS", { 
          speakers: speakers.length, 
          segments: segments.length 
        });
      }

      // S1 Trace
      tracer.mark("S1_INGEST", { 
        speakers: speakers,
        segments: segments
      });

      // S1 Schema Validation
      try {
        S1Output.parse(s1Result.data);
      } catch (err: any) {
        throw new PipelineInvariantError("SCHEMA_VIOLATION", { 
          stage: "S1", 
          issues: err.issues || err.message 
        });
      }

      // S2: Merge adjacent turns
      console.log('[Mode3Pipeline] Starting S2: Merge turns');
      const s2Result = await this.s2Merge.execute(s1Result.data);
      if (!s2Result.success || !s2Result.data) {
        throw new Error(`S2 failed: ${s2Result.error}`);
      }
      artifacts.ir = s2Result.data; // Update with merged dialog
      artifacts.processingTime!.s2_merge = s2Result.processingTime;

      // S2 Guard: Check turns
      const turns = s2Result.data.turns || [];
      if (!turns.length) {
        throw new PipelineInvariantError("S2_NO_TURNS", { 
          turns: 0 
        });
      }

      // S2 Trace
      tracer.mark("S2_MERGE", { 
        turns: turns
      });

      // S2 Schema Validation
      try {
        S2Output.parse(s2Result.data);
      } catch (err: any) {
        throw new PipelineInvariantError("SCHEMA_VIOLATION", { 
          stage: "S2", 
          issues: err.issues || err.message 
        });
      }

      // Pre-S3 Guard: Ensure roleMap object exists
      if (!artifacts.roleMap) {
        artifacts.roleMap = {};
      }

      // Role Mapping: Map AWS speaker labels (spk_0, spk_1, etc.) to roles
      console.log('[Mode3Pipeline] Starting Role Mapping');
      const roleMappingStart = Date.now();
      
      // Extract speakers from S2 result (these are AWS speaker labels: spk_0, spk_1, etc.)
      const s3Speakers = Array.from(new Set(s2Result.data.turns.map(turn => turn.speaker).filter(Boolean)));
      const s3Turns = s2Result.data.turns.map(turn => ({
        speaker: turn.speaker,
        startTime: turn.startTime,
        endTime: turn.endTime,
        text: turn.text,
        isPartial: turn.isPartial || false
      }));

      console.log(`[Mode3Pipeline] AWS speakers found: ${s3Speakers.join(', ')}`);
      console.log(`[Mode3Pipeline] Total turns: ${s3Turns.length}`);

      // Use defensive role mapping (enable heuristics for stage coverage test)
      const roleMap = RoleMapper.mapRoles(
        { speakers: s3Speakers, turns: s3Turns }, 
        { allowHeuristics: true }
      );
      
      const roleMappingTime = Date.now() - roleMappingStart;
      console.log(`[Mode3Pipeline] Role mapping completed in ${roleMappingTime}ms`);
      console.log(`[Mode3Pipeline] Role mapping result:`, roleMap);

      // S3 Guard: Check roleMap coverage - only enforce if we actually have >0 speakers and fallback wasn't single-only
      if (s3Speakers.length > 0 && (!roleMap || s3Speakers.some(s => !(s in roleMap)))) {
        if (Object.keys(roleMap || {}).length === 0) {
          console.warn("[Pipeline] Empty roleMap; proceeding with Unknown roles");
        } else {
          throw new PipelineInvariantError("S3_EMPTY_ROLEMAP", { 
            speakers: s3Speakers, 
            roleMap: roleMap 
          });
        }
      }
      console.error("[TRACE] S3_ROLEMAP", { keys: Object.keys(roleMap ?? {}) });

      // S3 Trace
      tracer.mark("S3_ROLEMAP", { 
        roleMap: roleMap
      });

      // S3 Schema Validation
      try {
        S3Output.parse({
          turns: s2Result.data.turns,
          roleMap: roleMap
        });
      } catch (err: any) {
        throw new PipelineInvariantError("SCHEMA_VIOLATION", { 
          stage: "S3", 
          issues: err.issues || err.message 
        });
      }

      // Store the roleMap directly (maps AWS speaker labels to roles)
      artifacts.roleMap = roleMap;
      artifacts.processingTime!.s3_role_map = roleMappingTime;


      // S4: Cleanup
      console.log('[Mode3Pipeline] Starting S4: Cleanup');
      const s4Result = await this.s4Cleanup.execute(s2Result.data, roleMap, cleanupProfile);
      if (!s4Result.success || !s4Result.data) {
        throw new Error(`S4 failed: ${s4Result.error}`);
      }
      artifacts.cleaned = s4Result.data;
      artifacts.processingTime!.s4_cleanup = s4Result.processingTime;

      // S4 Trace
      console.error("[TRACE] S4_SMOOTH", { turns: `len:${s4Result.data.turns?.length ?? 0}` });
      tracer.mark("S4_SMOOTH", { 
        turns: s4Result.data.turns || []
      });

      // S5: Generate narrative with clean turns
      console.log('[Mode3Pipeline] Starting S5: Generate narrative');
      const s5Result = await this.s5Narrative.execute(s4Result.data);
      if (!s5Result.success || !s5Result.data) {
        throw new Error(`S5 failed: ${s5Result.error}`);
      }
      
      // Store narrative result
      artifacts.narrative = s5Result.data;
      artifacts.processingTime!.s5_narrative = s5Result.processingTime;

      // Calculate total processing time
      const totalTime = Date.now() - pipelineStartTime;
      artifacts.processingTime!.total = totalTime;

      console.log(`[Mode3Pipeline] Pipeline completed in ${totalTime}ms`);

      // DONE Trace
      tracer.mark("DONE");

      return {
        success: true,
        data: {
          ir: artifacts.ir!,
          roleMap: artifacts.roleMap!,
          cleaned: artifacts.cleaned!,
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
   * Accept if diarization OR channel labels exist.
   * If neither, return validation error with helpful message.
   */
  validateAWSResult(awsResult: AWSTranscribeResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!awsResult) {
      errors.push('AWS result is null or undefined');
      return { valid: false, errors };
    }

    // Check for diarization (speaker labels)
    const hasSpeakerLabels = !!(awsResult.speaker_labels || awsResult.results?.items?.some((i: any) => i.speaker_label));
    
    // Check for channel labels
    const hasChannelLabels = !!(awsResult as any).channel_labels;

    // Accept if diarization OR channel labels exist
    if (!hasSpeakerLabels && !hasChannelLabels) {
      errors.push('no_diarization_or_channel_labels: AWS result contains neither speaker diarization nor channel labels. Mode 3 requires speaker diarization to be enabled.');
      return { valid: false, errors };
    }

    // Additional validation for basic structure
    if (!awsResult.results?.items) {
      errors.push('Missing results.items');
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
