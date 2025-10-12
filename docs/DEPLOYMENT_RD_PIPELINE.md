# Section 7 R&D Pipeline - Deployment Guide

## Overview
The Section 7 R&D Pipeline includes specialized artifacts that require additional setup for production deployment.

## Required Dependencies

### 1. Python Environment (EC2 Backend)
```bash
# Install Python 3.8+ and pip
sudo apt update
sudo apt install python3 python3-pip

# Install required Python packages
pip3 install openai
```

### 2. Environment Variables (EC2 Backend)
```bash
# Required environment variables
export OPENAI_API_KEY="your_openai_api_key_here"
export NODE_ENV="production"
```

### 3. File Permissions (EC2 Backend)
```bash
# Make Python scripts executable
chmod +x /path/to/your/app/eval/evaluator_section7.py
chmod +x /path/to/your/app/scripts/run_manager_review.py
```

## Deployment Checklist

### ✅ Amplify (Frontend)
- [ ] R&D template configuration is included in build
- [ ] Frontend can call backend API endpoints
- [ ] Template dropdown includes "Section 7 - R&D Pipeline"

### ✅ EC2 (Backend)
- [ ] All R&D artifacts are deployed to server
- [ ] Python 3.8+ is installed
- [ ] OpenAI Python package is installed
- [ ] Environment variables are configured
- [ ] Python scripts have execute permissions
- [ ] Backend can access artifact files

## File Structure on Production Server
```
/your-app/
├── backend/
│   ├── dist/
│   └── src/
├── configs/
│   └── master_prompt_section7.json
├── prompts/
│   ├── plan_section7_fr.xml
│   ├── manager_eval_section7_fr.xml
│   ├── manager_section7_fr.md
│   └── checklist_manager_section7.json
├── system/
│   └── system_section7_fr-ca.md
├── training/
│   └── golden_cases_section7.jsonl
├── eval/
│   ├── evaluator_section7.py
│   └── validation_manifest.jsonl
└── scripts/
    └── run_manager_review.py
```

## Testing in Production

### 1. Verify Artifacts
```bash
# Check if all files exist
ls -la configs/master_prompt_section7.json
ls -la prompts/plan_section7_fr.xml
ls -la eval/evaluator_section7.py
```

### 2. Test Python Scripts
```bash
# Test evaluation script
python3 eval/evaluator_section7.py

# Test manager review script
python3 scripts/run_manager_review.py
```

### 3. Test API Endpoint
```bash
# Test the R&D template via API
curl -X POST http://your-backend-url/api/process \
  -H "Content-Type: application/json" \
  -d '{"templateId": "section7-rd", "content": "test content"}'
```

## Troubleshooting

### Common Issues

1. **"Python not found"**
   - Install Python 3.8+ on EC2
   - Ensure python3 is in PATH

2. **"Module not found: openai"**
   - Install OpenAI package: `pip3 install openai`

3. **"Permission denied"**
   - Make scripts executable: `chmod +x eval/evaluator_section7.py`

4. **"File not found"**
   - Verify all artifacts are deployed
   - Check file paths in backend service

## Performance Considerations

- **Processing Time:** R&D Pipeline takes ~30 seconds (vs ~5 seconds for basic)
- **API Timeout:** Ensure backend timeout is set to 60+ seconds
- **Resource Usage:** Python scripts use additional CPU/memory

## Security Notes

- OpenAI API key must be kept secure
- Python scripts should run with limited permissions
- Consider rate limiting for R&D template usage
