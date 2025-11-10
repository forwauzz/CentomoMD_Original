# 🧪 Post-Deployment Testing Checklist

**Branch:** `hotfix/auth-issue`  
**Deployed:** [Date/Time]

---

## Step 1: Verify Deployment ✅

1. Check that the deployment completed successfully
2. Confirm the build includes the latest commit `c0b6ef9`
3. Verify environment variables are set in production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
   - `VITE_SITE_URL`

---

## Step 2: Test Login Flow 🔐

### 2.1 Open Production Site
- Go to: `https://azure-production.d1deo9tihdnt50.amplifyapp.com`
- Open browser DevTools (F12) → Console tab
- Keep Console and Network tabs open

### 2.2 Attempt Login

**Option A: Google OAuth**
1. Click "Sign in with Google"
2. Complete Google authentication
3. Watch the redirect - where does it take you?

**Option B: Magic Link**
1. Enter your email
2. Click "Send Magic Link"
3. Check your email and click the link
4. Watch the redirect - where does it take you?

### 2.3 Check Debug Logs

When you land on `/auth/callback`, check the console for:

**✅ Success Case:**
```
🔍 Auth callback triggered, processing...
🔍 Full URL: https://azure-production.d1deo9tihdnt50.amplifyapp.com/auth/callback?code=abc123...
🔍 Pathname: /auth/callback
🔍 Search params: ?code=abc123...
🔍 Hash: (empty or has #access_token=...)
🔍 VITE_SITE_URL: https://azure-production.d1deo9tihdnt50.amplifyapp.com
🔍 OAuth code detected, exchanging for session...
✅ Session established successfully
```

**❌ Failure Case (What to Look For):**
```
🔍 Auth callback triggered, processing...
🔍 Full URL: https://azure-production.d1deo9tihdnt50.amplifyapp.com/auth/callback
🔍 Pathname: /auth/callback
🔍 Search params: (empty)
🔍 Hash: (empty)
❌ No authentication data found
```

---

## Step 3: Document What You See 📝

### Checklist:
- [ ] **Did you get redirected to `/auth/callback`?**
  - Yes → Continue to Step 4
  - No → Problem: Login redirect not working

- [ ] **What does the URL look like when you land on `/auth/callback`?**
  - Has `?code=...` → PKCE flow (Google OAuth)
  - Has `#access_token=...` → Implicit flow
  - Empty query/hash → Problem: No auth data received

- [ ] **What does the console show?**
  - Copy ALL console logs from login attempt to callback page
  - Look for errors (red text)
  - Look for warnings (yellow text)

- [ ] **What does the Network tab show?**
  - Filter by "Fetch/XHR"
  - Look for requests to:
    - `https://kbjulpxgjqzgbkshqsme.supabase.co/auth/v1/token`
    - `https://api.alie.app/api/profile`
  - Check response status codes (should be 200, not 401/403)

---

## Step 4: Verify Session Establishment 🎫

### If Login Appears Successful:

**Test 1: Check Session Exists**
```javascript
// In production console:
window.supabase.auth.getSession().then(({ data, error }) => {
  console.log('✅ Session check:', {
    hasSession: !!data?.session,
    hasError: !!error,
    userId: data?.session?.user?.id,
    email: data?.session?.user?.email,
    tokenLength: data?.session?.access_token?.length
  });
});
```

**Expected:**
- ✅ `hasSession: true`
- ✅ `tokenLength: 1100+ characters`

**Test 2: Verify Session Persists**
1. Refresh the page (F5)
2. Run the same session check again
3. Session should still exist

**Test 3: Check localStorage**
```javascript
// Check if session is stored
const supabaseKey = 'sb-kbjulpxgjqzgbkshqsme-auth-token';
const stored = localStorage.getItem(supabaseKey);
console.log('✅ Session in localStorage:', !!stored);
```

---

## Step 5: Test API Calls 🔌

### If Session Exists, Test API Endpoints:

**Test 1: Profile API**
```javascript
// In production console:
fetch('https://api.alie.app/api/profile', {
  headers: {
    'Authorization': 'Bearer ' + (await window.supabase.auth.getSession()).data.session.access_token
  }
})
.then(r => r.json())
.then(data => console.log('✅ Profile API:', data))
.catch(err => console.error('❌ Profile API Error:', err));
```

**Expected:** Profile data returned (not 401 Unauthorized)

**Test 2: Transcription API (if you have transcription feature)**
- Navigate to transcription page
- Trigger an API call (e.g., AI formatting)
- Check Network tab → Request Headers
- Should see: `Authorization: Bearer eyJ...`

**Expected:** API call succeeds with 200 OK

---

## Step 6: Troubleshooting Based on Results 🔧

### Issue A: Not Redirected to `/auth/callback`

**Symptoms:**
- Click login → Redirects somewhere else
- Or stays on login page
- Or redirects to wrong URL

**Possible Causes:**
1. Supabase redirect URL mismatch
2. OAuth provider configuration issue
3. Network/CORS blocking redirect

**Fix:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Verify redirect URLs include: `https://azure-production.d1deo9tihdnt50.amplifyapp.com/auth/callback`
3. Check OAuth provider (Google) configuration in Supabase

---

### Issue B: Redirected But No Auth Data in URL

**Symptoms:**
- URL: `/auth/callback` (no `?code=` or `#access_token=`)
- Console: "No authentication data found"

**Possible Causes:**
1. Supabase PKCE flow not configured correctly
2. OAuth provider not returning code
3. Network issue preventing code delivery

**Debug:**
1. Check Supabase Dashboard → Authentication → Providers → Google
2. Verify PKCE is enabled (or disabled based on your config)
3. Check Network tab for requests to Supabase auth endpoints
4. Look for errors in Network tab (red requests)

---

### Issue C: Code Received But Session Not Established

**Symptoms:**
- URL has `?code=abc123`
- Console shows: "OAuth code detected"
- But then: "Session not established after code exchange"

**Possible Causes:**
1. Code exchange failing
2. Supabase client not configured correctly
3. Network issue during code exchange

**Debug:**
1. Check console for specific error message
2. Check Network tab for POST to `/auth/v1/token`
3. Check response - should return session tokens

---

### Issue D: Session Established But Not Persisting

**Symptoms:**
- Login succeeds
- Session exists immediately after login
- But session disappears on page refresh

**Possible Causes:**
1. localStorage/sessionStorage blocked
2. Supabase client not configured with `persistSession: true`
3. Browser privacy settings

**Debug:**
1. Check `authClient.ts` - should have `persistSession: true`
2. Try different browser
3. Check browser console for storage errors

---

## Step 7: Report Results 📊

After testing, document:

1. **Login Method Used:** Google OAuth / Magic Link
2. **Redirect Success:** Yes / No
3. **URL on Callback Page:** Full URL including query/hash params
4. **Console Logs:** Copy all relevant logs
5. **Session Established:** Yes / No (if yes, test API calls)
6. **API Calls Working:** Yes / No
7. **Issues Found:** List any problems

---

## Next Steps Based on Results

### ✅ If Everything Works:
- Login → Session established → API calls work
- **Action:** Deploy to production, mark as fixed ✅

### ⚠️ If Login Still Doesn't Work:
- Share console logs and URL details
- We'll diagnose based on specific error
- May need to check Supabase configuration

### 🔧 If Session Established But API Calls Fail:
- Check if Step 1 & 2 fixes are deployed
- Verify backend CORS allows your origin
- Check backend auth middleware logs

---

## Quick Reference: Console Commands

**Check Session:**
```javascript
window.supabase.auth.getSession().then(({ data }) => console.log(data?.session ? '✅ Session exists' : '❌ No session'));
```

**Check URL:**
```javascript
console.log('URL:', window.location.href);
console.log('Hash:', window.location.hash);
console.log('Search:', window.location.search);
```

**Check Environment Variables:**
```javascript
console.log('VITE_SITE_URL:', import.meta.env.VITE_SITE_URL);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
```

**Clear Session (for testing):**
```javascript
window.supabase.auth.signOut();
localStorage.clear();
sessionStorage.clear();
```

---

**Last Updated:** After deployment of `hotfix/auth-issue`

