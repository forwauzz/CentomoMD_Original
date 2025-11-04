# How to Get Token for Testing

**Quick Guide:** Get JWT token from browser to test API endpoints

---

## Method 1: Browser DevTools (Easiest)

1. **Open your app in browser** (logged in)
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Go to Application tab** (Chrome/Edge) or **Storage tab** (Firefox)
4. **Expand Local Storage** → Click your domain (e.g., `localhost:5173`)
5. **Look for:** `sb-<project-id>-auth-token` or similar
6. **Copy the `access_token` value** from the JSON

**Or:**
1. **Open Console tab** in DevTools
2. **Run this:**
```javascript
// Get token from Supabase
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Token:', session?.access_token);
```

---

## Method 2: Network Tab

1. **Open DevTools** → **Network tab**
2. **Filter:** `XHR` or `Fetch`
3. **Make any API request** (e.g., go to Settings page)
4. **Click on a request**
5. **Headers tab** → **Request Headers** → Look for `Authorization: Bearer <token>`

---

## Method 3: Programmatic (Browser Console)

```javascript
// Get current session token
(async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (session?.access_token) {
    console.log('✅ Token:', session.access_token);
    // Copy to clipboard
    navigator.clipboard.writeText(session.access_token).then(() => {
      console.log('📋 Token copied to clipboard!');
    });
  } else {
    console.log('❌ No active session');
  }
})();
```

---

## Use Token for Testing

### **PowerShell (Windows):**
```powershell
.\backend\scripts\test-feedback-endpoint.ps1 "YOUR_TOKEN_HERE"
```

### **Bash (Linux/Mac):**
```bash
chmod +x backend/scripts/test-feedback-endpoint.sh
./backend/scripts/test-feedback-endpoint.sh YOUR_TOKEN_HERE
```

### **Manual curl:**
```bash
curl -X GET "http://localhost:3000/api/templates/prompts/due" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

**Ready to test!** 🚀

