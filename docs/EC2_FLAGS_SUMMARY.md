# EC2 Production Feature Flags - Quick Reference

**Environment:** EC2 Backend + AWS Amplify Frontend

---

## ✅ What to Enable (Production Ready)

### Backend (EC2 `.env` file)

```bash
# Core Model Selection (Enable These)
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true

# Allowlist (Empty = Allow All Users)
EXPERIMENT_ALLOWLIST=

# Cost Control
MAX_COST_PER_RUN=0.50

# Default Model
DEFAULT_AI_MODEL=gpt-4o-mini
DEFAULT_AI_PROVIDER=openai
```

### Frontend (AWS Amplify Console)

Go to: **AWS Amplify Console** → **App Settings** → **Environment Variables**

```bash
# Core Model Selection (Enable These)
VITE_FEATURE_MODEL_SELECTION=true
VITE_FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true
VITE_FEATURE_ENHANCED_TRANSCRIPT_ANALYSIS=true
```

---

## ❌ Keep OFF (Not Ready Yet)

**Backend:**
- `FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false`
- `FEATURE_MODEL_SELECTION_DICTATION=false`
- `FEATURE_LAYER_PROCESSING=false`
- All model version flags (GPT-5, Claude 4, etc.) = `false`

**Frontend:**
- `VITE_FEATURE_MODEL_SELECTION_TEMPLATE_COMBINATIONS=false`
- `VITE_FEATURE_MODEL_SELECTION_DICTATION=false`
- `VITE_FEATURE_TEMPLATE_COMBINATIONS_IN_ANALYSIS=false`

---

## 🔄 Quick Deployment Steps

### 1. EC2 Backend
```bash
# SSH into EC2
ssh ubuntu@your-ec2-instance

# Edit .env
nano /path/to/scribe/.env

# Add the flags above

# Restart
sudo systemctl restart your-backend-service
```

### 2. AWS Amplify Frontend
1. Go to AWS Amplify Console
2. App Settings → Environment Variables
3. Add the `VITE_*` flags above
4. Save (triggers rebuild automatically)

### 3. Verify
- Visit your Amplify app
- Go to `/transcript-analysis` page
- ModelSelector should be visible ✅

---

**That's it!** Only enable the 3 flags above for production.

