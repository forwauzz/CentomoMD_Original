# 🔍 Troubleshooting Guide: `/api/cases` 404 Error

**Date:** 2025-01-21  
**Branch:** `hotfix/auth-issue`  
**Issue:** `GET /api/cases` and `POST /api/cases` return 404 "Cannot GET/POST /api/cases" in production  
**Environment:** Production backend on EC2, Production frontend on AWS Amplify

---

## 📋 Problem Summary

### Symptom
- **Production:** Browser and API calls to `https://api.alie.app/api/cases` return **404 Not Found**
- **Response:** Express default 404 HTML error page (`Cannot GET /api/cases`)
- **Status Code:** 404 (not 401 Unauthorized, which would indicate auth failure)
- **Impact:** Users cannot access recent cases or create new cases in production

### What Works
- ✅ `GET /api/profile` - Works in production
- ✅ `GET /api/clinics` - Works in production  
- ✅ `POST /api/cases` - Works in **development**
- ✅ `GET /api/cases/:id` - Works in **development**
- ✅ Authentication is working (logs show authenticated users)

### What Doesn't Work
- ❌ `GET /api/cases` - 404 in **production** (not tested in dev)
- ❌ `POST /api/cases` - 404 in **production**

---

## 🏗️ Code Structure

### Backend Route Definition

**File:** `backend/src/routes/cases.ts`

**Route Handlers:**
```typescript
// Line 13: POST /api/cases - Create a new case
router.post('/', async (req, res) => {
  // Handler implementation
});

// Line 96: GET /api/cases - Get recent cases with optional filters
router.get('/', async (req, res) => {
  // Handler implementation
  // Should log: "📖 [Cases] Fetching recent cases:"
});

// Line 485: GET /api/cases/:id - Get specific case
router.get('/:id', async (req, res) => {
  // Handler implementation
});

// Line 553: Export default router
export default router;
```

**Authentication:**
```typescript
// Line 10: Auth middleware applied to all routes
router.use(authenticateUser);
```

### Route Mounting

**File:** `backend/src/index.ts` (lines 644-651)

```typescript
// Cases routes
try {
  const casesRouter = await import('./routes/cases.js');
  app.use('/api/cases', casesRouter.default);
  console.log('✅ /api/cases routes mounted');
} catch(e) {
  console.error('❌ mount /api/cases:', e);
}
```

**Mounting Pattern:**
- Uses **dynamic async import** (`await import()`)
- Wrapped in try-catch for error handling
- Mounted at base path `/api/cases`
- Routes defined with relative paths (`router.get('/')`)

**Similar Routes (for comparison):**
- Sessions: `app.use('/api/sessions', sessionsRouter.default);` ✅
- Format: `app.use('/api/format', formatRouter.default);` ✅  
- Debug: `app.use('/api/debug', debugRouter.default);` ✅
- Profile: `app.use(profileRouter);` ✅ (different pattern - full paths in router)

---

## 🔍 Evidence & Logs

### Production Browser Test

**Request:**
```javascript
const { data: { session } } = await window.supabase.auth.getSession();
const token = session?.access_token;

// GET request
const response = await fetch('https://api.alie.app/api/cases?limit=5', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Response:**
- **Status:** 404 Not Found
- **Body:** `<!DOCTYPE html>...<pre>Cannot GET /api/cases</pre>`

### Production Backend Runtime Logs

**When accessing cases:**
```
🔐 API request: GET /api/cases with auth          ✅ Security middleware runs
🔐 [AUTH] Authenticated user: 62f20e8a-...        ✅ Auth middleware runs & passes
                                                  ❌ Route handler NOT executing
                                                  ❌ No "📖 [Cases] Fetching recent cases:" log
```

**Observations:**
- Security middleware runs (global middleware)
- Auth middleware runs (router-level middleware)
- Route handler **does not execute** (no handler logs)
- Response is 404 (Express default handler)

**When creating cases:**
```
🔐 API request: POST /api/cases with auth          ✅ Security middleware runs
🔐 [AUTH] Authenticated user: 62f20e8a-...        ✅ Auth middleware runs & passes
                                                  ❌ Route handler NOT executing
                                                  ❌ No "📝 [Cases] Creating new case:" log
```

### Development Environment Logs

**POST /api/cases (Works in dev):**
```
📝 [Cases] Creating new case: { userId: '...', clinicId: '...' }
✅ [Cases] Successfully created case: dc912e47-...
```

**GET /api/cases/:id (Works in dev):**
```
📖 [Cases] Fetching case: dc912e47-...
✅ [Cases] Successfully fetched case: dc912e47-...
```

**Note:** `GET /api/cases` (recent cases) was not tested in dev.

---

## 🔎 Root Cause Analysis

### Hypothesis 1: Route Not Mounted (Most Likely - 90%)

**Evidence:**
- 404 response indicates route doesn't exist in Express
- No handler logs despite auth passing
- Security middleware runs (global, before routes)
- Auth middleware runs (suggests route exists, but handler doesn't execute)

**Possible Causes:**
1. **Async import failed during startup**
   - `await import('./routes/cases.js')` threw error
   - Caught by try-catch, logged but route not mounted
   - **Check:** Production startup logs for `❌ mount /api/cases: [error]`

2. **Build/deployment issue**
   - `cases.ts` not compiled to `cases.js` in production
   - File missing from production `dist/` folder
   - **Check:** Verify `cases.js` exists in production build

3. **Production backend on different code version**
   - Cases route added in newer commit
   - Production backend not redeployed/updated
   - **Check:** Compare production backend commit with repo

### Hypothesis 2: Route Mounted But Handler Not Registered (60%)

**Evidence:**
- Auth middleware runs (suggests route exists)
- But handler doesn't execute
- Could be route ordering or handler registration issue

**Possible Causes:**
1. **Route handler syntax error**
   - Handler defined but not properly registered
   - TypeScript compiles but runtime error prevents registration
   
2. **Route path conflict**
   - Another route catching `/api/cases` first
   - Wildcard route before cases route

### Hypothesis 3: Response Already Sent (30%)

**Evidence:**
- Auth middleware runs and passes
- But handler doesn't execute
- Could indicate middleware chain issue

**Possible Causes:**
1. **Auth middleware not calling `next()` correctly**
   - Middleware logs success but doesn't pass control
   
2. **Error handler intercepting**
   - Handler throws error before first log
   - Error caught but returns 404 instead of 500

---

## 🛠️ Investigation Steps Taken

### ✅ Completed

1. **Code Review**
   - Verified route definitions exist
   - Confirmed export default router
   - Checked route mounting pattern
   - Compared with working routes (sessions, format)

2. **Frontend Analysis**
   - Verified API calls use correct endpoints
   - Confirmed authentication headers are sent
   - Checked `apiFetch` function implementation

3. **Development Testing**
   - Confirmed POST /api/cases works in dev
   - Confirmed GET /api/cases/:id works in dev
   - Noted GET /api/cases not tested in dev

4. **Production Testing**
   - Confirmed 404 error in browser console
   - Verified auth middleware runs (from logs)
   - Confirmed handler doesn't execute (no logs)

### ❌ Not Yet Completed

1. **Production Backend Startup Logs**
   - Need to check for `✅ /api/cases routes mounted` (success)
   - Need to check for `❌ mount /api/cases: [error]` (failure)
   - Need to verify other routes mount successfully

2. **Production Build Verification**
   - Check if `cases.js` exists in production `dist/` folder
   - Verify build includes cases route
   - Compare production build with repository

3. **Dev Environment GET /api/cases Test**
   - Test recent cases endpoint in dev
   - Verify it works before comparing with production

---

## 🔗 Key Files

### Backend Files

1. **Route Definition:** `backend/src/routes/cases.ts`
   - Lines 1-553: Route handlers and router export
   - Line 10: Auth middleware
   - Line 13: POST handler
   - Line 96: GET handler (recent cases)
   - Line 485: GET handler (by ID)
   - Line 553: Export default

2. **Route Mounting:** `backend/src/index.ts`
   - Lines 644-651: Cases route mounting
   - Lines 636-642: Sessions route (for comparison)
   - Lines 654-660: Format route (for comparison)

3. **Authentication:** `backend/src/middleware/auth.ts`
   - Line 27-74: `authenticateUser` middleware
   - Logs: `🔐 [AUTH] Authenticated user: {id}`

4. **Security Middleware:** `backend/src/server/security.ts`
   - Lines 73-86: Security logging middleware
   - Logs: `🔐 API request: {method} {path} {auth}`

5. **Database Schema:** `backend/src/database/schema.ts`
   - Line 108: `cases` table export

### Frontend Files

1. **API Client:** `frontend/src/lib/api.ts`
   - Lines 48-75: `api()` function (auto-adds auth headers)
   - Lines 87-133: `apiFetch()` function

2. **Case Store:** `frontend/src/stores/caseStore.ts`
   - Line 916: `getRecentCases()` calls `/api/cases?limit=...`
   - Line 700: `createNewCase()` calls `POST /api/cases`

3. **Components:**
   - `frontend/src/components/case/NewCaseWithClinicSelection.tsx` (line 41)
   - `frontend/src/components/dashboard/RecentCasesCard.tsx` (line 92, 106)

---

## 🧪 Testing Commands

### Test GET /api/cases from Browser Console

```javascript
const { data: { session } } = await window.supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch('https://api.alie.app/api/cases?limit=5', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

console.log('Status:', response.status);
console.log('Response:', await response.text());
```

### Test POST /api/cases from Browser Console

```javascript
const { data: { session } } = await window.supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch('https://api.alie.app/api/cases', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: 'some-clinic-id', // or null
    draft: {}
  })
});

console.log('POST Status:', response.status);
console.log('POST Response:', await response.text());
```

### Test from EC2 (SSH)

```bash
# Test if route exists locally on EC2
curl -X GET "http://localhost:3001/api/cases?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -v

# Test production endpoint from EC2
curl -X GET "https://api.alie.app/api/cases?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

---

## 🔍 Diagnostic Checklist

### On EC2 / Production Backend

- [ ] **Check startup logs for route mounting:**
  ```bash
  # Look for these messages in startup logs
  ✅ /api/cases routes mounted
  # OR
  ❌ mount /api/cases: [error details]
  ```

- [ ] **Verify cases.js exists in production:**
  ```bash
  ls -la dist/src/routes/cases.js
  # Should exist if route is compiled
  ```

- [ ] **Check production backend code version:**
  ```bash
  git log --oneline -10
  git show HEAD:backend/src/routes/cases.ts
  # Compare with current repo
  ```

- [ ] **Verify other dynamic routes mount:**
  - Check for `✅ /api/sessions routes mounted`
  - Check for `✅ /api/format routes mounted`
  - Check for `✅ /api/debug routes mounted`
  - If these mount but cases doesn't → Cases-specific issue

- [ ] **Check for import errors:**
  - Look for any errors related to `cases.js` import
  - Check for database connection errors during import
  - Look for missing dependency errors

### In Development

- [ ] **Test GET /api/cases endpoint:**
  - Use browser console or API client
  - Verify it logs `📖 [Cases] Fetching recent cases:`
  - Confirm it returns data successfully

- [ ] **Verify route mounts in dev:**
  - Check dev server startup logs
  - Look for `✅ /api/cases routes mounted`

---

## 📊 Environment Details

### Production

- **Backend:** EC2 instance
- **Backend URL:** `https://api.alie.app`
- **Frontend:** AWS Amplify
- **Frontend URL:** `https://azure-production.d1deo9tihdnt50.amplifyapp.com`
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

### Development

- **Backend:** Local development server
- **Backend URL:** `http://localhost:3001` (or configured)
- **Frontend:** Vite dev server
- **Database:** Same Supabase (dev data)
- **Authentication:** Same Supabase Auth

### Environment Variables (Production Frontend)

- `VITE_API_BASE_URL=https://api.alie.app`
- `VITE_SITE_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com`
- `VITE_SUPABASE_URL` (configured)
- `VITE_SUPABASE_ANON_KEY` (configured)

---

## 🎯 Most Likely Solutions

### Solution 1: Fix Async Import Failure

If production logs show `❌ mount /api/cases: [error]`:

1. **Check error details:**
   - Syntax error in cases.ts?
   - Missing dependency?
   - Database connection issue?

2. **Fix the error:**
   - Resolve import/dependency issues
   - Fix any syntax errors
   - Ensure database is accessible

3. **Redeploy backend:**
   - Build and deploy updated backend
   - Verify route mounts successfully

### Solution 2: Fix Build/Deployment Issue

If `cases.js` missing in production:

1. **Verify build process:**
   - Ensure TypeScript compiles cases.ts
   - Check build output includes routes

2. **Fix deployment:**
   - Ensure all files copied to production
   - Verify build artifacts included

3. **Redeploy:**
   - Rebuild and redeploy backend

### Solution 3: Update Production Backend Code

If production on old code version:

1. **Pull latest code:**
   ```bash
   git pull origin hotfix/auth-issue
   ```

2. **Rebuild backend:**
   ```bash
   cd backend
   npm run build
   ```

3. **Restart backend:**
   ```bash
   pm2 restart centomo-api
   # or your process manager command
   ```

---

## 📝 Next Steps for Troubleshooting

### Immediate Actions

1. **Check production backend startup logs**
   - Look for route mounting messages
   - Identify any import errors
   - Compare with other route mounting

2. **Verify production build**
   - Check if cases.js exists
   - Compare with dev build structure

3. **Test in dev environment**
   - Test GET /api/cases endpoint
   - Verify it works before comparing with production

### If Route Not Mounted

1. Fix the error preventing import
2. Redeploy backend
3. Verify route mounts successfully
4. Test endpoint in production

### If Route Mounted But Not Working

1. Check route handler registration
2. Verify handler syntax is correct
3. Check for route ordering conflicts
4. Test handler directly

---

## 🔗 Related Documentation

- `docs/CASES_API_404_RESEARCH.md` - Detailed research findings
- `docs/CASES_API_TEST.md` - Testing notes
- `docs/AUTH_API_FETCH_AUDIT.md` - Authentication audit (related)

---

## 📞 Contact Information

**Repository:** `hotfix/auth-issue` branch  
**Last Updated:** 2025-01-21  
**Status:** Investigation phase - awaiting production startup logs

---

## 💡 Key Insights

1. **Code structure is correct** - Routes exist and work in dev
2. **Auth is working** - Middleware runs successfully
3. **Route handler doesn't execute** - 404 suggests route not mounted
4. **Most likely cause** - Async import failed during production startup
5. **Solution** - Fix import error or deployment issue, then redeploy

---

**This document should provide comprehensive context for an external agent to troubleshoot the issue.**

