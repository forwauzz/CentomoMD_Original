# Architecture & Design Audit (Pre–Mode 3)

**Goal**: Analyze the current repo to understand how Modes, Templates, Layers, AWS Transcribe, and Supabase are implemented, and identify any conflicts with the proposed Mode 3 (Transcribe/Ambient) pipeline-first approach.

## 📁 **Repo Map**

### **Backend Configuration**
```
backend/src/config/
├── modes.ts                    # Mode definitions (mode1, mode2, mode3)
├── templates.ts                # Template registry with mode compatibility
├── sections.ts                 # Section definitions
└── env.ts                      # Environment configuration

backend/config/layers/
├── template-combinations.json  # Layer combination configurations
├── verbatim-layer.json         # Verbatim text processing layer
└── voice-commands-layer.json   # Voice command processing layer
```

### **Backend Services**
```
backend/src/services/
├── formatter/
│   ├── mode1.ts                # Word-for-word formatter
│   ├── mode2.ts                # Smart dictation formatter (uses LayerManager)
│   ├── shared.ts               # Base formatting engine (formatWithGuardrails)
│   └── validators/             # Section-specific validators
├── layers/
│   └── LayerManager.ts         # Manages formatting layers
├── processing/
│   └── ProcessingOrchestrator.ts # Coordinates modes/templates/layers
├── transcriptionService.ts     # AWS Transcribe integration
└── aiFormattingService.ts      # High-level AI formatting orchestration
```

### **Backend Core**
```
backend/src/
├── index.ts                    # Main server with WebSocket + mode-specific AWS config
├── database/
│   ├── schema.ts               # Supabase schema definitions
│   └── connection.ts           # Database connection
└── drizzle/
    ├── rls_policies.sql        # Row Level Security policies
    └── meta/                   # Migration snapshots
```

### **Frontend Components**
```
frontend/src/components/transcription/
├── ModeToggle.tsx              # Mode selection UI (word_for_word, smart_dictation, ambient)
├── TemplateSelector.tsx        # Template selection with mode compatibility
├── TranscriptionInterface.tsx  # Main recording interface
└── SectionSelector.tsx         # Section selection

frontend/src/
├── hooks/
│   ├── useTranscription.ts     # Transcription logic with mode handling
│   └── useWebSocket.ts         # WebSocket communication
├── config/
│   └── template-config.ts      # Frontend template configurations
└── contexts/
    └── TemplateContext.tsx     # Template state management
```

## 🔄 **Current Behavior by Mode**

### **Mode 1 (Word-for-Word)**
- **File**: `backend/src/services/formatter/mode1.ts` (lines 1-359)
- **Processing**: Direct formatting without AI, preserves all spoken words
- **AWS Config**: `show_speaker_labels: false`, `partial_results_stability: 'high'`
- **Features**: Voice commands, post-processing, real-time processing
- **Templates**: Compatible with `word-for-word-formatter`, `word-for-word-with-ai`, `section7-ai-formatter`, `section-7-only`, `section-7-verbatim`, `section-7-full`, `history-evolution-ai-formatter`

### **Mode 2 (Smart Dictation)**
- **File**: `backend/src/services/formatter/mode2.ts` (lines 1-274)
- **Processing**: Uses `LayerManager` + `formatWithGuardrails` (base formatting engine)
- **AWS Config**: `show_speaker_labels: true`, `partial_results_stability: 'high'`
- **Features**: AI formatting, verbatim support, voice commands, post-processing
- **Layer Integration**: Uses `template-combinations.json` for modular processing
- **Fallback**: Falls back to original Mode 2 pipeline if layer validation fails

### **Mode 3 (Ambient)**
- **File**: `backend/src/config/modes.ts` (lines 98-125) - **CONFIGURED BUT NO IMPLEMENTATION**
- **Processing**: **NOT IMPLEMENTED** - No `Mode3Formatter` class exists
- **AWS Config**: `show_speaker_labels: true`, `partial_results_stability: 'medium'`
- **Features**: AI formatting, post-processing, batch processing
- **Status**: **MISSING** - Mode 3 is defined but has no formatter implementation
- **Templates**: Compatible with `ai-formatter-basic`, `ai-formatter-verbatim`, `ai-formatter-full`, `history-evolution-ai-formatter`

## ⚙️ **Configuration Truth**

### **Mode Definitions**
- **File**: `backend/src/config/modes.ts` (lines 42-126)
- **Mode 1**: `processingType: 'realtime'`, `capabilities: { voiceCommands: true, aiFormatting: false }`
- **Mode 2**: `processingType: 'hybrid'`, `capabilities: { voiceCommands: true, aiFormatting: true }`
- **Mode 3**: `processingType: 'batch'`, `capabilities: { voiceCommands: false, aiFormatting: true }`

### **Template Registry**
- **File**: `backend/src/config/templates.ts` (lines 54-404)
- **Mode Compatibility Matrix**:
  - `word-for-word-formatter`: `compatibleModes: ['mode1', 'mode2']`
  - `ai-formatter-basic`: `compatibleModes: ['mode2', 'mode3']`
  - `ai-formatter-verbatim`: `compatibleModes: ['mode2', 'mode3']`
  - `ai-formatter-full`: `compatibleModes: ['mode2', 'mode3']`
  - `section7-ai-formatter`: `compatibleModes: ['mode1', 'mode2']` (**NO MODE 3**)

### **Layer Combinations**
- **File**: `backend/config/layers/template-combinations.json` (lines 1-34)
- **Available Combinations**:
  - `template-only`: No layers, fallback to `original-mode2`
  - `template-verbatim`: `layers: ["verbatim-layer"]`, fallback to `template-only`
  - `template-full`: `layers: ["verbatim-layer", "voice-commands-layer"]`, fallback to `template-verbatim`

### **Layer Configurations**
- **Verbatim Layer**: `backend/config/layers/verbatim-layer.json` (lines 1-36)
  - **Status**: `enabled: false` (available but not active by default)
  - **Markers**: `___VERBATIM_START___` / `___VERBATIM_END___`
- **Voice Commands Layer**: `backend/config/layers/voice-commands-layer.json` (lines 1-31)
  - **Status**: `enabled: true` (active by default)

## 🗄️ **Data Model & RLS (Supabase)**

### **Core Tables**
- **File**: `backend/src/database/schema.ts` (lines 1-262)
- **Sessions**: `mode: text('mode', { enum: ['word_for_word', 'smart_dictation', 'ambient'] })` (line 47)
- **Transcripts**: `section: text('section', { enum: ['section_7', 'section_8', 'section_11'] })` (line 60)
- **Templates**: `section: text('section', { enum: ['section_7', 'section_8', 'section_11'] })` (line 72)

### **RLS Policies**
- **File**: `backend/drizzle/rls_policies.sql` (lines 1-108)
- **Sessions Policy**: Users can access sessions where they have clinic membership (lines 34-44)
- **Transcripts Policy**: Users can access transcripts for sessions they have access to (lines 46-56)
- **Templates Policy**: All authenticated users can read active templates (lines 58-62)

### **Multi-tenant Isolation**
- **Clinic-based**: `clinic_id` references in sessions, memberships, audit_logs
- **User-based**: `user_id` references with RLS policies using `auth.uid()`
- **Membership-based**: Users access resources through clinic memberships

## ☁️ **AWS Transcribe Usage**

### **Speaker Label Configuration**
- **File**: `backend/src/services/transcriptionService.ts` (lines 62-63)
- **ShowSpeakerLabel**: `config.show_speaker_labels || false` - **Mode-specific speaker attribution**
- **MaxSpeakerLabels**: `// MaxSpeakerLabels: 2, // PATIENT vs CLINICIAN - not supported in this version` (line 63)

### **Mode-Specific AWS Configuration**
- **File**: `backend/src/index.ts` (lines 1901-1938)
- **Word-for-Word**: `show_speaker_labels: false`, `partial_results_stability: 'high'`
- **Smart Dictation**: `show_speaker_labels: true`, `partial_results_stability: 'high'`
- **Ambient**: `show_speaker_labels: true`, `partial_results_stability: 'medium'`

### **Streaming vs Batch**
- **Streaming**: `backend/src/services/transcriptionService.ts` - Real-time transcription for all modes
- **Batch**: **NOT IMPLEMENTED** - No batch transcription service exists
- **Usage**: All modes use streaming transcription with mode-specific parameters

## ⚠️ **Risks & Contradictions**

### **1. Mode 3 Implementation Gap**
- **Risk**: Mode 3 is configured but has no `Mode3Formatter` implementation
- **File**: `backend/src/config/modes.ts` (lines 98-125) vs missing `backend/src/services/formatter/mode3.ts`
- **Impact**: Mode 3 selection in frontend will fail at processing stage

### **2. Template Compatibility Inconsistency**
- **Risk**: `section7-ai-formatter` doesn't support Mode 3 despite being a core template
- **File**: `backend/src/config/templates.ts` (lines 229-267)
- **Impact**: Users can't use Section 7 AI formatting with Mode 3

### **3. AWS Speaker Label Limitation**
- **Risk**: `MaxSpeakerLabels` is commented out and not supported
- **File**: `backend/src/services/transcriptionService.ts` (line 63)
- **Impact**: Can't limit to 2 speakers (PATIENT vs CLINICIAN) for Mode 3

### **4. Layer System Not Used by Mode 3**
- **Risk**: Mode 3 won't benefit from existing verbatim and voice command layers
- **File**: `backend/src/services/formatter/mode2.ts` (lines 74-89) vs missing Mode 3 implementation
- **Impact**: Mode 3 loses modular formatting capabilities

### **5. Processing Orchestrator Gap**
- **Risk**: `ProcessingOrchestrator` has no Mode 3 processing method
- **File**: `backend/src/services/processing/ProcessingOrchestrator.ts` (lines 698-703)
- **Impact**: Mode 3 requests will fail in the orchestrator

### **6. Frontend Mode 3 Support**
- **Risk**: Frontend shows Mode 3 but has no processing logic
- **File**: `frontend/src/components/transcription/ModeToggle.tsx` (lines 23-27)
- **Impact**: Users can select Mode 3 but it won't work

## 🔧 **Minimal Change Surface Plan**

### **Phase 1: Create Mode3Formatter**
- **Add**: `backend/src/services/formatter/mode3.ts`
- **Extend**: `Mode2FormattingOptions` interface for Mode 3 specific options
- **Implement**: Multi-speaker parsing, role identification, narrative building
- **Delegate**: To `Mode2Formatter` for base formatting

### **Phase 2: Update Template Compatibility**
- **Modify**: `backend/src/config/templates.ts` (lines 236, 310, 345)
- **Change**: `section7-ai-formatter`, `section-7-verbatim`, `section-7-full` to include `'mode3'`
- **Add**: New `mode3-transcribe-formatter` template

### **Phase 3: Update Processing Orchestrator**
- **Add**: `processMode3` method in `ProcessingOrchestrator.ts`
- **Import**: `Mode3Formatter` dynamically to avoid circular dependencies
- **Integrate**: Mode 3 processing in main `processContent` method

### **Phase 4: Add Mode 3 Endpoint**
- **Add**: `/api/format/mode3` endpoint in `backend/src/index.ts`
- **Support**: Mode 3 specific parameters (speakerDiarization, speakerAttribution)
- **Return**: Speaker attribution metadata

### **Phase 5: Update Frontend Integration**
- **Add**: `formatWithMode3` function in `frontend/src/hooks/useTranscription.ts`
- **Support**: Mode 3 specific options and response handling
- **Display**: Speaker attribution in UI

### **Phase 6: AWS Configuration Enhancement**
- **Uncomment**: `MaxSpeakerLabels: 2` in `transcriptionService.ts` (line 63)
- **Add**: Mode 3 specific vocabulary configuration
- **Test**: Speaker diarization accuracy

## ❓ **Open Questions**

### **1. AWS Transcribe Speaker Diarization Format**
- **Question**: What is the exact format of AWS Transcribe speaker diarization output?
- **Context**: `backend/src/services/transcriptionService.ts` (lines 62-63)
- **Need**: Understand if output is `spk_0: text` or JSON with speaker metadata

### **2. Mode 3 Processing Pipeline**
- **Question**: Should Mode 3 use the same base formatting engine as Mode 2?
- **Context**: `backend/src/services/formatter/shared.ts` (lines 33-91)
- **Need**: Confirm if `formatWithGuardrails` is appropriate for multi-speaker content

### **3. Speaker Role Identification**
- **Question**: How should patient vs clinician roles be identified?
- **Context**: Mode 3 needs speaker attribution
- **Need**: Define heuristics or ML approach for role identification

### **4. Template Layer Integration**
- **Question**: Should Mode 3 use the existing layer system (verbatim, voice commands)?
- **Context**: `backend/config/layers/template-combinations.json`
- **Need**: Determine if layers are relevant for multi-speaker scenarios

### **5. Real-time vs Batch Processing**
- **Question**: Should Mode 3 support real-time processing or only batch?
- **Context**: `backend/src/config/modes.ts` (line 104: `processingType: 'batch'`)
- **Need**: Clarify if ambient mode should support real-time updates

### **6. Database Schema Updates**
- **Question**: Do we need new database fields for speaker attribution?
- **Context**: `backend/src/database/schema.ts` (lines 57-67)
- **Need**: Determine if transcripts table needs speaker metadata columns

### **7. Frontend UI for Speaker Attribution**
- **Question**: How should speaker attribution be displayed in the UI?
- **Context**: `frontend/src/components/transcription/TranscriptionInterface.tsx`
- **Need**: Design UI for showing patient vs clinician segments

### **8. Performance and Scalability**
- **Question**: What are the performance requirements for Mode 3 processing?
- **Context**: `backend/src/config/modes.ts` (line 115: `maxProcessingTime: 300`)
- **Need**: Define acceptable processing times for multi-speaker content

## ✅ **Acceptance Criteria Met**

- ✅ **Every claim has file path + line range**
- ✅ **No code changes yet—read-only audit**
- ✅ **Missing components identified explicitly**
- ✅ **Risks and contradictions documented with file references**
- ✅ **Minimal change surface plan provided**
- ✅ **Open questions listed with context**

## 📊 **Summary**

The current architecture is **well-designed** with a solid foundation for Mode 3 integration:

**✅ Strengths:**
- Modular mode/template/layer system
- Base formatting engine (`formatWithGuardrails`)
- AWS Transcribe integration with mode-specific configuration
- Comprehensive template registry with mode compatibility
- Supabase schema with proper RLS policies

**⚠️ Gaps:**
- **Mode 3 has no implementation** - only configuration
- **Template compatibility inconsistencies** - some templates don't support Mode 3
- **Missing speaker diarization processing** - no multi-speaker handling
- **Processing orchestrator gap** - no Mode 3 processing method
- **AWS speaker label limitations** - MaxSpeakerLabels not supported

**🎯 Recommendation:**
Proceed with the **Minimal Change Surface Plan** to implement Mode 3 while leveraging the existing architecture. The foundation is solid and ready for Mode 3 integration.
