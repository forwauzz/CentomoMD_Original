# Phase 0: Mode-Specific AWS Configuration Implementation Plan

## Overview
This document outlines the implementation of mode-specific AWS Transcribe configuration to complete Phase 0 of the transcription pipeline. Currently, all modes use identical AWS parameters, which limits optimization for specific use cases.

## Problem Statement
**Current Issue**: All transcription modes (Word-for-Word, Smart Dictation, Ambient) use the same AWS Transcribe configuration, preventing mode-specific optimizations.

**Impact**: 
- Word-for-Word mode doesn't get maximum stability optimization
- Smart Dictation mode doesn't leverage medical vocabulary
- Ambient mode doesn't optimize for speaker diarization

## Acceptance Criteria
- [ ] Word-for-Word mode: High stability, no speaker labels, no vocabulary
- [ ] Smart Dictation mode: High stability, speaker labels, medical vocabulary
- [ ] Ambient mode: Medium stability, speaker labels, no vocabulary
- [ ] All modes maintain current audio quality and performance
- [ ] No breaking changes to existing functionality
- [ ] All tests pass with new configuration

## Impacted Files
- `frontend/src/hooks/useTranscription.ts` - Add mode to start message
- `backend/src/index.ts` - WebSocket handler mode configuration
- `backend/src/services/transcriptionService.ts` - Mode-specific AWS config
- `backend/src/types/index.ts` - Update TranscriptionConfig interface

## Implementation Steps

### Step 1: Update Frontend Message Format
**File**: `frontend/src/hooks/useTranscription.ts`
**Change**: Add mode parameter to start_transcription message
**Risk**: Low - additive change only

### Step 2: Create Mode Configuration Function
**File**: `backend/src/index.ts`
**Change**: Add getModeSpecificConfig function
**Risk**: Low - new function, no existing code changes

### Step 3: Update WebSocket Handler
**File**: `backend/src/index.ts`
**Change**: Use mode-specific configuration in WebSocket handler
**Risk**: Medium - modifies existing WebSocket logic

### Step 4: Update TranscriptionService
**File**: `backend/src/services/transcriptionService.ts`
**Change**: Handle mode-specific AWS parameters
**Risk**: Medium - modifies AWS configuration logic

### Step 5: Update Type Definitions
**File**: `backend/src/types/index.ts`
**Change**: Add mode-specific fields to TranscriptionConfig
**Risk**: Low - additive type changes

## Tests to Add/Update
- [ ] Test Word-for-Word mode configuration
- [ ] Test Smart Dictation mode configuration  
- [ ] Test Ambient mode configuration
- [ ] Test mode switching during session
- [ ] Test backward compatibility
- [ ] Test AWS parameter validation

## Rollback Plan
If issues arise:
1. Revert WebSocket handler changes
2. Revert TranscriptionService changes
3. Keep frontend changes (additive only)
4. All modes will fall back to current configuration

## Why Now / Why This Approach
**Why Now**: Phase 0 was planned but never completed. Current implementation works but doesn't leverage mode-specific optimizations.

**Why This Approach**: 
- Minimal changes to existing working system
- Leverages existing mode selection UI
- Follows AWS best practices for parameter optimization
- Maintains backward compatibility

## Constraints/Non-Negotiables
- Must maintain current audio quality (16kHz PCM)
- Must not break existing WebSocket functionality
- Must not require frontend UI changes
- Must follow AWS Transcribe best practices
- Must maintain authentication compatibility

## Success Metrics
- [ ] All three modes use different AWS configurations
- [ ] No performance degradation
- [ ] All existing tests pass
- [ ] New mode-specific tests pass
- [ ] AWS Transcribe receives correct parameters per mode

## Dependencies
- AWS Transcribe SDK (already implemented)
- WebSocket infrastructure (already implemented)
- Mode selection UI (already implemented)
- Authentication system (already implemented)

## Timeline
- **Step 1-2**: 30 minutes (frontend message + config function)
- **Step 3-4**: 45 minutes (WebSocket handler + TranscriptionService)
- **Step 5**: 15 minutes (type updates)
- **Testing**: 30 minutes
- **Total**: ~2 hours

## Next Steps
1. Create implementation branch
2. Implement changes following surgical approach
3. Test each mode configuration
4. Update SHIPLOG
5. Create PR with checklist
