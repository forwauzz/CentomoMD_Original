# 🔍 Production Session Diagnosis

## Problem
- **Dev:** ✅ Session found, token exists (1109 chars)
- **Prod:** ❌ Session NOT found, timeout warning
- **Warning:** `⚠️ Session loading timeout - forcing loading to false`

---

## Diagnosis Steps

### Step 1: Check if Login Actually Completed

**In production console, check:**

1. **Did you complete the login flow?**
   ```javascript
   // Check if you're on the callback page
   window.location.pathname
   // Should be: "/auth/callback"
   
   // Check URL for auth tokens
   window.location.hash
   // Should contain: "#access_token=...&refresh_token=..."
   ```

2. **Check if session was ever created:**
   ```javascript
   // Check localStorage for Supabase session
   Object.keys(localStorage).filter(k => k.includes('supabase'))
   // Should show: ["sb-kbjulpxgjqzgbkshqsme-auth-token"]
   
   // Check sessionStorage
   Object.keys(sessionStorage).filter(k => k.includes('supabase'))
   ```

3. **Check Supabase client initialization:**
   ```javascript
   // Is Supabase configured?
   console.log('Supabase URL:', window.supabase.supabaseUrl);
   console.log('Supabase Key:', window.supabase.supabaseKey?.substring(0, 20) + '...');
   
   // Should show:
   // Supabase URL: https://kbjulpxgjqzgbkshqsme.supabase.co
   // Supabase Key: eyJhbGciOiJIUzI1NiI...
   ```

---

### Step 2: Check What Happens During Login

**In production console, watch for these logs:**

1. Navigate to login page
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Watch console for:
   ```
   🔍 Auth callback triggered, processing...
   🔍 Hash fragment: present (or missing)
   🔍 Auth params: { hasAccessToken: true, hasRefreshToken: true }
   ✅ Session established successfully
   ```

**If you don't see these, the login flow didn't complete.**

---

### Step 3: Check for CORS/Network Issues

**In Network tab:**

1. Look for requests to Supabase:
   - `https://kbjulpxgjqzgbkshqsme.supabase.co/auth/v1/token`
   - `https://kbjulpxgjqzgbkshqsme.supabase.co/auth/v1/user`

2. Check for:
   - ❌ CORS errors (red)
   - ❌ 401/403 errors
   - ❌ Network failures

---

### Step 4: Check Session Storage

**Supabase stores sessions in localStorage. Check:**

```javascript
// In production console:
const supabaseKey = 'sb-kbjulpxgjqzgbkshqsme-auth-token';
const stored = localStorage.getItem(supabaseKey);
if (stored) {
  console.log('✅ Session stored in localStorage');
  const parsed = JSON.parse(stored);
  console.log('Token exists:', !!parsed?.access_token);
  console.log('Token expires:', new Date(parsed?.expires_at * 1000));
} else {
  console.log('❌ No session in localStorage');
}
```

---

### Step 5: Test Manual Session Retrieval

**In production console:**

```javascript
// Try to get session directly (bypassing hooks)
window.supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error getting session:', error);
    } else if (data?.session) {
      console.log('✅ Session found:', {
        userId: data.session.user.id,
        email: data.session.user.email,
        expiresAt: new Date(data.session.expires_at * 1000),
        tokenLength: data.session.access_token.length
      });
    } else {
      console.log('❌ No session found');
      
      // Check if session exists in storage but not loaded
      const supabaseKey = 'sb-kbjulpxgjqzgbkshqsme-auth-token';
      const stored = localStorage.getItem(supabaseKey);
      if (stored) {
        console.log('⚠️ Session exists in localStorage but not loaded by Supabase');
        console.log('This suggests a Supabase client configuration issue');
      }
    }
  });
```

---

## Common Issues & Fixes

### Issue 1: Session Not Persisting

**Symptoms:**
- Login completes successfully
- Session appears during login
- Session disappears on page refresh

**Possible Causes:**
- Cookie/Storage blocked by browser
- Incognito/Private mode
- Browser security settings

**Fix:**
- Use regular browsing mode (not incognito)
- Check browser privacy settings
- Try different browser

---

### Issue 2: Session Loading Timeout

**Symptoms:**
- `⚠️ Session loading timeout` warning
- Session not found even though it exists

**Possible Causes:**
- Network latency (timeout too short)
- Supabase client not initializing
- Environment variables missing

**Fix (Temporary - increase timeout):**
```typescript
// frontend/src/lib/authClient.ts:186
}, 10000); // Change from 5000 to 10000 (10 seconds)
```

**But first:** Check if Supabase client is initialized correctly.

---

### Issue 3: Environment Variables Not Loaded

**Symptoms:**
- No session
- Console errors about missing env vars

**Check:**
```javascript
// In production console:
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

// Should show:
// VITE_SUPABASE_URL: https://kbjulpxgjqzgbkshqsme.supabase.co
// VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiI...
```

**If empty:** Environment variables not loaded in production build.

---

### Issue 4: Login Flow Not Completing

**Symptoms:**
- Click login → redirects to Google
- Google auth succeeds
- Never redirects back to `/auth/callback`

**Possible Causes:**
- Redirect URL not configured in Supabase
- OAuth redirect URL mismatch

**Check Supabase Dashboard:**
- Settings → Authentication → URL Configuration
- Redirect URLs must include:
  - `https://azure-production.d1deo9tihdnt50.amplifyapp.com/auth/callback`

---

## Quick Test: Force Re-login

**If session is broken, try this:**

1. **Clear all Supabase storage:**
   ```javascript
   // In production console:
   Object.keys(localStorage).forEach(k => {
     if (k.includes('supabase')) localStorage.removeItem(k);
   });
   Object.keys(sessionStorage).forEach(k => {
     if (k.includes('supabase')) sessionStorage.removeItem(k);
   });
   ```

2. **Log out explicitly:**
   ```javascript
   window.supabase.auth.signOut();
   ```

3. **Clear cookies for the domain**

4. **Try login again from scratch**

---

## Next Steps

1. Run the diagnostic steps above
2. Share the results
3. Based on findings, we'll fix the specific issue

**Most likely causes:**
1. Login flow not completing (redirect issue)
2. Session not persisting (storage issue)
3. Environment variables not loaded (build issue)

