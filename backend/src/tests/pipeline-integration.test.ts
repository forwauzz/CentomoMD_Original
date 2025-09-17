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

    it('should return standardized artifacts structure in result.data', async () => {
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
            }
          ]
        },
        results: {
          items: [
            {
              start_time: '0.0',
              end_time: '1.5',
              alternatives: [{ confidence: '0.90', content: 'Bonjour' }],
              type: 'pronunciation'
            },
            {
              start_time: '1.5',
              end_time: '3.0',
              alternatives: [{ confidence: '0.85', content: 'docteur' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await pipeline.execute(awsResult, 'default');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Assert standardized structure
      expect(result.data!.ir).toBeDefined();
      expect(result.data!.roleMap).toBeDefined();
      expect(result.data!.narrative).toBeDefined();
      expect(result.data!.processingTime).toBeDefined();

      // Assert specific artifact types
      expect(result.data!.ir).toHaveProperty('turns');
      expect(result.data!.ir).toHaveProperty('metadata');
      expect(Array.isArray(result.data!.ir.turns)).toBe(true);
      
      expect(typeof result.data!.roleMap).toBe('object');
      expect(result.data!.roleMap).not.toBeNull();
      
      expect(result.data!.narrative).toHaveProperty('content');
      expect(result.data!.narrative).toHaveProperty('format');
      
      expect(result.data!.processingTime).toHaveProperty('s1_ingest');
      expect(result.data!.processingTime).toHaveProperty('s2_merge');
      expect(result.data!.processingTime).toHaveProperty('s3_role_map');
      expect(result.data!.processingTime).toHaveProperty('s4_cleanup');
      expect(result.data!.processingTime).toHaveProperty('s5_narrative');
      expect(result.data!.processingTime).toHaveProperty('total');
      
      // Assert processing times are numbers
      expect(typeof result.data!.processingTime.s1_ingest).toBe('number');
      expect(typeof result.data!.processingTime.s2_merge).toBe('number');
      expect(typeof result.data!.processingTime.s3_role_map).toBe('number');
      expect(typeof result.data!.processingTime.s4_cleanup).toBe('number');
      expect(typeof result.data!.processingTime.s5_narrative).toBe('number');
      expect(typeof result.data!.processingTime.total).toBe('number');
    });

    it('should return data.ir, data.roleMap, data.narrative with correct structure', async () => {
      const awsResult: AWSTranscribeResult = {
        speaker_labels: {
          segments: [
            {
              start_time: '0.0',
              end_time: '2.5',
              speaker_label: 'spk_0',
              items: [
                {
                  start_time: '0.0',
                  end_time: '2.5',
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
              end_time: '2.5',
              alternatives: [{ confidence: '0.95', content: 'Bonjour docteur' }],
              type: 'pronunciation'
            }
          ]
        }
      };

      const result = await pipeline.execute(awsResult, 'default');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Test data.ir structure
      expect(result.data!.ir).toBeDefined();
      expect(result.data!.ir).toHaveProperty('turns');
      expect(result.data!.ir).toHaveProperty('metadata');
      expect(Array.isArray(result.data!.ir.turns)).toBe(true);
      expect(result.data!.ir.turns.length).toBeGreaterThan(0);
      expect(result.data!.ir.metadata).toHaveProperty('speakerCount');
      expect(result.data!.ir.metadata).toHaveProperty('totalDuration');

      // Test data.roleMap structure
      expect(result.data!.roleMap).toBeDefined();
      expect(typeof result.data!.roleMap).toBe('object');
      expect(result.data!.roleMap).not.toBeNull();
      // Should have speaker mappings like 'spk_0': 'PATIENT'
      const roleMapKeys = Object.keys(result.data!.roleMap);
      expect(roleMapKeys.length).toBeGreaterThan(0);
      roleMapKeys.forEach(key => {
        expect(['PATIENT', 'CLINICIAN']).toContain(result.data!.roleMap[key]);
      });

      // Test data.narrative structure
      expect(result.data!.narrative).toBeDefined();
      expect(result.data!.narrative).toHaveProperty('content');
      expect(result.data!.narrative).toHaveProperty('format');
      expect(typeof result.data!.narrative.content).toBe('string');
      expect(result.data!.narrative.content.length).toBeGreaterThan(0);
      expect(['role_prefixed', 'single_block']).toContain(result.data!.narrative.format);

      // Test data.processingTime structure
      expect(result.data!.processingTime).toBeDefined();
      expect(result.data!.processingTime).toHaveProperty('total');
      expect(typeof result.data!.processingTime.total).toBe('number');
      expect(result.data!.processingTime.total).toBeGreaterThan(0);
    });
  });
});
