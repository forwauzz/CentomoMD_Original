# EC2 Production Deployment Guide - Feature Flags

**Date:** 2024-12-27  
**Environment:** EC2 Backend + AWS Amplify Frontend

---

## 📋 Architecture Overview

### Current Setup
- **Backend:** EC2 instance (running Node.js backend)
- **Frontend:** AWS Amplify (static build from Vite)
- **DNS/Proxy:** Cloudflare (optional)

### How Environment Variables Work

**Backend (EC2):**
- Uses `.env` file on EC2 instance
- Read at runtime via `process.env`
- Changes require backend restart

**Frontend (Amplify):**
- Environment variables set in **Amplify Console** (AWS Dashboard)
- Embedded into build at **build time** by Vite
- Changes require **rebuild and redeploy**

---

## 🔧 EC2 Backend Configuration

### File Location
- **Path:** `/home/ubuntu/scribe/.env` (or wherever your backend code is)
- **OR:** Set as environment variables in systemd/service file

### Feature Flags to Enable

**Minimum for Model Selection:**
```bash
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
```

**Full Configuration:**
```bash
# Model Selection Feature Flags
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false  # Keep OFF unless ready
FEATURE_MODEL_SELECTION_DICTATION=false  # Keep OFF unless ready

# Enhanced Transcript Analysis
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false  # Keep OFF unless ready

# Layer Processing (for future)
FEATURE_LAYER_PROCESSING=false  # Keep OFF unless ready

# Model Version Flags (for future models)
FEATURE_GPT5=false
FEATURE_CLAUDE4=false
FEATURE_GEMINI2=false
FEATURE_LLAMA=false
FEATURE_MISTRAL=false

# Experiment Allowlist
# Empty = allow all users (for production)
EXPERIMENT_ALLOWLIST=
# OR restrict to specific emails:
# EXPERIMENT_ALLOWLIST=admin@example.com,user@example.com

# Cost Controls
MAX_COST_PER_RUN=0.50

# Default Model Configuration
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_PROVIDER=openai
```

### How to Update on EC2

**Option 1: Edit .env file directly**
```bash
# SSH into EC2
ssh ubuntu@your-ec2-instance

# Navigate to backend directory
cd /path/to/scribe

# Edit .env file
nano .env
# OR
vim .env

# Add the flags above

# Restart backend service
sudo systemctl restart your-backend-service
# OR if using PM2:
pm2 restart backend
```

**Option 2: Set as environment variables (if using systemd)**
```bash
# Edit systemd service file
sudo nano /etc/systemd/system/your-backend.service

# Add under [Service]:
Environment="FEATURE_MODEL_SELECTION=true"
Environment="FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true"
Environment="FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart your-backend-service
```

---

## 🔧 AWS Amplify Frontend Configuration

### Where to Set Variables

**AWS Amplify Console → App Settings → Environment Variables**

1. Go to: https://console.aws.amazon.com/amplify
2. Select your app
3. Go to **App Settings** → **Environment Variables**
4. Add/Edit variables

### Feature Flags to Enable

**Minimum for Model Selection:**
```bash
VITE_FEATURE_MODEL_SELECTION=true
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
```

**Full Configuration:**
```bash
# Model Selection Feature Flags
VITE_FEATURE_MODEL_SELECTION=true
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
VITE_FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false
```

### Important Notes

⚠️ **Critical:** Frontend variables **MUST** have `VITE_` prefix!

⚠️ **After Setting Variables:**
- Amplify will **automatically trigger a rebuild** when you save
- Or manually trigger: **App Settings** → **Redeploy this version**

⚠️ **Build Time:** Variables are embedded at **build time**, not runtime
- Changes require a **new build/deploy**
- Old builds will have old variables

---

## ✅ Recommended Production Flags

### ✅ Enable These (Safe for Production)

**Backend:**
```bash
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
EXPERIMENT_ALLOWLIST=  # Empty = allow all users
```

**Frontend (Amplify):**
```bash
VITE_FEATURE_MODEL_SELECTION=true
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
```

### ❌ Keep OFF (Not Ready Yet)

**Backend:**
```bash
FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
FEATURE_MODEL_SELECTION_DICTATION=false
FEATURE_LAYER_PROCESSING=false
FEATURE_GPT5=false
FEATURE_CLAUDE4=false
FEATURE_GEMINI2=false
FEATURE_LLAMA=false
FEATURE_MISTRAL=false
```

**Frontend (Amplify):**
```bash
VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
VITE_FEATURE_MODEL_SELECTION_DICTATION=false
VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false
```

---

## 🔄 Deployment Workflow

### Step 1: Update Backend (EC2)

```bash
# SSH into EC2
ssh ubuntu@your-ec2-instance

# Edit .env file
nano /path/to/scribe/.env

# Add feature flags:
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true

# Restart backend
sudo systemctl restart your-backend-service
# OR
pm2 restart backend
```

### Step 2: Update Frontend (Amplify Console)

1. Go to **AWS Amplify Console**
2. Select your app
3. **App Settings** → **Environment Variables**
4. Add/Edit:
   - `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
   - `VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true`
5. Save (triggers automatic rebuild)
6. Wait for build to complete (~5-10 minutes)

### Step 3: Verify

1. Visit your Amplify app URL
2. Navigate to `/transcript-analysis` page
3. Click "Process Single Template" tab
4. **ModelSelector should be visible** ✅

---

## 🧪 Verification Steps

### Check Backend Flags

**SSH into EC2:**
```bash
# Check if flags are loaded
grep FEATURE_MODEL_SELECTION /path/to/scribe/.env

# Check backend logs
sudo journalctl -u your-backend-service -f
# OR
pm2 logs backend
```

**Or check via API (if debug endpoint exists):**
```bash
curl https://api.alie.app/api/_debug/flags
```

### Check Frontend Flags

**In Browser Console:**
```javascript
// Check if flags are embedded in build
console.log(import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS)
// Should output: "true"

// Check all model selection flags
console.log({
  modelSelection: import.meta.env.VITE_FEATURE_MODEL_SELECTION,
  transcriptAnalysis: import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS,
  enhanced: import.meta.env.VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS
})
```

---

## 📝 Summary

### For EC2 Backend:

**Edit:** `.env` file on EC2 instance

**Enable:**
- ✅ `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
- ✅ `FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true`

**Then:** Restart backend service

---

### For AWS Amplify Frontend:

**Edit:** Amplify Console → App Settings → Environment Variables

**Enable:**
- ✅ `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
- ✅ `VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true`

**Then:** Wait for automatic rebuild (or trigger manually)

---

## ⚠️ Important Notes

1. **Backend and Frontend flags must match:**
   - Backend: `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
   - Frontend: `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`

2. **Frontend requires rebuild:**
   - Variables are embedded at build time
   - Changes won't take effect until next deploy

3. **Allowlist in Production:**
   - `EXPERIMENT_ALLOWLIST=` (empty) = allow all users
   - `EXPERIMENT_ALLOWLIST=email1,email2` = restrict to specific users

4. **Rollback:**
   - Set flags to `false` in both places
   - Restart backend + rebuild frontend
   - No code changes needed ✅

---

**Status:** ✅ Ready for Production Deployment

