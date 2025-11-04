### Purpose

This document briefs an external consultant on our current prompt/artifact pipeline, recent model-selection improvements, and a proposed, low-risk plan to version prompts and artifacts per template (with rollback), without breaking existing infrastructure.

### Current Context (High-Level)

- **Templates in active use**
  - `section7-ai-formatter` (OpenAI-first formatter)
  - `section7-rd` (R&D pipeline using master JSON, system XML, plan XML, golden cases JSONL)
  - `section8-ai-formatter`

- **Runtime artifacts (repo-local today)**
  - `prompts/section7_master.md`, `prompts/section7_master.json`, `prompts/section7_golden_example.md`
  - `prompts/system_section7_fr.xml`, `prompts/plan_section7_fr.xml`
  - `training/golden_cases_section7.jsonl`
  - Section 8 equivalents (master + golden example)

- **Model selection & proofing (implemented)**
  - Frontend model selector (feature-flagged) → Backend carries `model` through both `section7-ai-formatter` and `section7-rd`.
  - OpenAI provider: handles newer models (gpt-5/o3) with `max_completion_tokens` and default temperature (1).
  - Google Gemini provider: explicit model mapping and empty-response diagnostics.
  - `[PROOF]` logs indicate requested vs actual model, mismatches, fallbacks.

- **Auth & flags**
  - Feature flags: `FEATURE_MODEL_SELECTION*` (backend) and `VITE_FEATURE_MODEL_SELECTION*` (frontend).
  - Optional allowlist for experiment routing.

### Key Risks Today

- Artifacts are repo-local; deployment without those files breaks formatters.
- Mixed artifact formats (MD/JSON/XML/JSONL) across templates; no unified manifest.
- No first-class artifact versioning; rollbacks rely on git history and file swaps.
- Path resolution depends on `process.cwd()`; fragile across environments.

### Goal

Introduce versioned, immutable prompt/artifact bundles per template, with fast rollback and optional canarying, while keeping current code paths working (zero downtime, minimal changes).

### MVP Baseline (Fallback‑Only)

- For now, each template keeps a local `manifest.json` that defines which version directory to use.
- Rollback = edit `defaultVersion` in the manifest and redeploy (no DB/Storage dependency).
- This establishes the minimum viable flow before introducing Supabase as the source of truth.

### Proposed Architecture (Incremental, Non-Breaking)

1) Versioned bundles alongside current layout
  - Keep existing paths working.
  - Add versioned directories per template:
    - `prompts/section7/v1.2.0/{system.xml, plan.xml, section7_master.md, section7_master.json, section7_golden_example.md}`
    - `training/section7/v1.2.0/golden_cases_section7.jsonl`
    - `configs/section7/v1.2.0/master_prompt_section7.json`
  - Add aliases: `prompts/section7/latest -> v1.2.0` and `prompts/section7/stable -> v1.1.0`.

2) Manifest-driven resolution (fallback to current paths)
  - Per-template manifest (checked into repo or DB):
    - `templates/section7/manifest.json`:
      - `defaultVersion`: "1.2.0"
      - `versions`: map of version → artifact relative paths + SHA256
      - optional `minAppVersion`, notes
  - Backend resolver uses manifest if present; otherwise, falls back to current paths.
  - Emit `[PROOF]` with `templateId`, `templateVersion`, source (local/remote), and artifact hashes.

3) Storage on Supabase (progressive externalization)
  - Supabase Storage bucket `template-artifacts` (private):
    - Keys: `section7/v1.2.0/...` (immutable), plus `stable/` and `latest/` aliases
  - Supabase Postgres metadata (control plane):
    - `templates` (id, name, default_version_id, enabled)
    - `template_versions` (id, template_id, semver, status, created_by, changelog)
    - `artifacts` (template_version_id, kind, storage_path, sha256, size_bytes, content_type, locale)
    - `template_combinations` (template_id, version_id, layer_stack jsonb, mode_id, section_id, enabled)
    - `prompts` (template_version_id, role=system|manager|user, locale, storage_path, sha256)
  - Source of truth: Supabase (Storage + Postgres) governs deployed environments; repo manifests are a fallback for local/dev.
  - Resolver order: Postgres manifest → Storage (signed download) → local cache → filesystem fallback.

4) Rollout & rollback
  - Default remains current filesystem paths until `FEATURE_TEMPLATE_VERSION_SELECTION` is set ON.
  - To roll forward: publish new bundle, update manifest `defaultVersion` or `latest` alias.
  - To rollback: switch `defaultVersion` to previous or point `stable` alias.
  - Canary: route allowlisted users or % traffic to `latest`, others to `stable`.

  Simple rollback example (non‑technical):

  - Current state: `templates/section7/manifest.json → defaultVersion: "1.2.0"`
  - Rollback to previous stable: `templates/section7/manifest.json → defaultVersion: "1.1.0"`
  - Commit and push: `git commit -am "Rollback Section7 to 1.1.0 (stable)"`

5) Integrity, safety, and observability
  - Compute SHA256 on upload; verify on fetch; cache by hash.
  - Startup validator (non-blocking): ensure `defaultVersion` artifacts exist; warn if missing.
  - Provenance logs per request (compact):
    - `[PROOF] template=section7 version=v1.2.0 model=gpt-5 hash=fa23 status=ok`
    - Full details remain available behind a debug flag.

### Minimal Backend Changes (When Implemented)

- Add `templateVersion?` to `ProcessingRequest` (optional).
- Introduce `PromptBundleResolver` (formerly "TemplateArtifactResolver") used by both `section7-ai-formatter` and `section7-rd`.
- Add `FEATURE_TEMPLATE_VERSION_SELECTION` (default OFF).
- Keep all existing routes and behavior; resolver falls back to current paths.

### Template Combinations, Layers, and Modes

- Persist combinations (`template_combinations.layer_stack`) to reliably reproduce complex stacks used by `LayerManager`.
- Resolver composes base bundle + layers prior to provider calls.
- Expose a combination id to frontend and store in run metadata for audit.
- Note: `template_combinations` is the canonical "template" entity in production; we will anchor versioning and artifact binding to this table.

### Manager/System/User Prompt Coverage

- Store manager prompts (and checklist JSON) as artifacts; version alongside bundle.
- System prompts and optional user prompt templates are first-class artifacts in the bundle.
- Section 8 mirrors the same structure.

### Phased Plan (Suggested)

- Phase 0: Add manifests for Section 7 + validator (no storage, no flags). Verify fallback.
- Phase 1: Add Supabase Storage + Postgres tables; publish `v1.0.0` bundles in parallel with repo files.
- Phase 2: Enable `FEATURE_TEMPLATE_VERSION_SELECTION` in dev; route dev traffic to `latest`; bake-in.
- Phase 3: Promote `stable` in prod; optionally enable version selection for operators.
- Phase 4: Add CI checks for bundle completeness and schema validity; add A/B benchmarking by `templateVersion`.

### Governance and Compliance

- Promotion criteria: before promoting a bundle to `stable`, validation and physician review (golden case verification) are required.
- Compliance scope: all Supabase and cached artifacts must remain in `ca-central-1` (Canada region) to comply with Law 25 and PIPEDA.

### Open Questions for Consultant

- Do we need per-locale versioning timelines (fr/en diverge) or a single semver across locales?
- Is an external manifest (DB-backed) preferable to repo JSON for change governance?
- What SLOs and cache strategies are recommended for frequently updated artifacts (e.g., golden cases)?
- Any compliance constraints for artifact storage/retention (HIPAA/PIPEDA/Law 25) that favor one design?
- Should we integrate a signing/attestation step for artifact bundles pre-deployment?

### Acceptance Considerations

- Non-breaking: legacy paths remain functional; versioning is opt-in via manifest/flag.
- Rollback is a manifest flip or alias switch; no code redeploy required.
- Observability improved via proof logs and artifact hashing.


