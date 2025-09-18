# Vercel Authentication Setup Guide

## Overview
This guide will help you configure authentication for your CentomoMD application deployed on Vercel.

## Current Status
- ✅ Frontend deployed to: https://centomo-md-original-kskp.vercel.app
- ✅ Authentication system using Supabase (magic links + Google OAuth)
- ⚠️ Need to configure production environment variables and callback URLs

## Step 1: Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

```
VITE_SITE_URL=https://centomo-md-original-kskp.vercel.app
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

**Important:** Replace the placeholder values with your actual Supabase credentials from your Supabase project dashboard.

## Step 2: Supabase Configuration

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Update these settings:

### Site URL:
```
https://centomo-md-original-kskp.vercel.app
```

### Redirect URLs (add both):
```
https://centomo-md-original-kskp.vercel.app/auth/callback
http://localhost:5173/auth/callback
```

## Step 3: Google OAuth Configuration (if using Google login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
```
https://centomo-md-original-kskp.vercel.app/auth/callback
http://localhost:5173/auth/callback
```

## Step 4: Backend Deployment (Required for full functionality)

Your backend needs to be deployed and accessible from Vercel. Options:

### Option A: Deploy to Railway
1. Connect your GitHub repo to Railway
2. Deploy the backend folder
3. Get the Railway URL
4. Update Vercel environment variables with `VITE_API_URL=your_railway_url`

### Option B: Deploy to Render
1. Connect your GitHub repo to Render
2. Deploy the backend folder
3. Get the Render URL
4. Update Vercel environment variables with `VITE_API_URL=your_render_url`

### Option C: Use Vercel Functions
1. Move backend API routes to Vercel Functions
2. Update frontend to use relative API paths

## Step 5: Test Authentication Flow

After completing the above steps:

1. **Redeploy your Vercel app** (environment variables require a new deployment)
2. **Test the login flow**:
   - Go to https://centomo-md-original-kskp.vercel.app/login
   - Try magic link authentication
   - Try Google OAuth (if configured)
   - Verify redirect to dashboard works

## Troubleshooting

### Common Issues:

1. **"Supabase not configured" error**
   - Check that environment variables are set in Vercel
   - Redeploy after adding environment variables

2. **Redirect loop or callback errors**
   - Verify Supabase redirect URLs are correctly configured
   - Check that VITE_SITE_URL matches your Vercel domain

3. **Backend API errors**
   - Ensure backend is deployed and accessible
   - Check CORS configuration allows your Vercel domain
   - Verify API endpoints are working

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables in Vercel dashboard
3. Test Supabase connection in browser console: `window.supabase`
4. Check network tab for failed API calls

## Next Steps

1. Complete the environment variable setup
2. Update Supabase configuration
3. Deploy your backend
4. Test the complete authentication flow
5. Update any hardcoded localhost URLs in your code

## Security Notes

- Never commit actual environment variables to your repository
- Use Vercel's environment variable system for production secrets
- Ensure your Supabase project has proper RLS policies configured
- Consider implementing additional security measures for production
