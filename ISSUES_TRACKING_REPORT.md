# CentomoMD - Issues Tracking Report

## 📋 Overview
This document tracks all current issues with the CentomoMD application, their status, and resolution steps. Update this file as issues are resolved.

**Last Updated:** 2025-08-31 18:10 EST  
**Status:** 🔴 Critical Issues Blocking Development

---

## 🚨 Critical Issues (Blocking)

### 1. Database Connection Issue
**Status:** 🔴 **CRITICAL**  
**Priority:** P0  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- Backend server fails to start due to invalid DATABASE_URL format
- Error: `Invalid DATABASE_URL format: TypeError: Invalid URL`
- URL contains space: `db.kbjulpxgjqzgbkshqsme.supabase.ca co:5432` (should be `db.kbjulpxgjqzgbkshqsme.supabase.co:5432`)

**Current State:**
- ✅ Fixed in `.env` file (removed space)
- ✅ Backend server starts successfully
- ✅ Health endpoint responds: `{"status":"ok"}`
- ✅ Database connection working

**Resolution:** ✅ **RESOLVED** - Space removed from hostname

---

### 2. TypeScript Compilation Errors
**Status:** 🟡 **HIGH PRIORITY**  
**Priority:** P1  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- 87 TypeScript compilation errors preventing clean builds
- Multiple categories of issues across 20 files

**Error Categories:**

#### 2.1 Environment Variable Access Issues
**Files Affected:**
- `src/config/environment.ts` (9 errors)
- `src/middleware/authMiddleware.ts` (8 errors)
- `src/utils/logger.ts` (5 errors)

**Error Pattern:**
```typescript
// Current (causing errors):
process.env.NODE_ENV
process.env.AWS_REGION

// Should be:
process.env['NODE_ENV']
process.env['AWS_REGION']
```

#### 2.2 Missing Return Statements
**Files Affected:**
- `src/auth.ts` (2 errors)
- `src/index.ts` (9 errors)
- `src/middleware/authMiddleware.ts` (2 errors)
- `src/routes/auth.ts` (3 errors)
- `src/routes/profile.ts` (2 errors)

**Error Pattern:**
```typescript
// Current (causing errors):
export const authMiddleware = async (req, res, next) => {
  if (condition) {
    return next();
  }
  // Missing return statement for other code paths
}

// Should be:
export const authMiddleware = async (req, res, next) => {
  if (condition) {
    return next();
  }
  return next(); // or appropriate return
}
```

#### 2.3 Unused Variables
**Files Affected:**
- `src/controllers/exportController.ts`
- `src/controllers/sessionController.ts`
- `src/controllers/templateController.ts`
- `src/controllers/transcriptController.ts`
- `src/routes/config.ts`
- `src/services/aiFormattingService.ts`
- `src/services/transcriptionService.ts`

**Error Pattern:**
```typescript
// Current (causing errors):
router.post('/', async (req, res) => {
  // req is declared but never used
})

// Should be:
router.post('/', async (_req, res) => {
  // Use underscore prefix for unused parameters
})
```

#### 2.4 Template Library Type Conflicts
**Files Affected:**
- `src/template-library/index.ts` (9 errors)
- `template-library/index.ts` (2 errors)

**Issues:**
- Export declaration conflicts
- Missing required properties
- Type mismatches

#### 2.5 AWS Transcribe Service Issues
**Files Affected:**
- `src/services/transcriptionService.ts` (8 errors)

**Issues:**
- Language code type mismatches
- Stream handling type errors
- Missing destroy method

**Resolution Status:** 🔴 **NEEDS FIXING**

---

### 3. Template Library Loading Issues
**Status:** 🟡 **MEDIUM PRIORITY**  
**Priority:** P2  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- `__dirname is not defined` error in ES modules
- Duplicate template library files causing conflicts

**Current State:**
- ✅ Fixed `__dirname` issue in `backend/template-library/index.ts`
- ✅ Template library loads successfully (66 templates)
- ⚠️ Still have duplicate files causing type conflicts

**Files Involved:**
- `backend/template-library/index.ts` (old version)
- `backend/src/template-library/index.ts` (new version)

**Resolution Status:** 🟡 **PARTIALLY RESOLVED**

---

### 4. Frontend API Connection Issues
**Status:** 🟡 **MEDIUM PRIORITY**  
**Priority:** P2  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- Frontend proxy errors: `http proxy error: /api/profile`
- Error: `read ECONNRESET at TCP.onStreamRead`

**Current State:**
- Backend server is running and responding
- Frontend can't connect to backend API endpoints
- Health endpoint works via direct curl

**Potential Causes:**
- CORS configuration issues
- Proxy configuration in Vite
- Network/firewall blocking

**Resolution Status:** 🔴 **NEEDS INVESTIGATION**

---

### 5. Frontend Build Warnings
**Status:** 🟢 **LOW PRIORITY**  
**Priority:** P3  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- Vite warning: `Duplicate key "newCase" in object literal`
- File: `lib/i18n.ts` lines 311-315

**Current State:**
- Application still works despite warnings
- Code quality issue

**Resolution Status:** 🟡 **NEEDS FIXING**

---

## 🔧 Infrastructure Issues

### 6. PowerShell Command Syntax
**Status:** 🟢 **LOW PRIORITY**  
**Priority:** P3  
**Last Updated:** 2025-08-31 18:10 EST

**Problem:**
- `&&` operator not supported in PowerShell
- Commands like `cd backend && npm start` fail

**Current State:**
- Using `;` separator instead of `&&`
- Commands work with proper PowerShell syntax

**Resolution Status:** ✅ **RESOLVED** - Using correct PowerShell syntax

---

## 📊 Issue Summary

| Category | Total | Critical | High | Medium | Low | Resolved |
|----------|-------|----------|------|--------|-----|----------|
| **Database** | 1 | 1 | 0 | 0 | 0 | 1 |
| **TypeScript** | 87 | 0 | 87 | 0 | 0 | 0 |
| **Template Library** | 2 | 0 | 0 | 2 | 0 | 1 |
| **Frontend** | 2 | 0 | 0 | 1 | 1 | 0 |
| **Infrastructure** | 1 | 0 | 0 | 0 | 1 | 1 |
| **Security (RLS)** | 1 | 0 | 1 | 0 | 0 | 0 |
| **TOTAL** | **94** | **1** | **88** | **3** | **2** | **3** |

## 🎯 **Current Status: Phase 2 Ready**

**✅ Completed:**
- Database connection fixed ✅
- Backend server running ✅
- Health endpoint responding ✅
- **Phase 0: Red Flag Checks - ALL PASSED** ✅
- **Phase 1: Build Blockers - ALL FIXED** ✅

**✅ Phase 2: Frontend ↔ Backend Connectivity - COMPLETED**
- ✅ Fixed API connection issues (standardized to use proxy)
- ✅ Configured CORS properly (Vite proxy working)
- ✅ Tested API endpoints (all working via proxy)

**✅ Phase 3: Template Library Deduplication - COMPLETED**
- ✅ Removed duplicate template library directory
- ✅ Consolidated to single source: `backend/src/template-library/`
- ✅ All imports working correctly
- ✅ Template endpoints functioning properly

---

## 🎯 **EXECUTION ROADMAP - Prioritized by Unblocking Speed**

### **Phase 0: Red Flag Checks (2 mins each)**
**Status:** 🔴 **CRITICAL - DO FIRST**
**Priority:** P0

**Quick Validation:**
- ✅ Backend running: `curl -s http://localhost:3001/health` → `{"status":"ok"}`
- ✅ DB URL valid: Server boots without `ERR_INVALID_URL`
- ⚠️ Template loader: Need to confirm single source (check for duplicates)

**Acceptance:** All 3 checks pass

---

### **Phase 1: Build Blockers (Types & Environment) - P0**
**Status:** 🔴 **CRITICAL - BLOCKING EVERYTHING**
**Priority:** P0

**Why:** Can't ship or reliably test anything while TS fails.

#### 1.1 Centralize Environment & Types
- **Task:** Add `src/config/env.ts` and use `ENV.X` everywhere (no raw `process.env.X`)
- **Task:** Add `env.d.ts` to type `ProcessEnv`
- **Acceptance:** `tsc --noEmit` returns 0 errors

#### 1.2 Fix Missing Returns & Unused Variables
- **Task:** Ensure every middleware/handler returns a response or `next()`
- **Task:** Prefix unused params with `_`
- **Acceptance:** `tsc --noEmit` still 0; server runs

#### 1.3 AWS Transcribe Types
- **Task:** Constrain `languageCode` to `'en-US' | 'fr-CA'`
- **Task:** Guard `.destroy()` method
- **Acceptance:** No TS errors in `transcriptionService.ts`

---

### **Phase 2: Frontend ↔ Backend Connectivity - P0**
**Status:** ✅ **COMPLETED**
**Priority:** P0

**Why:** Your FE can't talk to BE; everything else feels "broken."

#### 2.1 Choose Connection Strategy
**Option A (Simplest):** `VITE_API_BASE_URL=http://localhost:3001` and call `${API}/api/....`
**Option B (Proxy):** Vite proxy to `http://localhost:3001` + CORS allowlist in BE

#### 2.2 Windows-Specific Fixes
- **Task:** Use `nodemon --legacy-watch` for Windows compatibility

#### 2.3 Acceptance Criteria
- ✅ `curl -i http://localhost:3001/api/config` works
- ✅ FE call to `/api/config` succeeds (no ECONNRESET)
- ✅ `/api/profile GET` returns 200 (or 401 if intentionally gated)
- ✅ All API endpoints working via Vite proxy
- ✅ Standardized all frontend API calls to use proxy instead of hardcoded URLs

---

### **Phase 3: Template Library Deduplication - P1**
**Status:** ✅ **COMPLETED**
**Priority:** P1

**Why:** Type/name conflicts create flaky builds.

#### 3.1 Consolidate Template Library
- **Task:** Keep only `backend/src/template-library/`
- **Task:** Export single `templateLibrary` object
- **Task:** Update all imports to that path

#### 3.2 Acceptance Criteria
- ✅ Startup logs "Template Library loaded: 66…"
- ✅ No duplicate template library directories
- ✅ Single source of truth: `backend/src/template-library/`
- ✅ All template endpoints working correctly

---

### **Phase 4: Frontend Warning Cleanup - P3**
**Status:** 🟢 **LOW PRIORITY**
**Priority:** P3

**Why:** Noise hides real problems.

#### 4.1 Remove Duplicate Keys
- **Task:** Remove duplicate `newCase` key in `i18n.ts`

#### 4.2 Acceptance Criteria
- ✅ Vite shows no duplicate-key warnings

---

### **Phase 5: RLS Implementation (PR7) - P1**
**Status:** 🟡 **HIGH PRIORITY**
**Priority:** P1 (after Phases 1-3)

**Why:** Data isolation is core, but don't block yourself before FE/BE talk.

#### 5.1 Staging RLS Setup
- **Task:** Run RLS SQL (choose Global templates for now)
- **Task:** Seed memberships for test users
- **Task:** Ensure session inserts always include `clinic_id`

#### 5.2 Acceptance Criteria
- ✅ As User A: `select * from sessions` → only Clinic A rows
- ✅ As User A: `select * from transcripts` → only Clinic A (via session)

---

### **Phase 6: Gradual Auth Flags - P2**
**Status:** 🟡 **MEDIUM PRIORITY**
**Priority:** P2

**Why:** Keep rollouts reversible.

#### 6.1 Auth Implementation Strategy
- **Task:** Keep `AUTH_REQUIRED=false`, `WS_REQUIRE_AUTH=false` until staging is green
- **Task:** PR3 (WS token) ON in staging; verify dictation path
- **Task:** PR4-PR5 (HTTP + FE guards) on highest-risk endpoints/pages first

#### 6.2 Acceptance Criteria
- ✅ Unauthorized calls 401 on gated routes; others unchanged

---

### **Phase 7: Hygiene & Operations - P3**
**Status:** 🟢 **LOW PRIORITY**
**Priority:** P3

#### 7.1 Security Hardening
- **Task:** Add rate-limit behind `RATE_LIMIT_ENABLED=false`
- **Task:** Helmet + strict CORS allowlist
- **Task:** Audit logs (no PII), redact tokens/queries in logs

---

## 📋 **TL;DR Priority List**

1. **Fix TS errors + env wrapper** (can't build)
2. **Fix FE↔BE connectivity** (can't test)
3. **Dedupe template library** (remove conflicts)
4. **Staging RLS (PR7)** with memberships + clinic_id on session writes
5. **Gradual auth flags** (PR3→PR5)
6. **Warnings & ops hardening**

---

## 🔄 Update Instructions

When fixing issues:

1. **Update Status:** Change status emoji (🔴🟡🟢) and add ✅ when resolved
2. **Add Resolution Date:** Update "Last Updated" timestamp
3. **Document Fix:** Add resolution details under each issue
4. **Update Summary Table:** Adjust counts in the summary table
5. **Move to Resolved Section:** Move completed issues to resolved section

---

## ✅ Resolved Issues

### Database Connection Issue
**Resolved:** 2025-08-31 18:10 EST  
**Fix:** Removed space from DATABASE_URL hostname  
**Status:** ✅ **COMPLETE**

### PowerShell Command Syntax
**Resolved:** 2025-08-31 18:10 EST  
**Fix:** Used `;` separator instead of `&&` for PowerShell  
**Status:** ✅ **COMPLETE**

### Template Library __dirname Issue
**Resolved:** 2025-08-31 18:10 EST  
**Fix:** Changed `__dirname` to `process.cwd()` in template library  
**Status:** ✅ **COMPLETE**

### Frontend ↔ Backend Connectivity Issues
**Resolved:** 2025-08-31 23:20 EST  
**Fix:** Standardized all frontend API calls to use Vite proxy instead of hardcoded URLs  
**Files Fixed:**
- `frontend/src/services/formattingService.ts` - Changed API_BASE from hardcoded URL to `/api`
- `frontend/src/pages/TemplateManagement.tsx` - Updated all fetch calls to use proxy
- `frontend/src/components/transcription/TemplateDropdown.tsx` - Updated fetch calls to use proxy
**Status:** ✅ **COMPLETE**

### Template Library Deduplication Issues
**Resolved:** 2025-08-31 23:30 EST  
**Fix:** Removed duplicate template library directory and consolidated to single source  
**Files Fixed:**
- Removed `backend/template-library/` (old directory with compiled JS files)
- Kept `backend/src/template-library/` (single source of truth)
- All imports already pointing to correct location
**Status:** ✅ **COMPLETE**
