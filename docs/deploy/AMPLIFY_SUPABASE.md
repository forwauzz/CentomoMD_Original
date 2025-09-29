# Amplify + Supabase Auth URLs (Prod + Dev)

## Supabase Dashboard Configuration

### Authentication → URL Configuration

**Site URL (prod):**
```
https://azure-production.d1deo9tihdnt50.amplifyapp.com
```

**Redirect URLs (add all):**
```
https://azure-production.d1deo9tihdnt50.amplifyapp.com
https://azure-production.d1deo9tihdnt50.amplifyapp.com/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
```

**Allowed origins (CORS):**
```
https://azure-production.d1deo9tihdnt50.amplifyapp.com
http://localhost:5173
```

## Frontend Environment Variables

### In Amplify Environment Variables:
Set these in AWS Amplify Console → App Settings → Environment Variables:

```
VITE_SITE_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
VITE_WS_URL=wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/ws
```

### In .env.local (dev):
```
VITE_SITE_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Code Implementation

The frontend uses `getAuthRedirectUrl()` function which automatically constructs:
```
{VITE_SITE_URL}/auth/callback
```

This ensures consistent redirect URLs across all Supabase auth operations:
- Email OTP sign-in
- OAuth (Google) sign-in  
- Password reset emails

## Manual Steps Required

1. **Supabase Dashboard**: Configure the URLs above in Authentication settings
2. **Amplify Console**: Set environment variables in App Settings
3. **Deploy**: Push to `azure-production` branch to trigger deployment

## Verification

After deployment, test:
- [ ] Email OTP sign-in redirects properly
- [ ] Google OAuth sign-in redirects properly  
- [ ] Password reset emails work
- [ ] No console errors about missing VITE_SITE_URL


