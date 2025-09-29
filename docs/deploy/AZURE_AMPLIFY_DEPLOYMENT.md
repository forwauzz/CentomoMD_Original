# Azure App Service + AWS Amplify Deployment Guide

This document outlines the deployment configuration for the CentomoMD application with backend on Azure App Service and frontend on AWS Amplify.

## Architecture

- **Backend (API)**: Azure App Service - https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
- **Frontend (UI)**: AWS Amplify - https://azure-production.d1deo9tihdnt50.amplifyapp.com

## Environment Variables

### Azure App Service (Configuration > Application settings)

```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
FRONTEND_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com
CORS_ALLOWED_ORIGINS=https://azure-production.d1deo9tihdnt50.amplifyapp.com
USE_WSS=true
PUBLIC_WS_URL=wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
# Add your existing keys (Supabase, AWS, etc.)
```

### AWS Amplify (App settings > Environment variables)

```bash
VITE_API_BASE_URL=https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
VITE_WS_URL=wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/ws
VITE_SITE_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Production Environment Files

### Backend Production Environment
Create `backend/.env.production` with production-specific values:
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
FRONTEND_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com
CORS_ALLOWED_ORIGINS=https://azure-production.d1deo9tihdnt50.amplifyapp.com
USE_WSS=true
PUBLIC_WS_URL=wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
# Add all other production environment variables
```

### Frontend Production Environment
Create `frontend/.env.production` with production-specific values:
```bash
VITE_API_BASE_URL=https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net
VITE_WS_URL=wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/ws
VITE_SITE_URL=https://azure-production.d1deo9tihdnt50.amplifyapp.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Azure Configuration

### Web Sockets
Azure Portal → App Service → Configuration → General settings → Web sockets = On → Save → Restart

### Health Check
Azure Portal → App Service → Health check:
- Path: `/healthz`
- Save

### CORS
The application uses app-level CORS configuration. If you also use the Azure CORS blade, list the same origin:
```
https://azure-production.d1deo9tihdnt50.amplifyapp.com
```

## Local Development

For local development, create a `.env.development` file in the frontend directory:

```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

## Acceptance Tests

After deployment, verify the following:

1. **Health Check**: Visit https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/healthz
   - Should return "ok"

2. **CORS Test**: From browser console on the Amplify site:
   ```javascript
   fetch('https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/healthz')
     .then(r => r.text())
     .then(console.log)
   ```
   - Should return "ok" without CORS errors

3. **WebSocket Connection**: Confirm WS connects from the Amplify app to:
   ```
   wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/ws
   ```
   - No mixed-content or CORS errors

## Key Features

- ✅ HTTPS and WSS in production, localhost in development
- ✅ Stable WebSocket path `/ws`
- ✅ Backend binds to `process.env.PORT` and `0.0.0.0`
- ✅ CORS configured for Amplify domain
- ✅ Health check route `/healthz`
- ✅ TypeScript builds on Azure with correct start/postinstall scripts
- ✅ Environment variable usage for both sides
