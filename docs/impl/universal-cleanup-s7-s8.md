🏥 Clinical Extraction → Universal Cleanup (S7) & Template Pipeline (S8)

Complete Implementation Plan (Backend + Frontend + Rollout)

0) Context & Goal

You currently have a working clinical extraction flow implemented as a separate template (template-clinical-extraction) that runs after S1–S5 (transcription).

The new goal is to refactor so that S7 "UniversalCleanup" (clean + entity extraction) runs before every template, and S8 "TemplatePipeline" formats using that unified output.

We keep the original template path for backward compatibility, behind a feature flag.

1) Architecture (Target)
S1–S5 (Transcribe) 
   → S7 UniversalCleanup (clean transcript + extract clinical entities)
   → S8 TemplatePipeline (Section7Enhanced | Section8Basic | Section11Legal | future)
   → Final Output → Frontend display


Key properties

Single seam/DTO from S7 → S8 (CleanedInput).

Templates never read raw transcripts; only the cleaned text and clinical entities.

UniversalCleanup is language-aware (fr/en), fast (<2s), deterministic (temp 0.1), and uses OpenAI JSON mode (no free-text parsing).

Rollout with feature flag UNIVERSAL_CLEANUP_ENABLED.

2) Canonical Types (shared, strongly-typed)
// backend/shared/types/clinical.ts
export interface ClinicalEntities {
  injury_location?: string;
  injury_type?: string;
  onset?: string;
  pain_severity?: string;              // "8/10"
  functional_limitations?: string[];   // []
  previous_injuries?: string[];        // []
  treatment_to_date?: string[];        // []
  imaging_done?: string[];             // []
  return_to_work?: string;             // text paragraph
  language?: 'fr' | 'en';
  confidence?: number;                 // 0..1 (optional)
  issues?: string[];                   // warnings from validation
}

export interface CleanedInput {
  cleaned_text: string;
  clinical_entities: ClinicalEntities;
  meta: {
    processing_ms: number;
    source: 'ambient' | 'smart_dictation';
    language: 'fr' | 'en';
    used_cache?: boolean;
  };
}


Front-end mirror:

// frontend/src/types/clinical.ts
export type ClinicalEntities = {
  injury_location?: string;
  injury_type?: string;
  onset?: string;
  pain_severity?: string;
  functional_limitations?: string[];
  previous_injuries?: string[];
  treatment_to_date?: string[];
  imaging_done?: string[];
  return_to_work?: string;
  language?: 'fr' | 'en';
  confidence?: number;
};
export type CleanedInput = {
  cleaned_text: string;
  clinical_entities: ClinicalEntities;
  meta: { processing_ms: number; source: 'ambient'|'smart_dictation'; language: 'fr'|'en'; used_cache?: boolean };
};

3) Prompts (bilingual, JSON-only)

We will call OpenAI JSON mode and expect a pure JSON object (no free text).

// backend/src/prompts/clinical.ts
export const PROMPT_FR = `
Vous êtes un assistant NLP clinique. Extrayez les champs suivants d'un transcript médecin-patient.
Répondez UNIQUEMENT en JSON (un objet). Pas de texte libre.

Champs requis:
- injury_location (ex: "genou gauche")
- injury_type
- onset (ex: "il y a 2 semaines")
- pain_severity (ex: "7/10")
- functional_limitations (liste)
- previous_injuries (liste)
- treatment_to_date (liste)
- imaging_done (liste)
- return_to_work (court résumé textuel)

Transcript:
{{TRANSCRIPT}}
`;

export const PROMPT_EN = `
You are a clinical NLP assistant. Extract the fields below from a doctor-patient transcript.
Respond ONLY as JSON (a single object). No free text.

Required fields:
- injury_location
- injury_type
- onset
- pain_severity (e.g., "7/10")
- functional_limitations (array)
- previous_injuries (array)
- treatment_to_date (array)
- imaging_done (array)
- return_to_work (short text summary)

Transcript:
{{TRANSCRIPT}}
`;

4) S7 UniversalCleanup Layer (core logic)

Create a new processor that:

Cleans transcript: strip timestamps/hesitations, normalize whitespace.

Runs OpenAI JSON mode with the language-appropriate prompt.

Sanitizes arrays and normalizes values (e.g., ensure arrays are arrays).

Caches by sha256(cleaned_text) (10–30 min) to save cost/time.

Returns the CleanedInput DTO.

// backend/src/services/layers/UniversalCleanupLayer.ts
import { openai } from "@/lib/openai";
import { ClinicalEntities, CleanedInput } from "@/shared/types/clinical";
import { PROMPT_FR, PROMPT_EN } from "@/prompts/clinical";
import crypto from "node:crypto";

function pickPrompt(lang:'fr'|'en', t:string){ 
  return (lang==='fr' ? PROMPT_FR : PROMPT_EN).replace('{{TRANSCRIPT}}', t);
}

// Simple in-memory LRU (replace with your LRU if you have one)
const CACHE = new Map<string, CleanedInput>();
function getKey(text:string){ return crypto.createHash('sha256').update(text).digest('hex'); }
function sanitize(ce: Partial<ClinicalEntities>): ClinicalEntities {
  return {
    ...ce,
    functional_limitations: Array.isArray(ce.functional_limitations)? ce.functional_limitations : [],
    previous_injuries: Array.isArray(ce.previous_injuries)? ce.previous_injuries : [],
    treatment_to_date: Array.isArray(ce.treatment_to_date)? ce.treatment_to_date : [],
    imaging_done: Array.isArray(ce.imaging_done)? ce.imaging_done : [],
  };
}

export class UniversalCleanupLayer {
  async process(
    transcript: string,
    opts: { language:'fr'|'en', source:'ambient'|'smart_dictation' }
  ): Promise<CleanedInput> {
    const start = Date.now();
    const cleaned_text = transcript
      .replace(/\[(\d{2}:){1,2}\d{2}\]/g, "")           // timestamps like [00:12] or [01:02:03]
      .replace(/\b(uh|um|euh|hm)+\b/gi, "")             // hesitations
      .replace(/\s+/g, " ")
      .trim();

    const key = getKey(cleaned_text + '|' + opts.language);
    const cached = CACHE.get(key);
    if (cached) {
      return { ...cached, meta: { ...cached.meta, used_cache: true } };
    }

    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [{ role: "system", content: pickPrompt(opts.language, cleaned_text) }],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_output_tokens: 800
    });

    const raw = completion.output_text ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const clinical_entities = sanitize({
      ...parsed,
      language: opts.language,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined
    });

    const result: CleanedInput = {
      cleaned_text,
      clinical_entities,
      meta: { processing_ms: Date.now()-start, source: opts.source, language: opts.language, used_cache: false }
    };

    // cheap TTL cache (30 min)
    CACHE.set(key, result);
    setTimeout(() => CACHE.delete(key), 30*60*1000);

    return result;
  }
}

5) S8 Template Pipeline (consume CleanedInput)

A central TemplatePipeline accepts CleanedInput + template and dispatches to formatters:

Section7EnhancedFormatter

Section8BasicFormatter

Section11LegalFormatter

Each formatter uses input.cleaned_text as narrative source and input.clinical_entities for structured merges.

The formatter returns { formatted, issues, confidence_score }.

6) Layer registration & template-combos

Add new combo "universal-cleanup" with layer "universal-cleanup-layer".

Keep legacy "template-clinical-extraction" for compatibility (internally call the same UniversalCleanup to avoid drift).

// backend/config/layers/template-combinations.json (excerpt)
{
  "universal-cleanup": {
    "name": "Universal Cleanup",
    "description": "Cleanup + Clinical Entity Extraction (FR/EN)",
    "layers": ["universal-cleanup-layer"],
    "fallback": "template-only"
  },
  "template-clinical-extraction": {
    "name": "Section 7 + Clinical Extraction",
    "description": "Legacy clinical extraction template",
    "layers": ["universal-cleanup-layer"],
    "fallback": "template-only"
  }
}


Register in LayerManager:

// backend/src/services/layers/LayerManager.ts (excerpt)
import { UniversalCleanupLayer } from "./UniversalCleanupLayer";
layers.set("universal-cleanup-layer", new UniversalCleanupLayer());

7) Feature flag & env

Add UNIVERSAL_CLEANUP_ENABLED=false to .env.example.

Config loader should expose this boolean to backend & (read-only) to frontend (e.g., /api/config).

8) Formatter wiring (behind flag)

In backend/src/services/formatter/mode2.ts, when UNIVERSAL_CLEANUP_ENABLED === 'true':

Call UniversalCleanupLayer.process(...) to get CleanedInput.

Pass CleanedInput to TemplatePipeline.process(...).

Return { formatted, clinical_entities: input.clinical_entities, issues, confidence_score }.

If flag is false:

If templateCombo === 'template-clinical-extraction', use the legacy route but internally delegate to UniversalCleanupLayer so behavior aligns.

Otherwise, existing behavior.

Invariant: Templates never receive raw transcripts anymore—only CleanedInput.

9) Frontend integration (flag-aware)

Add frontend/src/types/clinical.ts (mirror types).

In TranscriptionInterface.tsx → injectTemplateContent():

Always build rawTranscript.

If config says UNIVERSAL_CLEANUP_ENABLED === true, POST /api/format/mode2 with { transcript, section, language, useUniversal: true, templateId }.

Expect { formatted, clinical_entities } → setEditedTranscript(formatted), setClinicalEntities(...).

Progress labels: "Cleaning transcript…" → "Extracting clinical entities…" → "Formatting…".

If flag is false, keep legacy (template-clinical-extraction) path.

10) Tests

Bilingual parity: FR vs EN samples produce consistent fields where applicable.

No-entity grace: Empty/short inputs return {clinical_entities:{}, cleaned_text:""}; pipeline never 500s.

Determinism: same input 3× → identical JSON (temp 0.1).

Performance: S7 p95 < 2s, end-to-end p95 < 5s (log metrics).

Template swap: Switching templates reuses same CleanedInput (no re-extraction if transcript hash unchanged).

11) Shadow compare (dev only)

In dev, provide an option to run both paths (legacy vs universal) and log:

checksum(formatted), keys present in clinical_entities, and any missing/extra fields.

Add a short README to enable/disable.

12) Rollout plan

Phase A (dual-run): Add universal path behind flag; keep legacy working.

Phase B (shadow): Compare diffs in dev; alert if mismatch above threshold.

Phase C (enable for Ambient): Turn flag ON for Ambient mode only; Smart Dictation stays legacy.

Phase D (unify): Point legacy template to universal internally; remove drift.

13) Success metrics

S7 p95 < 2s; pipeline p95 < 5s.

Extraction accuracy > 85% on curated set.

Zero crashes when fields are missing.

Cache hit rate > 70% for re-runs.

14) Guardrails

No renames unless explicitly listed.

No TODOs—write complete code.

Stop if TypeScript/build fails; fix before continuing.

Templates must not read raw transcript—only CleanedInput.

Confirm exact file paths & diffs before write.
