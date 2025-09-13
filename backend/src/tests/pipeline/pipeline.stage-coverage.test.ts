import { Mode3Pipeline } from "../../services/pipeline/index.js";
import { expect, test } from "vitest";

test("Pipeline reaches S3 and builds roleMap", async () => {
  // Create test AWS fixture data
  const awsFixture = {
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
          type: 'pronunciation',
          speaker_label: 'spk_0'
        },
        {
          start_time: '1.5',
          end_time: '3.0',
          alternatives: [{ confidence: '0.88', content: 'docteur' }],
          type: 'pronunciation',
          speaker_label: 'spk_0'
        },
        {
          alternatives: [{ confidence: '1.0', content: ',' }],
          type: 'punctuation',
          speaker_label: 'spk_0'
        },
        {
          start_time: '4.0',
          end_time: '7.0',
          alternatives: [{ confidence: '0.92', content: 'Comment' }],
          type: 'pronunciation',
          speaker_label: 'spk_1'
        },
        {
          alternatives: [{ confidence: '1.0', content: '?' }],
          type: 'punctuation',
          speaker_label: 'spk_1'
        }
      ]
    }
  };

  const pipeline = new Mode3Pipeline();
  const result = await pipeline.execute(awsFixture, 'en', 'default');

  // sanity
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.data!.ir.turns.length).toBeGreaterThan(0);
  
  // Check speakers are extracted
  const speakers = result.data!.ir.turns.map(t => t.speaker);
  expect(speakers).toContain("spk_0");
  expect(speakers).toContain("spk_1");

  // roleMap
  expect(result.data!.roleMap).toBeDefined();
  expect(result.data!.roleMap!["spk_0"]).toBeDefined();
  expect(result.data!.roleMap!["spk_1"]).toBeDefined();

  // trace proves stage progression
  const stages = (result._trace ?? []).map(e => e.stage);
  expect(stages).toContain("S1_INGEST");
  expect(stages).toContain("S2_MERGE");
  expect(stages).toContain("S3_ROLEMAP");
});
