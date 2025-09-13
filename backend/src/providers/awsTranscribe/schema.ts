import { z } from "zod";
import { PipelineInvariantError } from "../../services/pipeline/errors.js";

export const AwsTranscript = z.object({
  speaker_labels: z.object({
    segments: z.array(z.object({
      speaker_label: z.string(), // "spk_0"
      start_time: z.string(),
      end_time: z.string()
    })).optional()
  }).optional(),
  results: z.object({
    items: z.array(z.object({
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      type: z.enum(["pronunciation","punctuation"]),
      alternatives: z.array(z.object({ content: z.string() })).min(1)
    }))
  })
});

/**
 * Parse and validate AWS Transcribe JSON input
 * @param json - Raw JSON input from AWS Transcribe
 * @returns Typed AWS transcript object
 * @throws PipelineInvariantError if validation fails
 */
export function parseAwsTranscript(json: any): z.infer<typeof AwsTranscript> {
  try {
    return AwsTranscript.parse(json);
  } catch (err: any) {
    throw new PipelineInvariantError("AWS_INPUT_INVALID", {
      issues: err.issues || err.message,
      input: json
    });
  }
}
