# TypeScript Error Report

- Total errors: 107
- Backend errors: 101
- Frontend errors: 6

## Top files by error count
- src/services/pipeline/smoother.ts: 34
- src/middleware/authMiddleware.ts: 22
- src/services/pipeline/stages/s1_ingest_aws.ts: 17
- src/services/pipeline/turnBuilder.ts: 8
- src/middleware/performanceMiddleware.ts: 6
- src/services/transcriptionService.ts: 3
- src/lib/supabaseClient.ts: 2
- src/services/pipeline/StageTracer.ts: 2
- src/services/pipeline/roleMapper.ts: 2
- src/services/pipeline/speakerNormalizer.ts: 2

## Recurring issue types
- Possibly undefined (TS18048): 42
- Property does not exist (TS2339): 23
- Object is possibly undefined/null (TS2532): 8
- Type mismatch (assignment) (TS2322): 7
- Unused variable (TS6133): 6
- Index signature property access required (TS4111): 5
- Type mismatch (call argument) (TS2345): 4
- Object literal extra/invalid properties (TS2353): 3
- Name not found (TS2304): 2
- Exact optional property types mismatch (TS2379): 2
- Not all code paths return a value (TS7030): 1
- Cannot find name (did you mean) (TS2552): 1
- Missing required property (TS2741): 1
- Unintentional comparison (no overlap) (TS2367): 1
- Module not found (TS2307): 1

## Errors by file

### src/components/transcription/__tests__/TranscriptionInterface.test.tsx (1)
- [frontend] TS2307 at 2:54 — Cannot find module 'vitest' or its corresponding type declarations.

### src/components/transcription/TranscriptionInterface.tsx (1)
- [frontend] TS2367 at 803:22 — This comparison appears to be unintentional because the types '"error" | "recording" | "idle" | "processing" | "ready"' and '"transcribing"' have no overlap.

### src/config/template-config.ts (2)
- [frontend] TS2353 at 131:7 — Object literal may only specify known properties, and 'comprehensivePrompts' does not exist in type '{ verbatimSupport: boolean; voiceCommandsSupport: boolean; aiFormatting: boolean; postProcessing: boolean; }'.
- [frontend] TS2353 at 143:7 — Object literal may only specify known properties, and 'comprehensivePrompts' does not exist in type '{ mode?: string | undefined; section?: string | undefined; language?: string | undefined; enforceWorkerFirst?: boolean | undefined; chronologicalOrder?: boolean | undefined; medicalTerminology?: boolean | undefined; templateCombo?: string | undefined; aiFormattingEnabled?: boolean | undefined; deterministicFirst?: b...'.

### src/controllers/transcriptController.ts (1)
- [backend] TS7030 at 43:20 — Not all code paths return a value.

### src/lib/authClient.ts (1)
- [frontend] TS2353 at 258:11 — Object literal may only specify known properties, and 'state' does not exist in type '{ redirectTo?: string | undefined; scopes?: string | undefined; queryParams?: { [key: string]: string; } | undefined; skipBrowserRedirect?: boolean | undefined; }'.

### src/lib/supabaseClient.ts (2)
- [backend] TS4111 at 8:27 — Property 'SUPABASE_URL' comes from an index signature, so it must be accessed with ['SUPABASE_URL'].
- [backend] TS4111 at 9:27 — Property 'SUPABASE_SERVICE_ROLE_KEY' comes from an index signature, so it must be accessed with ['SUPABASE_SERVICE_ROLE_KEY'].

### src/middleware/authMiddleware.ts (22)
- [backend] TS4111 at 94:43 — Property 'name' comes from an index signature, so it must be accessed with ['name'].
- [backend] TS2322 at 107:9 — Type 'null' is not assignable to type 'string'.
- [backend] TS2322 at 108:9 — Type '{ user_id: string; display_name: any; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id: null; }' is not assignable to type '{ display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }'.
- [backend] TS2339 at 124:24 — Property 'user_id' does not exist on type 'never'.
- [backend] TS2322 at 125:7 — Type 'string | undefined' is not assignable to type 'string'.
- [backend] TS2339 at 126:21 — Property 'display_name' does not exist on type 'never'.
- [backend] TS4111 at 126:57 — Property 'name' comes from an index signature, so it must be accessed with ['name'].
- [backend] TS2339 at 128:26 — Property 'default_clinic_id' does not exist on type 'never'.
- [backend] TS2339 at 130:31 — Property 'display_name' does not exist on type 'never'.
- [backend] TS2339 at 131:25 — Property 'locale' does not exist on type 'never'.
- [backend] TS2339 at 132:33 — Property 'consent_pipeda' does not exist on type 'never'.
- [backend] TS2339 at 133:36 — Property 'consent_marketing' does not exist on type 'never'.
- [backend] TS2339 at 134:36 — Property 'default_clinic_id' does not exist on type 'never'.
- [backend] TS2339 at 139:38 — Property 'user_id' does not exist on type 'never'.
- [backend] TS2339 at 176:26 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 213:24 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2304 at 252:44 — Cannot find name 'supabase'.
- [backend] TS2339 at 266:67 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 268:26 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 287:24 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2304 at 311:45 — Cannot find name 'supabase'.
- [backend] TS2552 at 319:37 — Cannot find name 'supabaseClient'. Did you mean 'getSupabaseClient'?

### src/middleware/errorHandler.ts (1)
- [backend] TS2339 at 183:23 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.

### src/middleware/performanceMiddleware.ts (6)
- [backend] TS2339 at 22:17 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 58:27 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 78:25 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 100:29 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 135:27 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.
- [backend] TS2339 at 160:27 — Property 'id' does not exist on type '{ user_id: string; email: string; name: string; role: string; clinic_id?: string; profile?: { display_name?: string; locale: string; consent_pipeda: boolean; consent_marketing: boolean; default_clinic_id?: string; }; }'.

### src/pages/ProfilePage.tsx (1)
- [frontend] TS6133 at 14:24 — 'uiToDbLocale' is declared but its value is never read.

### src/services/pipeline/roleMapper.ts (2)
- [backend] TS2322 at 211:13 — Type '"A" | "B" | undefined' is not assignable to type '"A" | "B"'.
- [backend] TS2322 at 220:13 — Type '"A" | "B" | undefined' is not assignable to type '"A" | "B"'.

### src/services/pipeline/smoother.ts (34)
- [backend] TS6133 at 33:27 — 'FILLER_DROP' is declared but its value is never read.
- [backend] TS18048 at 83:27 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 84:25 — 'item' is possibly 'undefined'.
- [backend] TS2379 at 100:21 — Argument of type '{ bucket: "A" | "B"; t0?: number; t1?: number; text?: string; conf?: number; filler?: boolean; }' is not assignable to parameter of type 'NormalizedItem' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
- [backend] TS2532 at 116:25 — Object is possibly 'undefined'.
- [backend] TS2532 at 117:24 — Object is possibly 'undefined'.
- [backend] TS2532 at 149:11 — Object is possibly 'undefined'.
- [backend] TS2532 at 150:11 — Object is possibly 'undefined'.
- [backend] TS2532 at 151:15 — Object is possibly 'undefined'.
- [backend] TS2532 at 152:13 — Object is possibly 'undefined'.
- [backend] TS18048 at 157:19 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 160:11 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 161:22 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 162:31 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 167:15 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 168:15 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 169:19 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 170:17 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 190:24 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 190:37 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 199:30 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 200:47 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 204:30 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 205:39 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 208:30 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 209:32 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 213:28 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 214:37 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 217:28 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 218:30 — 'segment' is possibly 'undefined'.
- [backend] TS2345 at 221:23 — Argument of type 'SmoothedSegment | undefined' is not assignable to parameter of type 'SmoothedSegment'.
- [backend] TS2345 at 225:21 — Argument of type 'SmoothedSegment | undefined' is not assignable to parameter of type 'SmoothedSegment'.
- [backend] TS2532 at 242:11 — Object is possibly 'undefined'.
- [backend] TS2532 at 242:31 — Object is possibly 'undefined'.

### src/services/pipeline/speakerNormalizer.ts (2)
- [backend] TS2322 at 235:9 — Type '{ t0: number; t1: number; bucket: "A" | "B"; text: string; conf: number; filler: boolean | undefined; }[]' is not assignable to type 'NormalizedItem[]'.
- [backend] TS2322 at 268:7 — Type '{ t0: number; t1: number; bucket: "A" | "B"; text: string; conf: number; filler: boolean | undefined; }[]' is not assignable to type 'NormalizedItem[]'.

### src/services/pipeline/stages/s1_ingest_aws.ts (17)
- [backend] TS2345 at 81:9 — Argument of type '{ speaker_label: string; start_time: string; end_time: string; }[]' is not assignable to parameter of type 'AWSSpeakerSegment[]'.
- [backend] TS6133 at 122:13 — 'endTime' is declared but its value is never read.
- [backend] TS18048 at 175:11 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 175:44 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 176:31 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 176:60 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 177:29 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 177:56 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 181:22 — 'item' is possibly 'undefined'.
- [backend] TS18048 at 208:15 — 'word' is possibly 'undefined'.
- [backend] TS18048 at 209:21 — 'word' is possibly 'undefined'.
- [backend] TS18048 at 212:20 — 'word' is possibly 'undefined'.
- [backend] TS18048 at 214:13 — 'nextItem' is possibly 'undefined'.
- [backend] TS18048 at 214:48 — 'nextItem' is possibly 'undefined'.
- [backend] TS18048 at 215:25 — 'nextItem' is possibly 'undefined'.
- [backend] TS18048 at 224:20 — 'nextItem' is possibly 'undefined'.
- [backend] TS6133 at 257:11 — 'endsWithPunctuation' is declared but its value is never read.

### src/services/pipeline/stages/s4_cleanup.ts (1)
- [backend] TS6133 at 120:11 — 'preserveMedicalTokens' is declared but its value is never read.

### src/services/pipeline/StageTracer.ts (2)
- [backend] TS4111 at 17:45 — Property 'PIPELINE_TRACE' comes from an index signature, so it must be accessed with ['PIPELINE_TRACE'].
- [backend] TS2379 at 22:22 — Argument of type '{ stage: "S1_INGEST" | "S2_MERGE" | "S3_ROLEMAP" | "S4_SMOOTH" | "DONE"; meta: Record<string, unknown> | undefined; at: string; }' is not assignable to parameter of type 'TraceEvent' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.

### src/services/pipeline/turnBuilder.ts (8)
- [backend] TS18048 at 58:31 — 'segment' is possibly 'undefined'.
- [backend] TS2345 at 61:48 — Argument of type 'SmoothedSegment | undefined' is not assignable to parameter of type 'SmoothedSegment'.
- [backend] TS18048 at 70:17 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 71:15 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 72:15 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 77:37 — 'segment' is possibly 'undefined'.
- [backend] TS18048 at 78:28 — 'segment' is possibly 'undefined'.
- [backend] TS6133 at 111:5 — 'roleMapping' is declared but its value is never read.

### src/services/transcriptionService.ts (3)
- [backend] TS2741 at 15:9 — Property 'AudioStream' is missing in type '{ LanguageCode: any; MediaEncoding: "pcm"; MediaSampleRateHertz: any; EnableChannelIdentification: false; }' but required in type 'StartStreamTranscriptionCommandInput'.
- [backend] TS2339 at 27:16 — Property 'MaxSpeakerLabels' does not exist on type 'StartStreamTranscriptionCommandInput'.
- [backend] TS2339 at 31:16 — Property 'MaxSpeakerLabels' does not exist on type 'StartStreamTranscriptionCommandInput'.