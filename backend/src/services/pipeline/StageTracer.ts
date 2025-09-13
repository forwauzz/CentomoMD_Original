/**
 * StageTracer utility for pipeline instrumentation
 * 
 * Provides structured logging and tracing of pipeline stage execution
 * with payload sizes and metadata for debugging.
 */

export type TraceEvent = {
  stage: "S1_INGEST" | "S2_MERGE" | "S3_ROLEMAP" | "S4_SMOOTH" | "DONE";
  meta?: Record<string, unknown>;
  at: string; // ISO timestamp
};

export class StageTracer {
  private events: TraceEvent[] = [];
  
  constructor(private enabled = process.env.PIPELINE_TRACE === "1") {}
  
  mark(stage: TraceEvent["stage"], meta?: TraceEvent["meta"]) {
    if (!this.enabled) return;
    
    this.events.push({ stage, meta, at: new Date().toISOString() });
    
    // Vitest captures console.*; use console.error to ensure visibility in fail output
    const summarized = meta ? Object.fromEntries(
      Object.entries(meta).map(([k, v]) => [
        k, 
        Array.isArray(v) ? `len:${v.length}` : 
        (typeof v === "string" ? `${v.slice(0, 200)}...` : typeof v)
      ])
    ) : undefined;
    
    // Keep output concise
    console.error(`[TRACE] ${stage}`, summarized ?? "");
  }
  
  getEvents() { 
    return this.events; 
  }
}
