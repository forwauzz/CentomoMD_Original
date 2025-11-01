# 🧪 Testing Guide: Auth Fix - Step 1

**Fix:** Replace `localStorage.getItem('access_token')` with Supabase session token  
**File:** `frontend/src/components/transcription/TranscriptionInterface.tsx`  
**Status:** ✅ Completed

---

## 🔍 Testing Steps

### Test 1: Verify Token Retrieval (Browser Console)

**Objective:** Confirm that the code can retrieve the token from Supabase session

#### In Development:
1. Start the dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser at `http://localhost:5173`

3. **Login first** (via Google OAuth or Magic Link)

4. Open browser console (F12 or DevTools)

5. Test token retrieval:
   ```javascript
   // In browser console:
   import('@/lib/authClient').then(module => {
     const { supabase } = module;
     supabase.auth.getSession().then(({ data, error }) => {
       console.log('✅ Session:', data?.session ? 'Found' : 'Not found');
       console.log('✅ Token exists:', !!data?.session?.access_token);
       console.log('✅ Token length:', data?.session?.access_token?.length || 0);
       if (error) console.error('❌ Error:', error);
     });
   });
   ```

   **Expected Result:**
   - ✅ Session found
   - ✅ Token exists: `true`
   - ✅ Token length: > 100 characters (JWT token)

#### In Production:
1. Go to `https://azure-production.d1deo9tihdnt50.amplifyapp.com`

2. **Login first** (via Google OAuth or Magic Link)

3. Open browser console

4. Run the same test:
   ```javascript
   // In browser console:
   window.supabase.auth.getSession().then(({ data, error }) => {
     console.log('✅ Session:', data?.session ? 'Found' : 'Not found');
     console.log('✅ Token exists:', !!data?.session?.access_token);
     console.log('✅ Token length:', data?.session?.access_token?.length || 0);
     if (error) console.error('❌ Error:', error);
   });
   ```

   **Expected Result:** Same as development

---

### Test 2: Verify Authorization Header is Sent (Network Tab)

**Objective:** Confirm that API calls include the Authorization header with the correct token

#### In Development:
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR" or "WS"
3. **Login if not already logged in**
4. Navigate to a transcription page
5. Trigger the AI formatting (use Word-for-Word with AI template)
6. Look for request to `/format/word-for-word-ai` or `${API_BASE_URL}/format/word-for-word-ai`
7. Click on the request → Headers tab
8. Check Request Headers section

   **Expected Headers:**
   ```
   Authorization: Bearer eyJhbGci... (long JWT token)
   Content-Type: application/json
   x-correlation-id: ww-ai-...
   ```

   **Verify:**
   - ✅ `Authorization` header exists
   - ✅ Token starts with `Bearer `
   - ✅ Token is a long JWT string (not `null` or empty)

#### In Production:
1. Open DevTools → Network tab
2. Go to production: `https://azure-production.d1deo9tihdnt50.amplifyapp.com`
3. **Login if not already logged in**
4. Navigate to transcription page
5. Trigger the AI formatting
6. Look for request to `https://api.alie.app/format/word-for-word-ai`
7. Check Request Headers

   **Expected:** Same as development

---

### Test 3: Verify API Call Succeeds (Console Logs)

**Objective:** Confirm that the API call returns 200 OK instead of 401 Unauthorized

#### In Development:
1. Open browser console
2. Navigate to transcription page
3. Trigger AI formatting
4. Look for console logs:
   ```
   [ww-ai-...] Starting AI formatting request
   [ww-ai-...] AI formatting response: { status: 200, ok: true }
   [ww-ai-...] AI formatting result: { success: true, ... }
   ```

   **Expected:**
   - ✅ `status: 200` (not 401)
   - ✅ `ok: true`
   - ✅ `success: true` in result

#### In Production:
1. Open browser console
2. Navigate to transcription page
3. Trigger AI formatting
4. Check console logs for same pattern

   **Expected:** Same as development

---

### Test 4: Verify No localStorage Token Dependency

**Objective:** Confirm that the code doesn't rely on localStorage

#### Test:
1. Open browser console
2. Clear localStorage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. **But don't log out** (keep Supabase session active)
4. Try to use AI formatting
5. Check Network tab for Authorization header

   **Expected:**
   - ✅ Authorization header still present (token comes from Supabase session, not localStorage)
   - ✅ API call succeeds

#### Compare (Before Fix):
If we were using the old code:
- ❌ `localStorage.getItem('access_token')` would return `null`
- ❌ Authorization header would be `Bearer null` or missing
- ❌ API call would return 401 Unauthorized

#### After Fix:
- ✅ Token comes from Supabase session
- ✅ Authorization header is `Bearer <actual-jwt-token>`
- ✅ API call returns 200 OK

---

### Test 5: Manual Verification in Code

**Objective:** Verify the actual code change

#### Check the fix:
1. Open `frontend/src/components/transcription/TranscriptionInterface.tsx`
2. Navigate to line ~625-635
3. Verify the code:

   **Before (WRONG):**
   ```typescript
   'Authorization': `Bearer ${localStorage.getItem('access_token')}`
   ```

   **After (CORRECT):**
   ```typescript
   // Get access token from Supabase session
   const { data: { session } } = await supabase.auth.getSession();
   const accessToken = session?.access_token || null;
   
   // ... in headers:
   ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
   ```

   **Verify:**
   - ✅ Import statement for `supabase` exists at top of file
   - ✅ Token is retrieved from `supabase.auth.getSession()`
   - ✅ Authorization header only added if token exists
   - ✅ No `localStorage.getItem('access_token')` references

---

## 🚨 Troubleshooting

### Issue: Token is `null` or undefined

**Check:**
1. Are you logged in? (Check Supabase session)
2. Has the session expired? (Supabase sessions expire after 1 hour by default)
3. Is Supabase configured correctly? (Check env vars)

**Fix:**
- Log out and log back in
- Check browser console for Supabase errors

### Issue: Authorization header missing

**Check:**
1. Is the token retrieval happening before the fetch call?
2. Check browser console for errors

**Fix:**
- Verify the code waits for `await supabase.auth.getSession()` before making fetch call
- Check that `accessToken` is not null

### Issue: Still getting 401 Unauthorized

**Check:**
1. Is the token valid? (Check Network tab - token should be long JWT string)
2. Is the backend accepting tokens? (Check backend logs)
3. Is CORS configured correctly? (Check Network tab for CORS errors)

**Fix:**
- Verify token is valid JWT (starts with `eyJ`)
- Check backend auth middleware is working
- Verify CORS allows your origin

---

## ✅ Success Criteria

The fix is working correctly if:

1. ✅ Token is retrieved from Supabase session (not localStorage)
2. ✅ Authorization header is sent in API requests
3. ✅ API calls return 200 OK (not 401)
4. ✅ No console errors related to authentication
5. ✅ AI formatting works end-to-end

---

## 📝 Next Steps

After confirming Step 1 works:

- **Step 2:** Make `api()` function auto-add auth headers (prevents this issue in other places)
- **Step 3:** Test all API endpoints work correctly

---

## 🔗 Related Files

- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Fixed file
- `frontend/src/lib/authClient.ts` - Supabase client
- `frontend/src/lib/api.ts` - API helper functions
- `backend/src/middleware/auth.ts` - Backend auth middleware

