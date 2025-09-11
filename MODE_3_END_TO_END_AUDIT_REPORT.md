# Mode 3 (Transcribe/Ambient) End-to-End Audit Report

**Date**: 2025-01-10  
**Scope**: Complete Mode 3 implementation verification across Frontend ↔ WebSocket ↔ Backend Pipeline ↔ Supabase ↔ Templates  
**Status**: Implementation Complete with Critical Issues Identified

---

## Executive Summary

| Component | Status | Critical Issues |
|-----------|--------|-----------------|
| **Mode Routing** | ✅ PASS | None |
| **AWS Flags** | ✅ PASS | None |
| **WebSocket Final Payload** | ✅ PASS | None |
| **Pipeline Endpoint** | ⚠️ PARTIAL | Mode ID mismatch |
| **Orchestrator** | ✅ PASS | None |
| **Artifacts + Supabase** | ❌ FAIL | No artifacts table |
| **Templates Compatibility** | ⚠️ PARTIAL | Mode ID mismatch |
| **Frontend UX** | ✅ PASS | None |
| **Logging/Metrics** | ✅ PASS | None |

---

## Detailed Findings

### 1. Mode Routing ✅ PASS

**Frontend Mode Selection:**
- **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx:30`
- **Code**: `const [mode, setMode] = useState<TranscriptionMode>('smart_dictation');`
- **Finding**: Mode state properly managed in UI component

**Mode Parameter Passing:**
- **File**: `frontend/src/hooks/useTranscription.ts:18`
- **Code**: `export const useTranscription = (sessionId?: string, language?: string, mode?: TranscriptionMode) => {`
- **Finding**: Hook accepts mode parameter correctly

**WebSocket Start Message:**
- **File**: `frontend/src/hooks/useTranscription.ts:278-284`
- **Code**: 
  ```typescript
  ws.send(JSON.stringify({ 
    type: 'start_transcription', 
    languageCode, 
    sampleRate: 16000,
    mode: state.mode,  // Add mode parameter for Phase 0
    sessionId 
  }));
  ```
- **Finding**: Mode correctly sent to backend via WebSocket

**Backend Mode Gating:**
- **File**: `backend/src/index.ts:2166-2169`
- **Code**: 
  ```typescript
  const modeConfig = getModeSpecificConfig(msg.mode || 'smart_dictation', {
    language_code: msg.languageCode, 
    media_sample_rate_hz: msg.sampleRate ?? 16000
  });
  ```
- **Finding**: Mode properly applied to AWS configuration

---

### 2. AWS Flags (Mode-Scoped) ✅ PASS

**Mode-Specific Configuration:**
- **File**: `backend/src/index.ts:2057-2098`
- **Code**: 
  ```typescript
  const getModeSpecificConfig = (mode: string, baseConfig: any) => {
    switch (mode) {
      case 'word_for_word':
        return {
          ...config,
          show_speaker_labels: false,
          partial_results_stability: 'high' as const
        };
      case 'smart_dictation':
        return {
          ...config,
          show_speaker_labels: false,
          partial_results_stability: 'high' as const
        };
      case 'ambient':
        return {
          ...config,
          show_speaker_labels: true,
          max_speaker_labels: 2,
          partial_results_stability: 'medium' as const
        };
    }
  };
  ```
- **Finding**: Mode 1/2 correctly disable speaker labels, Mode 3 enables them

**AWS Command Construction:**
- **File**: `backend/src/services/transcriptionService.ts:57-69`
- **Code**: 
  ```typescript
  const cmdInput: StartStreamTranscriptionCommandInput = {
    LanguageCode: (config.language_code || 'fr-CA') as any,
    MediaEncoding: 'pcm',
    MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
    AudioStream: audioIterable,
    ShowSpeakerLabel: config.show_speaker_labels || false,
    ...(config.max_speaker_labels && { MaxSpeakerLabels: config.max_speaker_labels }),
    EnablePartialResultsStabilization: true,
    PartialResultsStability: (config.partial_results_stability || 'high') as any,
  };
  ```
- **Finding**: AWS parameters correctly applied based on mode configuration

**Test Coverage:**
- **File**: `backend/src/tests/aws-transcribe-config.test.ts:16-53`
- **Finding**: Comprehensive unit tests verify mode-specific AWS configurations

---

### 3. WebSocket Final Payload ✅ PASS

**AWS Result Collection:**
- **File**: `backend/src/services/transcriptionService.ts:155-228`
- **Code**: 
  ```typescript
  // Store complete AWS result for Mode 3 pipeline
  const awsResult: any = {
    results: { transcripts: [], items: [] },
    speaker_labels: { speakers: 0, segments: [] }
  };
  
  // Stream ended - send final AWS result for Mode 3
  console.log(`[${sessionId}] Stream ended, sending final AWS result for Mode 3 pipeline`);
  onTranscript({
    transcript: '',
    is_partial: false,
    confidence_score: 1.0,
    timestamp: new Date(),
    resultId: 'final_aws_result',
    startTime: null,
    endTime: null,
    speaker: null,
    awsResult: awsResult // Include complete AWS result
  });
  ```
- **Finding**: Complete AWS JSON properly collected and sent

**WebSocket Message Routing:**
- **File**: `backend/src/index.ts:2177-2184`
- **Code**: 
  ```typescript
  if (res.resultId === 'final_aws_result' && res.awsResult && msg.mode === 'ambient') {
    console.log(`[${sessionId}] Sending final AWS result for Mode 3 pipeline`);
    ws.send(JSON.stringify({ 
      type: 'transcription_final', 
      mode: 'ambient',
      payload: res.awsResult
    }));
  }
  ```
- **Finding**: Final AWS JSON correctly routed to frontend

**Frontend Handler:**
- **File**: `frontend/src/hooks/useTranscription.ts:477-481`
- **Code**: 
  ```typescript
  } else if (msg.type === 'transcription_final' && msg.mode === 'ambient') {
    // Store the raw AWS JSON for Mode 3 pipeline processing
    console.log('Mode 3 final transcription received:', msg);
    setFinalAwsJson(msg.payload);
    setMode3Progress('transcribing');
  }
  ```
- **Finding**: Frontend properly captures final AWS JSON

---

### 4. Pipeline Endpoint Usage ⚠️ PARTIAL

**Frontend API Call:**
- **File**: `frontend/src/hooks/useTranscription.ts:67-91`
- **Code**: 
  ```typescript
  const processMode3Pipeline = useCallback(async (params: {
    sessionId: string;
    language: 'en'|'fr';
    section: string;
    rawAwsJson: any;
  }) => {
    const res = await fetch('/api/transcribe/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId,
        modeId: 'mode3',  // ❌ CRITICAL: Should be 'ambient'
        language: params.language,
        section: params.section,
        rawAwsJson: params.rawAwsJson
      })
    });
  ```
- **Finding**: ❌ **CRITICAL ISSUE** - Frontend sends `modeId: 'mode3'` but backend expects `'ambient'`

**Backend Endpoint Validation:**
- **File**: `backend/src/index.ts:1912-1917`
- **Code**: 
  ```typescript
  if (modeId !== 'ambient') {
    res.status(400).json({ 
      error: 'This endpoint only supports ambient mode' 
    });
    return;
  }
  ```
- **Finding**: Backend correctly validates for `'ambient'` mode

**Pipeline Execution:**
- **File**: `backend/src/index.ts:1957-1966`
- **Code**: 
  ```typescript
  // Execute S1→S5 pipeline
  const result = await pipeline.execute(awsResult, 'default');
  
  if (!result.success) {
    res.status(500).json({ 
      error: 'Pipeline processing failed', 
      details: result.error 
    });
    return;
  }
  ```
- **Finding**: S1-S5 pipeline execution properly implemented

---

### 5. Orchestrator ✅ PASS

**Mode 3 Processing Method:**
- **File**: `backend/src/services/processing/ProcessingOrchestrator.ts:742-789`
- **Code**: 
  ```typescript
  private async processMode3(content: string, request: ProcessingRequest): Promise<string> {
    const correlationId = request.correlationId || 'no-correlation-id';
    console.log(`[${correlationId}] Processing Mode 3 (Ambient/Transcribe)`);
    
    try {
      // Import Mode3Pipeline dynamically to avoid circular dependencies
      const { Mode3Pipeline } = await import('../pipeline/index.js');
      const pipeline = new Mode3Pipeline();
      
      // Parse content as AWS Transcribe result
      let awsResult;
      try {
        awsResult = JSON.parse(content);
      } catch (parseError) {
        console.error(`[${correlationId}] Failed to parse AWS Transcribe result:`, parseError);
        throw new Error('Invalid AWS Transcribe JSON format');
      }
      
      // Validate AWS result
      const validation = pipeline.validateAWSResult(awsResult);
      if (!validation.valid) {
        console.error(`[${correlationId}] AWS result validation failed:`, validation.errors);
        throw new Error(`Invalid AWS result: ${validation.errors.join(', ')}`);
      }
      
      // Execute S1→S5 pipeline
      const result = await pipeline.execute(awsResult, 'default');
      
      if (!result.success) {
        console.error(`[${correlationId}] Mode 3 pipeline failed:`, result.error);
        throw new Error(`Pipeline failed: ${result.error}`);
      }
      
      console.log(`[${correlationId}] Mode 3 pipeline completed successfully`, {
        processingTime: result.processingTime,
        narrativeFormat: result.data?.narrative.format,
        speakerCount: result.data?.narrative.metadata.totalSpeakers
      });
      
      // Return the narrative content
      return result.data?.narrative.content || content;
      
    } catch (error) {
      console.error(`[${correlationId}] Mode 3 processing error:`, error);
      // Return original content if processing fails
      return content;
    }
  }
  ```
- **Finding**: Complete Mode 3 processing method with proper error handling

**Mode Routing Switch:**
- **File**: `backend/src/services/processing/ProcessingOrchestrator.ts:148-158`
- **Code**: 
  ```typescript
  private async applyModeProcessing(content: string, mode: ModeConfig, request: ProcessingRequest): Promise<string> {
    console.log(`Applying mode processing: ${mode.id}`);
    switch (mode.id) {
      case 'mode1':
        return await this.processMode1(content, request);
      case 'mode2':
        return await this.processMode2(content, request);
      case 'ambient': // Changed from 'mode3' to 'ambient'
        return await this.processMode3(content, request);
      default:
        console.warn(`Unknown mode: ${mode.id}, returning content as-is`);
        return content;
    }
  }
  ```
- **Finding**: Mode routing correctly switches to `processMode3()` for `'ambient'` mode

---

### 6. Artifacts + Supabase ❌ FAIL

**Database Schema:**
- **File**: `backend/src/database/schema.ts:39-67`
- **Finding**: ❌ **CRITICAL ISSUE** - No dedicated `artifacts` table exists

**Sessions Table:**
- **File**: `backend/src/database/schema.ts:40-54`
- **Code**: 
  ```typescript
  export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    clinic_id: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
    patient_id: varchar('patient_id', { length: 255 }).notNull(),
    consent_verified: boolean('consent_verified').notNull().default(false),
    status: text('status', { enum: ['active', 'paused', 'completed', 'cancelled'] }).notNull().default('active'),
    mode: text('mode', { enum: ['word_for_word', 'smart_dictation', 'ambient'] }).notNull().default('smart_dictation'),
    current_section: text('current_section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull().default('section_7'),
    started_at: timestamp('started_at').defaultNow().notNull(),
    ended_at: timestamp('ended_at'),
    duration_seconds: integer('duration_seconds'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  });
  ```
- **Finding**: Sessions table exists but no artifacts storage

**Artifacts Endpoint:**
- **File**: `backend/src/index.ts:1994-2021`
- **Code**: 
  ```typescript
  app.get('/api/sessions/:id/artifacts', async (req, res): Promise<void> => {
    try {
      const { id: sessionId } = req.params;
      
      if (!sessionId) {
        res.status(400).json({ 
          error: 'Session ID is required' 
        });
        return;
      }

      // TODO: Implement database retrieval of artifacts
      // For now, return mock data structure
      res.json({
        ir: null, // Would be retrieved from database
        role_map: null, // Would be retrieved from database  
        narrative: null, // Would be retrieved from database
        message: 'Artifacts endpoint ready - database integration pending'
      });
    }
  ```
- **Finding**: ❌ **CRITICAL ISSUE** - Artifacts endpoint returns mock data, no database integration

**RLS Policies:**
- **File**: `backend/src/drizzle/rls_policies.sql`
- **Finding**: RLS policies exist but no artifacts table to apply them to

---

### 7. Templates Compatibility ⚠️ PARTIAL

**Backend Template Registry:**
- **File**: `backend/src/config/templates.ts:404-437`
- **Code**: 
  ```typescript
  'mode3-transcribe-passthrough': {
    id: 'mode3-transcribe-passthrough',
    name: 'Mode 3 Transcribe Passthrough',
    nameEn: 'Mode 3 Transcribe Passthrough',
    description: 'Mode 3 pipeline passthrough - returns narrative directly from S1-S5 processing without additional AI formatting',
    descriptionEn: 'Mode 3 pipeline passthrough - returns narrative directly from S1-S5 processing without additional AI formatting',
    type: 'processing',
    compatibleSections: ['section_7', 'section_8', 'section_11'],
    compatibleModes: ['mode3'],  // ❌ CRITICAL: Should be 'ambient'
    supportedLanguages: ['fr', 'en'],
    content: {
      structure: 'pipeline-passthrough',
      placeholders: ['narrative_content', 'role_prefixes'],
      validationRules: ['narrative_format', 'role_consistency']
    },
    features: {
      verbatimSupport: false,
      voiceCommandsSupport: false,
      aiFormatting: false, // No LLM - just passthrough
      postProcessing: false,
      realtimeProcessing: false
    },
    configuration: {
      priority: 1,
      timeout: 30,
      retryAttempts: 1
    },
    metadata: {
      category: 'mode_specific',
      tags: ['mode3', 'transcribe', 'passthrough', 'pipeline'],  // ❌ CRITICAL: Should be 'ambient'
      version: '1.0.0',
      author: 'CentomoMD'
    }
  }
  ```
- **Finding**: ❌ **CRITICAL ISSUE** - Template uses `'mode3'` instead of `'ambient'`

**Frontend Template Config:**
- **File**: `frontend/src/config/template-config.ts:316-320`
- **Code**: 
  ```typescript
  export const getTemplatesByMode = (mode: string): TemplateConfig[] => {
    return TEMPLATE_CONFIGS.filter(template => 
      template.compatibleModes.includes(mode) || template.compatibleModes.includes('all')
    );
  };
  ```
- **Finding**: Frontend template filtering works correctly

---

### 8. Frontend UX ✅ PASS

**Mode Selection UI:**
- **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx:708-714`
- **Code**: 
  ```typescript
  <label className="text-sm font-medium text-gray-700">Mode</label>
  <ModeToggle
    currentMode={mode}
    onModeChange={setMode}
    language={language}
  />
  ```
- **Finding**: Mode selection UI properly implemented

**Progress Indicators:**
- **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx:799-818`
- **Code**: 
  ```typescript
  {/* Mode 3 Pipeline Display */}
  {mode === 'ambient' && (
    <div className="mt-3">
      {/* Progress indicators */}
      <div className="text-sm opacity-70 mb-2">
        {mode3Progress === 'transcribing' && 'Transcribing…'}
        {mode3Progress === 'processing' && 'Cleaning & building narrative…'}
        {mode3Progress === 'ready' && 'Ready'}
      </div>

      {/* Narrative output */}
      {mode3Narrative && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Processed Narrative:</h4>
          <pre className="whitespace-pre-wrap rounded-lg border p-3 bg-white/50 text-sm text-gray-800 font-mono">
            {mode3Narrative}
          </pre>
        </div>
      )}
    </div>
  )}
  ```
- **Finding**: Progress indicators and narrative display properly implemented

**Test Coverage:**
- **File**: `frontend/src/components/transcription/__tests__/TranscriptionInterface.test.tsx:34-199`
- **Finding**: Comprehensive test coverage for Mode 3 UI components

---

### 9. Logging/Metrics ✅ PASS

**Pipeline Stage Logging:**
- **File**: `backend/src/services/pipeline/index.ts:55-105`
- **Code**: 
  ```typescript
  // S1: Ingest AWS JSON → IrDialog
  console.log('[Mode3Pipeline] Starting S1: Ingest AWS JSON');
  const s1Result = await this.s1Ingest.execute(awsResult);
  if (!s1Result.success || !s1Result.data) {
    throw new Error(`S1 failed: ${s1Result.error}`);
  }
  artifacts.ir = s1Result.data;
  artifacts.processingTime!.s1_ingest = s1Result.processingTime;

  // S2: Merge adjacent turns
  console.log('[Mode3Pipeline] Starting S2: Merge turns');
  const s2Result = await this.s2Merge.execute(s1Result.data);
  if (!s2Result.success || !s2Result.data) {
    throw new Error(`S2 failed: ${s2Result.error}`);
  }
  artifacts.ir = s2Result.data; // Update with merged dialog
  artifacts.processingTime!.s2_merge = s2Result.processingTime;

  // S3: Role mapping
  console.log('[Mode3Pipeline] Starting S3: Role mapping');
  const s3Result = await this.s3RoleMap.execute(s2Result.data);
  if (!s3Result.success || !s3Result.data) {
    throw new Error(`S3 failed: ${s3Result.error}`);
  }
  artifacts.roleMap = s3Result.data;
  artifacts.processingTime!.s3_role_map = s3Result.processingTime;

  // S4: Cleanup
  console.log('[Mode3Pipeline] Starting S4: Cleanup');
  const s4Result = await this.s4Cleanup.execute(s2Result.data, s3Result.data, cleanupProfile);
  if (!s4Result.success || !s4Result.data) {
    throw new Error(`S4 failed: ${s4Result.error}`);
  }
  artifacts.cleaned = s4Result.data;
  artifacts.processingTime!.s4_cleanup = s4Result.processingTime;

  // S5: Generate narrative
  console.log('[Mode3Pipeline] Starting S5: Generate narrative');
  const s5Result = await this.s5Narrative.execute(s4Result.data);
  if (!s5Result.success || !s5Result.data) {
    throw new Error(`S5 failed: ${s5Result.error}`);
  }
  artifacts.narrative = s5Result.data;
  artifacts.processingTime!.s5_narrative = s5Result.processingTime;

  // Calculate total processing time
  const totalTime = Date.now() - pipelineStartTime;
  artifacts.processingTime!.total = totalTime;

  console.log(`[Mode3Pipeline] Pipeline completed in ${totalTime}ms`);
  ```
- **Finding**: Comprehensive stage-by-stage logging with timing metrics

**Error Handling:**
- **File**: `backend/src/services/processing/ProcessingOrchestrator.ts:784-788`
- **Code**: 
  ```typescript
  } catch (error) {
    console.error(`[${correlationId}] Mode 3 processing error:`, error);
    // Return original content if processing fails
    return content;
  }
  ```
- **Finding**: Proper error handling with fallback to original content

**Frontend Error Handling:**
- **File**: `frontend/src/hooks/useTranscription.ts:556-562`
- **Code**: 
  ```typescript
  } catch (error) {
    console.error('Mode 3 pipeline processing failed:', error);
    setMode3Progress('idle');
    updateState({
      error: `Pipeline processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  ```
- **Finding**: Frontend error handling with user feedback

---

## Risks & Gaps

### Critical Issues

1. **Mode ID Mismatch** ❌
   - **Impact**: Mode 3 pipeline processing will fail
   - **Location**: Frontend sends `'mode3'`, backend expects `'ambient'`
   - **Files**: `frontend/src/hooks/useTranscription.ts:78`, `backend/src/index.ts:1912`

2. **Missing Artifacts Table** ❌
   - **Impact**: No persistent storage of pipeline artifacts
   - **Location**: Database schema missing artifacts table
   - **Files**: `backend/src/database/schema.ts`, `backend/src/index.ts:1994-2021`

3. **Template Mode Mismatch** ❌
   - **Impact**: Mode 3 template won't be available in UI
   - **Location**: Template uses `'mode3'` instead of `'ambient'`
   - **Files**: `backend/src/config/templates.ts:412`

### Medium Issues

4. **No Artifact Persistence** ⚠️
   - **Impact**: Pipeline results lost after session ends
   - **Location**: No database integration for artifacts endpoint

5. **Limited Error Recovery** ⚠️
   - **Impact**: Pipeline failures return original content without user notification
   - **Location**: Error handling returns content silently

### Low Issues

6. **No Speaker Confidence Display** ⚠️
   - **Impact**: Users can't see speaker identification confidence
   - **Location**: UI doesn't show speaker confidence metrics

---

## Recommended Minimal Fixes

### 1. Fix Mode ID Mismatch (Critical)
**Description**: Change frontend to send `'ambient'` instead of `'mode3'`
**Files**: `frontend/src/hooks/useTranscription.ts:78`
**Change**: `modeId: 'ambient'`

### 2. Fix Template Mode Mismatch (Critical)
**Description**: Change template to use `'ambient'` instead of `'mode3'`
**Files**: `backend/src/config/templates.ts:412,433`
**Changes**: 
- `compatibleModes: ['ambient']`
- `tags: ['ambient', 'transcribe', 'passthrough', 'pipeline']`

### 3. Create Artifacts Table (Critical)
**Description**: Add artifacts table to database schema
**Files**: `backend/src/database/schema.ts`
**Add**:
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ir JSONB NOT NULL,
  role_map JSONB NOT NULL,
  narrative JSONB NOT NULL,
  processing_time JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 4. Implement Artifacts Persistence (Medium)
**Description**: Update artifacts endpoint to use database
**Files**: `backend/src/index.ts:1994-2021`
**Change**: Replace mock data with actual database queries

### 5. Add Speaker Confidence Display (Low)
**Description**: Show speaker confidence in UI
**Files**: `frontend/src/components/transcription/TranscriptionInterface.tsx`
**Add**: Confidence indicators in narrative display

---

## Open Questions

1. **Artifact Retention Policy**: How long should pipeline artifacts be stored?
   - **File**: `backend/src/database/schema.ts`
   - **Context**: No retention policy defined

2. **Speaker Confidence Threshold**: What confidence level should trigger user warnings?
   - **File**: `backend/src/services/pipeline/stages/s3_role_map.ts`
   - **Context**: Role mapping uses confidence but no thresholds defined

3. **Pipeline Fallback Strategy**: Should failed pipelines fall back to Mode 2 processing?
   - **File**: `backend/src/services/processing/ProcessingOrchestrator.ts:784-788`
   - **Context**: Currently returns original content on failure

4. **Multi-Session Artifacts**: How should artifacts be shared across sessions?
   - **File**: `backend/src/index.ts:1994-2021`
   - **Context**: No cross-session artifact management

5. **Real-time Artifact Updates**: Should artifacts be updated during processing?
   - **File**: `backend/src/services/pipeline/index.ts:55-105`
   - **Context**: Currently only final artifacts are stored

---

## Conclusion

Mode 3 (Transcribe/Ambient) implementation is **functionally complete** but has **critical configuration mismatches** that prevent it from working. The core pipeline (S1-S5) is properly implemented with comprehensive logging and error handling. The main issues are:

1. **Mode ID inconsistencies** between frontend and backend
2. **Missing database artifacts table** for persistent storage
3. **Template configuration mismatches**

With the recommended minimal fixes, Mode 3 will be fully operational and ready for production use.
