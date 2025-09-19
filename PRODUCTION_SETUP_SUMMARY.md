# 🚀 Production Setup Summary

## Current Architecture

```
User → Vercel Frontend → Cloudflare Tunnel → Local Backend
```

### **Frontend**
- **Deployed on**: Vercel
- **URL**: `https://centomo-md-original-kskp.vercel.app`
- **Environment**: Production

### **Backend**
- **Running on**: Your local laptop
- **Port**: 3001
- **Exposed via**: Cloudflare Tunnel

### **Cloudflare Tunnel**
- **Current URL**: `https://innovations-shares-correlation-surely.trycloudflare.com`
- **⚠️ Dynamic**: Changes every time you restart `cloudflared`

## 🔧 Configuration

### **Vercel Environment Variables**
Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://innovations-shares-correlation-surely.trycloudflare.com
VITE_SITE_URL=https://centomo-md-original-kskp.vercel.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Backend CORS Configuration**
✅ Already configured to allow:
- `https://centomo-md-original-kskp.vercel.app`
- `https://*.vercel.app` (for preview deployments)
- `https://innovations-shares-correlation-surely.trycloudflare.com`

## 🔄 Workflow

### **Normal Operation**
1. User visits Vercel app
2. Frontend makes API calls to Cloudflare tunnel
3. Tunnel forwards requests to your local backend
4. Backend processes and responds
5. Response flows back through tunnel to frontend

### **When Tunnel URL Changes**
1. Restart `cloudflared` → New tunnel URL generated
2. Update `VITE_API_BASE_URL` in Vercel with new URL
3. Redeploy Vercel (or wait for auto-deploy)
4. App works again

## 🧪 Testing

### **Health Check**
```
https://innovations-shares-correlation-surely.trycloudflare.com/health
```
Should return: `{"status":"ok"}`

### **Full Flow Test**
1. Visit: `https://centomo-md-original-kskp.vercel.app`
2. Try login/authentication
3. Check browser console for errors
4. Monitor backend logs for CORS and API requests

## ⚠️ Important Notes

### **Tunnel URL Management**
- **Current URL**: `https://innovations-shares-correlation-surely.trycloudflare.com`
- **Changes on**: Every `cloudflared` restart
- **Update needed**: Vercel environment variable + redeploy

### **Local Development**
- Still works with `localhost:3001`
- No changes needed for local development
- Environment variables fallback to localhost

### **Security**
- ✅ CORS properly configured
- ✅ No wildcard origins
- ✅ Credentials support enabled
- ✅ Security logging active

## 🎯 Next Steps

1. **Set Vercel environment variables** with current tunnel URL
2. **Redeploy Vercel** to apply changes
3. **Test authentication flow** from Vercel
4. **Monitor backend logs** for CORS and API activity

## 📋 Quick Reference

**Frontend**: `https://centomo-md-original-kskp.vercel.app`
**Backend**: `https://innovations-shares-correlation-surely.trycloudflare.com`
**Local**: `http://localhost:3001` (unchanged)

This setup allows testers to use your app from anywhere while keeping the backend on your local machine! 🚀
