export class PipelineInvariantError extends Error {
  constructor(public code: string, public details?: unknown) {
    super(code);
    this.name = "PipelineInvariantError";
  }
}
