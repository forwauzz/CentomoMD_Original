import { describe, it, expect, beforeEach } from 'vitest';
import { Mode3Pipeline } from '../services/pipeline/index.js';
import { AWSTranscribeResult } from '../types/ir.js';

describe('Mode 3 Pipeline Integration', () => {
  let pipeline: Mode3Pipeline;

  beforeEach(() => {
    pipeline = new Mode3Pipeline();
  });

  describe('Complete Pipeline Execution', () => {
    it('should execute full pipeline S1-S5 with default profile', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '3.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '1.5',
                  speaker_label: 'spk_0'
                },
                {
                  start_time: '1.5',
                  end_time: '3.0',
                  speaker_label: 'spk_0'
                }
              ]
            },
            {
              start_time: '4.0',
              end_time: '7.0',
              speaker_label: 'spk_1',
              items: [
                {
                  start_time: '4.0',
                  end_time: '7.0',
                  speaker_label: 'spk_1'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.5',
              alternatives: [{ confidence: '0.95', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              start_time: '1.5',
              end_time: '3.0',
              alternatives: [{ confidence: '0.88', content: 'docteur' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ',' }],
              type: 'punctuation'
            },
            {
              start_time: '4.0',
              end_time: '7.0',
              alternatives: [{ confidence: '0.92', content: 'Comment' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: '?' }],
              type: 'punctuation'
            }
          ]
        }
      };

      const result = await pipeline.execute(awsResult, 'default');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Verify S1: Ingest
      expect(result.data!.ir).toBeDefined();
      expect(result.data!.ir.turns).toHaveLength(2);
      expect(result.data!.ir.metadata.speakerCount).toBe(2);

      // Verify S3: Role mapping
      expect(result.data!.roleMap).toBeDefined();
      expect(result.data!.roleMap['spk_0']).toBe('PATIENT');
      expect(result.data!.roleMap['spk_1']).toBe('CLINICIAN');

      // Verify S4: Cleanup
      expect(result.data!.cleaned).toBeDefined();
      expect(result.data!.cleaned.turns).toHaveLength(2);
      expect(result.data!.cleaned.turns[0].role).toBe('PATIENT');
      expect(result.data!.cleaned.turns[1].role).toBe('CLINICIAN');

      // Verify S5: Narrative
      expect(result.data!.narrative).toBeDefined();
      expect(result.data!.narrative.format).toBe('role_prefixed');
      expect(result.data!.narrative.content).toContain('PATIENT:');
      expect(result.data!.narrative.content).toContain('CLINICIAN:');

      // Verify processing times
      expect(result.data!.processingTime.s1_ingest).toBeGreaterThan(0);
      expect(result.data!.processingTime.s2_merge).toBeGreaterThan(0);
      expect(result.data!.processingTime.s3_role_map).toBeGreaterThan(0);
      expect(result.data!.processingTime.s4_cleanup).toBeGreaterThan(0);
      expect(result.data!.processingTime.s5_narrative).toBeGreaterThan(0);
      expect(result.data!.processingTime.total).toBeGreaterThan(0);
    });

    it('should execute pipeline with clinical_light profile', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '3.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '3.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.90', content: 'Je' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ' ' }],
              type: 'punctuation'
            },
            {
              start_time: '1.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.85', content: 'prends' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ' ' }],
              type: 'punctuation'
            },
            {
              start_time: '2.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.88', content: '50mg' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await pipeline.execute(awsResult, 'clinical_light');

      expect(result.success).toBe(true);
      expect(result.data!.cleaned.profile).toBe('clinical_light');
      expect(result.data!.narrative.format).toBe('single_block');
    });

    it('should handle single speaker correctly', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '3.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '3.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.90', content: 'Je' }],
              type: 'pronunciation'
            },
            {
              alternatives: [{ confidence: '1.0', content: ' ' }],
              type: 'punctuation'
            },
            {
              start_time: '1.0',
              end_time: '3.0',
              alternatives: [{ confidence: '0.85', content: 'souffre' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await pipeline.execute(awsResult, 'default');

      expect(result.success).toBe(true);
      expect(result.data!.roleMap['spk_0']).toBe('PATIENT');
      expect(result.data!.narrative.format).toBe('single_block');
      expect(result.data!.narrative.metadata.totalSpeakers).toBe(1);
      expect(result.data!.narrative.metadata.patientTurns).toBe(1);
      expect(result.data!.narrative.metadata.clinicianTurns).toBe(0);
    });
  });

  describe('Pipeline Validation', () => {
    it('should validate AWS result before processing', () => {
      const validResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '2.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const validation = pipeline.validateAWSResult(validResult);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid AWS results', () => {
      const invalidResult = null as any;
      const validation = pipeline.validateAWSResult(invalidResult);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('AWS result is null or undefined');
    });

    it('should detect missing speaker labels', () => {
      const invalidResult: AWSTranscribeResult = {
        results: {
          items: []
        }
      } as any;

      const validation = pipeline.validateAWSResult(invalidResult);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing speaker_labels.segments');
    });

    it('should detect empty segments', () => {
      const invalidResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: []
        },
        results: {
          items: []
        }
      };

      const validation = pipeline.validateAWSResult(invalidResult);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Empty speaker_labels.segments');
    });
  });

  describe('Individual Stage Execution', () => {
    it('should execute individual stages for testing', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '2.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      // Test S1 individually
      const s1Result = await pipeline.executeStage('s1_ingest', awsResult);
      expect(s1Result.success).toBe(true);
      expect(s1Result.data).toBeDefined();

      // Test S2 individually
      const s2Result = await pipeline.executeStage('s2_merge', s1Result.data);
      expect(s2Result.success).toBe(true);

      // Test S3 individually
      const s3Result = await pipeline.executeStage('s3_role_map', s2Result.data);
      expect(s3Result.success).toBe(true);
    });

    it('should handle unknown stage names', async () => {
      await expect(
        pipeline.executeStage('unknown_stage', {})
      ).rejects.toThrow('Unknown stage: unknown_stage');
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to pipeline configuration', () => {
      const config = pipeline.getConfig();
      
      expect(config).toBeDefined();
      expect(config.ingest).toBeDefined();
      expect(config.merge).toBeDefined();
      expect(config.roleMapping).toBeDefined();
      expect(config.cleanupProfiles).toBeDefined();
      expect(config.narrative).toBeDefined();
      expect(config.artifacts).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle pipeline failures gracefully', async () => {
      const invalidResult = null as any;
      
      const result = await pipeline.execute(invalidResult, 'default');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle stage failures and stop pipeline', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [] // Empty segments will cause S1 to fail
        },
        results: {
          items: []
        }
      };

      const result = await pipeline.execute(awsResult, 'default');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('S1 failed');
    });
  });

  describe('Performance', () => {
    it('should complete pipeline within reasonable time', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.0',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '2.0',
                  speaker_label: 'spk_0'
                }
              ]
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '2.0',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const startTime = Date.now();
      const result = await pipeline.execute(awsResult, 'default');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.data!.processingTime.total).toBeLessThan(1000);
    });
  });
});
