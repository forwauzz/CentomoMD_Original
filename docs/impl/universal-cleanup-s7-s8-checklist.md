# Universal Cleanup S7-S8 Implementation Checklist

## Phase 1: Core Types & Infrastructure

### 1.1 Backend Types
- **File**: `backend/shared/types/clinical.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 1.2 Frontend Types
- **File**: `frontend/src/types/clinical.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (frontend)

### 1.3 Clinical Prompts
- **File**: `backend/src/prompts/clinical.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 1.4 Environment Configuration
- **File**: `.env.example`
- **Operation**: Modify (add `UNIVERSAL_CLEANUP_ENABLED=false`)
- **Verification**: `grep UNIVERSAL_CLEANUP_ENABLED .env.example`

## Phase 2: Core S7 UniversalCleanup Layer

### 2.1 UniversalCleanup Layer Implementation
- **File**: `backend/src/services/layers/UniversalCleanupLayer.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 2.2 Layer Registration
- **File**: `backend/src/services/layers/LayerManager.ts`
- **Operation**: Modify (add UniversalCleanupLayer import and registration)
- **Verification**: `npm run typecheck` (backend)

### 2.3 Template Combinations Config
- **File**: `backend/config/layers/template-combinations.json`
- **Operation**: Modify (add universal-cleanup and update template-clinical-extraction)
- **Verification**: `node -e "console.log(JSON.parse(require('fs').readFileSync('backend/config/layers/template-combinations.json', 'utf8')))"`

## Phase 3: S8 Template Pipeline

### 3.1 Template Pipeline Core
- **File**: `backend/src/services/layers/TemplatePipeline.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 3.2 Section7Enhanced Formatter Update
- **File**: `backend/src/services/formatters/Section7EnhancedFormatter.ts`
- **Operation**: Modify (accept CleanedInput instead of raw transcript)
- **Verification**: `npm run typecheck` (backend)

### 3.3 Section8Basic Formatter Update
- **File**: `backend/src/services/formatters/Section8BasicFormatter.ts`
- **Operation**: Modify (accept CleanedInput instead of raw transcript)
- **Verification**: `npm run typecheck` (backend)

### 3.4 Section11Legal Formatter Update
- **File**: `backend/src/services/formatters/Section11LegalFormatter.ts`
- **Operation**: Modify (accept CleanedInput instead of raw transcript)
- **Verification**: `npm run typecheck` (backend)

## Phase 4: Backend Integration

### 4.1 Mode2 Formatter Integration
- **File**: `backend/src/services/formatter/mode2.ts`
- **Operation**: Modify (add UNIVERSAL_CLEANUP_ENABLED flag logic)
- **Verification**: `npm run typecheck` (backend)

### 4.2 Config API Endpoint
- **File**: `backend/src/routes/config.ts` (or create if doesn't exist)
- **Operation**: Create/Modify (expose UNIVERSAL_CLEANUP_ENABLED to frontend)
- **Verification**: `curl http://localhost:3000/api/config` (if running)

### 4.3 Legacy Template Compatibility
- **File**: `backend/src/services/templates/template-clinical-extraction.ts`
- **Operation**: Modify (delegate to UniversalCleanupLayer internally)
- **Verification**: `npm run typecheck` (backend)

## Phase 5: Frontend Integration

### 5.1 TranscriptionInterface Updates
- **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx`
- **Operation**: Modify (add UNIVERSAL_CLEANUP_ENABLED flag logic in injectTemplateContent)
- **Verification**: `npm run typecheck` (frontend)

### 5.2 Clinical Entities State Management
- **File**: `frontend/src/hooks/useTranscription.ts`
- **Operation**: Modify (add clinical entities state and setters)
- **Verification**: `npm run typecheck` (frontend)

### 5.3 Progress Labels Update
- **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx`
- **Operation**: Modify (update progress labels for universal cleanup flow)
- **Verification**: `npm run build` (frontend)

## Phase 6: Testing & Validation

### 6.1 Unit Tests - UniversalCleanupLayer
- **File**: `backend/tests/UniversalCleanupLayer.test.ts`
- **Operation**: Create
- **Verification**: `npm test -- --testPathPattern=UniversalCleanupLayer`

### 6.2 Unit Tests - TemplatePipeline
- **File**: `backend/tests/TemplatePipeline.test.ts`
- **Operation**: Create
- **Verification**: `npm test -- --testPathPattern=TemplatePipeline`

### 6.3 Integration Tests - Mode2 Formatter
- **File**: `backend/tests/mode2-integration.test.ts`
- **Operation**: Create/Modify
- **Verification**: `npm test -- --testPathPattern=mode2-integration`

### 6.4 Frontend Tests - Clinical Entities
- **File**: `frontend/tests/clinical-entities.test.tsx`
- **Operation**: Create
- **Verification**: `npm test -- --testPathPattern=clinical-entities`

### 6.5 Bilingual Test Cases
- **File**: `backend/tests/bilingual-clinical.test.ts`
- **Operation**: Create
- **Verification**: `npm test -- --testPathPattern=bilingual-clinical`

## Phase 7: Performance & Monitoring

### 7.1 Performance Metrics Logging
- **File**: `backend/src/utils/performanceLogger.ts`
- **Operation**: Create/Modify (add S7/S8 timing metrics)
- **Verification**: `npm run typecheck` (backend)

### 7.2 Cache Monitoring
- **File**: `backend/src/services/layers/UniversalCleanupLayer.ts`
- **Operation**: Modify (add cache hit rate logging)
- **Verification**: `npm run typecheck` (backend)

### 7.3 Error Handling & Graceful Degradation
- **File**: `backend/src/services/layers/UniversalCleanupLayer.ts`
- **Operation**: Modify (add comprehensive error handling)
- **Verification**: `npm run typecheck` (backend)

## Phase 8: Documentation & Rollout

### 8.1 API Documentation
- **File**: `docs/api/universal-cleanup.md`
- **Operation**: Create
- **Verification**: Manual review

### 8.2 Feature Flag Documentation
- **File**: `docs/feature-flags.md`
- **Operation**: Create/Modify (document UNIVERSAL_CLEANUP_ENABLED)
- **Verification**: Manual review

### 8.3 Rollout Guide
- **File**: `docs/rollout/universal-cleanup-rollout.md`
- **Operation**: Create
- **Verification**: Manual review

## Phase 9: Shadow Testing (Dev Only)

### 9.1 Shadow Compare Implementation
- **File**: `backend/src/utils/shadowCompare.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 9.2 Shadow Testing Endpoint
- **File**: `backend/src/routes/shadow-test.ts`
- **Operation**: Create
- **Verification**: `npm run typecheck` (backend)

### 9.3 Shadow Testing Frontend
- **File**: `frontend/src/components/debug/ShadowTest.tsx`
- **Operation**: Create
- **Verification**: `npm run typecheck` (frontend)

## Phase 10: Final Validation

### 10.1 End-to-End Testing
- **File**: `test-universal-cleanup-e2e.js`
- **Operation**: Create
- **Verification**: `node test-universal-cleanup-e2e.js`

### 10.2 Performance Benchmarking
- **File**: `test-performance-benchmark.js`
- **Operation**: Create
- **Verification**: `node test-performance-benchmark.js`

### 10.3 Memory Leak Testing
- **File**: `test-memory-leaks.js`
- **Operation**: Create
- **Verification**: `node test-memory-leaks.js`

## Verification Commands Summary

- **TypeScript Check**: `npm run typecheck` (both backend and frontend)
- **Build Check**: `npm run build` (both backend and frontend)
- **Test Suite**: `npm test` (both backend and frontend)
- **Lint Check**: `npm run lint` (both backend and frontend)
- **Integration Test**: `npm run test:integration` (if available)
- **E2E Test**: `npm run test:e2e` (if available)

## Success Criteria

- [ ] All TypeScript compilation passes
- [ ] All tests pass (unit, integration, e2e)
- [ ] Performance targets met (S7 p95 < 2s, pipeline p95 < 5s)
- [ ] Bilingual parity achieved (FR/EN)
- [ ] Cache hit rate > 70%
- [ ] Zero crashes on missing fields
- [ ] Feature flag controls behavior correctly
- [ ] Legacy compatibility maintained
- [ ] Documentation complete and accurate
