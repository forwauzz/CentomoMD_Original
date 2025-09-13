import { z } from "zod";

export const SpeakerId = z.string().min(1);
export const Turn = z.object({
  speaker: SpeakerId,          // e.g., "spk_0"
  startTime: z.number().nonnegative(),  // seconds
  endTime: z.number().nonnegative(),    // seconds
  text: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  isPartial: z.boolean().optional()
});

export const S1Output = z.object({
  turns: z.array(Turn).min(1),
  metadata: z.object({
    source: z.literal('aws_transcribe'),
    language: z.string(),
    totalDuration: z.number().nonnegative(),
    speakerCount: z.number().nonnegative(),
    createdAt: z.date()
  })
});

export const S2Output = z.object({
  turns: z.array(Turn).min(1),
  metadata: z.object({
    source: z.literal('aws_transcribe'),
    language: z.string(),
    totalDuration: z.number().nonnegative(),
    speakerCount: z.number().nonnegative(),
    createdAt: z.date()
  })
});

export const S3Output = z.object({
  turns: z.array(Turn).min(1),
  roleMap: z.record(SpeakerId, z.enum(["PATIENT","CLINICIAN"]))
}).refine(
  (data) => {
    const speakers = data.turns.map(t => t.speaker);
    const uniqueSpeakers = [...new Set(speakers)];
    return uniqueSpeakers.every(s => s in data.roleMap);
  },
  { message: "roleMap must cover all speakers" }
);
