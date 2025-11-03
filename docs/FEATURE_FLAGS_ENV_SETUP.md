# Feature Flags Environment Setup Guide

**Date:** 2024-12-27  
**Branch:** `feat/transcript-analysis-section7-improv`

---

## 📁 Environment Files to Modify

You need to modify **TWO** environment files:

1. **Backend `.env` file** (root directory or `backend/` directory)
2. **Frontend `.env` file** (`frontend/` directory)

---

## 🔧 Backend Environment File

### Location
- **File:** `.env` in the **root directory** OR `backend/.env`
- **Path:** `C:\Users\alici\Desktop\DEV CENTOMO\scribe\.env` OR `backend\.env`

### Variables to Add/Modify

```bash
# Model Selection Feature Flags
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false

# Layer Processing
FEATURE_LAYER_PROCESSING=false

# Model Version Feature Flags (Optional)
FEATURE_GPT5=false
FEATURE_CLAUDE4=false
FEATURE_GEMINI2=false
FEATURE_LLAMA=false
FEATURE_MISTRAL=false

# Experiment Allowlist (comma-separated emails)
# Leave empty to allow all users, or add specific emails
EXPERIMENT_ALLOWLIST=
# Example: EXPERIMENT_ALLOWLIST=test@example.com,admin@example.com

# Cost Controls
MAX_COST_PER_RUN=0.50

# Default Model Configuration
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_PROVIDER=openai
```

---

## 🔧 Frontend Environment File

### Location
- **File:** `.env` in the **`frontend/` directory**
- **Path:** `C:\Users\alici\Desktop\DEV CENTOMO\scribe\frontend\.env`

### Variables to Add/Modify

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

**⚠️ Important:** Frontend variables **MUST** have the `VITE_` prefix!

---

## 📝 Quick Setup Steps

### Step 1: Check if `.env` files exist

```powershell
# Check backend .env file
Test-Path .env
# OR
Test-Path backend\.env

# Check frontend .env file
Test-Path frontend\.env
```

### Step 2: Create `.env` files if they don't exist

**If `.env` files don't exist:**

```powershell
# Copy from env.example (backend)
Copy-Item env.example .env
# OR
Copy-Item env.example backend\.env

# Copy from env.template (frontend)
Copy-Item frontend\env.template frontend\.env
```

### Step 3: Add/Modify feature flags

**Backend `.env` file:**
```bash
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
```

**Frontend `.env` file:**
```bash
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
```

### Step 4: Restart servers

**After modifying `.env` files, restart both servers:**

```powershell
# Stop current servers (Ctrl+C)

# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

---

## ✅ Verification

### Check Backend Flags

```powershell
# Check if backend reads the flag correctly
# Look at backend console logs on startup
# Should show feature flags status
```

### Check Frontend Flags

**In browser DevTools Console:**
```javascript
// Check if frontend reads the flag correctly
console.log(import.meta.env.VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS)
// Should output: "true"
```

**OR**

**In browser DevTools Network tab:**
- Navigate to `/transcript-analysis` page
- Look for ModelSelector component
- Should be visible if flag is `true`

---

## 🎯 Minimum Required Flags

**To enable Model Selection in Transcript Analysis:**

### Backend `.env`:
```bash
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
```

### Frontend `.env`:
```bash
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
```

**That's it!** These two flags are the minimum to enable model selection.

---

## 📋 Complete Example

### Backend `.env` (root directory)

```bash
# ... other existing variables ...

# Model Selection Feature Flags
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false

# Experiment Allowlist (empty = allow all)
EXPERIMENT_ALLOWLIST=

# Default Model
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_PROVIDER=openai
```

### Frontend `.env` (frontend directory)

```bash
# ... other existing variables ...

# Model Selection Feature Flags
VITE_FEATURE_MODEL_SELECTION=true
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false
VITE_FEATURE_MODEL_SELECTION_DICTATION=false

# Enhanced Transcript Analysis
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false
```

---

## 🔍 Troubleshooting

### Problem: ModelSelector not showing

**Solution:**
1. Check frontend `.env` file has `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
2. Restart frontend dev server
3. Clear browser cache (Ctrl+Shift+R)

### Problem: Backend returns 403 for `/api/models/available`

**Solution:**
1. Check backend `.env` file has `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
2. Restart backend dev server
3. Check backend console logs for flag status

### Problem: Allowlist error in frontend

**Solution:**
1. Add your email to `EXPERIMENT_ALLOWLIST` in backend `.env`:
   ```bash
   EXPERIMENT_ALLOWLIST=your-email@example.com
   ```
2. OR leave it empty to allow all users:
   ```bash
   EXPERIMENT_ALLOWLIST=
   ```
3. Restart backend server

---

## 📝 Summary

**Two files to modify:**
1. **Backend:** `.env` (root) OR `backend/.env` - Variables **without** `VITE_` prefix
2. **Frontend:** `frontend/.env` - Variables **with** `VITE_` prefix

**Minimum flags:**
- Backend: `FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`
- Frontend: `VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true`

**Restart both servers after changes!**

