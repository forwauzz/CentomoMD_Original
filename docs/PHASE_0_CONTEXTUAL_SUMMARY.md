# Phase 0 Implementation Contextual Summary

## Problem Description
The transcription pipeline currently uses identical AWS Transcribe configuration for all three modes (Word-for-Word, Smart Dictation, Ambient), preventing mode-specific optimizations that were planned for Phase 0.

## Current Architecture (High-Level)
```
Frontend (Mode Selection) → WebSocket → Backend → AWS Transcribe
     ↓                        ↓         ↓           ↓
  Mode Toggle            Binary Audio  Session    Same Config
  (3 modes)              Streaming     Management  (All modes)
```

## Repro Steps
1. Select any mode in frontend (Word-for-Word, Smart Dictation, Ambient)
2. Start transcription
3. Check AWS Transcribe configuration in backend logs
4. **Result**: All modes use identical configuration

## Logs/Artifacts/Errors
**Current Configuration (All Modes)**:
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: 'fr-CA',
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: 16000,
  ShowSpeakerLabel: true,     // Same for all modes
  PartialResultsStability: 'high',  // Same for all modes
  // No vocabulary differentiation
};
```

**Expected Configuration (Mode-Specific)**:
```typescript
// Word-for-Word: High stability, no speaker labels
// Smart Dictation: High stability, speaker labels, medical vocabulary  
// Ambient: Medium stability, speaker labels, no vocabulary
```

## Attempts So Far
- ✅ **Phase 1**: Mode 1 Hardening - COMPLETED
- ✅ **Phase 2**: Mode 2 AI Formatting - COMPLETED  
- ✅ **Phase 3**: Mode 3 Ambient - COMPLETED
- ❌ **Phase 0**: Mode-specific AWS configuration - NOT IMPLEMENTED

## Constraints/Non-Negotiables
- Must maintain current audio quality (16kHz PCM)
- Must not break existing WebSocket functionality
- Must not require frontend UI changes
- Must follow AWS Transcribe best practices
- Must maintain authentication compatibility
- Must work with minimal auth branch (AUTH_REQUIRED=false)

## Suspected Causes
1. **Phase 0 was skipped**: Implementation focused on Phases 1-3 but Phase 0 (plumbing) was never completed
2. **Mode configuration missing**: WebSocket handler doesn't receive mode parameter
3. **AWS config not mode-aware**: TranscriptionService uses static configuration

## Narrow Fix Proposal
**Surgical Implementation** (3-4 files, ~30 lines total):

1. **Frontend**: Add mode to start_transcription message
2. **Backend**: Create getModeSpecificConfig function  
3. **Backend**: Update WebSocket handler to use mode-specific config
4. **Backend**: Update TranscriptionService to handle mode parameters

**Expected Impact**: 
- Word-for-Word: Maximum stability, no speaker labels
- Smart Dictation: Medical vocabulary, speaker attribution
- Ambient: Balanced stability, speaker diarization

**Risk Level**: Low (additive changes, existing functionality preserved)

## Files to Modify
- `frontend/src/hooks/useTranscription.ts` (add mode parameter)
- `backend/src/index.ts` (WebSocket handler + config function)
- `backend/src/services/transcriptionService.ts` (AWS config)
- `backend/src/types/index.ts` (type updates)

## Testing Strategy
1. Test each mode with different configurations
2. Verify AWS receives correct parameters
3. Test mode switching during session
4. Test backward compatibility
5. Test with minimal auth branch

## Success Criteria
- [ ] All three modes use different AWS configurations
- [ ] No performance degradation
- [ ] All existing tests pass
- [ ] New mode-specific tests pass
- [ ] AWS Transcribe receives correct parameters per mode

## Rollback Plan
If issues arise:
1. Revert WebSocket handler changes
2. Revert TranscriptionService changes  
3. Keep frontend changes (additive only)
4. All modes fall back to current configuration

## Dependencies
- AWS Transcribe SDK (✅ implemented)
- WebSocket infrastructure (✅ implemented)
- Mode selection UI (✅ implemented)
- Authentication system (✅ implemented)

## Timeline
- **Implementation**: ~2 hours
- **Testing**: ~30 minutes
- **Total**: ~2.5 hours

## Next Steps
1. Create implementation branch
2. Implement changes following surgical approach
3. Test each mode configuration
4. Update SHIPLOG
5. Create PR with checklist
