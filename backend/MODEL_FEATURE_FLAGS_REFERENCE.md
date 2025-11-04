# Model Feature Flags Reference

## Required Feature Flags for Model Selection

Add these to your `backend/.env` file to enable model selection features:

```env
# Model Selection Feature Flags
FEATURE_MODEL_SELECTION=true
FEATURE_MODEL_SELECTION_TRANSCRIPT_ANALYSIS=true

# Individual Model Feature Flags (if using future models)
FEATURE_GPT5=true              # For gpt-5, gpt-5-mini, gpt-5-turbo
FEATURE_GEMINI2=true           # For gemini-2-pro, gemini-2-ultra
FEATURE_CLAUDE4=true           # For claude-4-sonnet, claude-4-haiku, claude-4-opus
FEATURE_LLAMA=true             # For llama-3.1-70b, llama-3.1-8b
FEATURE_MISTRAL=true           # For mistral-large, mistral-medium
```

## Current Status

### ✅ Enabled Models (No feature flags needed, just `FEATURE_MODEL_SELECTION=true`):
- **OpenAI**: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- **Anthropic**: `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
- **Google**: `gemini-pro`, `gemini-ultra`, `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash-exp`, `gemini-2.5-flash`

### ⚠️ Feature-Flagged Models (Require additional flags):
- **gpt-5** models: Require `FEATURE_GPT5=true` + `FEATURE_MODEL_SELECTION=true`
- **gemini-2-pro** / **gemini-2-ultra**: Require `FEATURE_GEMINI2=true` + `FEATURE_MODEL_SELECTION=true`
- **claude-4** models: Require `FEATURE_CLAUDE4=true` + `FEATURE_MODEL_SELECTION=true`
- **llama** models: Require `FEATURE_LLAMA=true` + `FEATURE_MODEL_SELECTION=true`
- **mistral** models: Require `FEATURE_MISTRAL=true` + `FEATURE_MODEL_SELECTION=true`

## Important Notes

1. **gemini-2-pro** is mapped to `gemini-1.5-pro` as a fallback (check logs for `[PROOF]` warnings)
2. **gpt-5** may not exist yet - API will return error or fallback
3. Always check `[PROOF]` logs in backend console to verify actual models used

## Proof Logging

After setting flags, restart backend and check console for `[PROOF]` logs:
- `[PROOF] Section7RdService - Using model: <model>`
- `[PROOF] OpenAI/Google API Call - Model: <model>`
- `[PROOF] API Response - model: <actual-model-used>`

If you see warnings like `⚠️ MODEL FALLBACK` or `⚠️ MODEL MISMATCH`, the requested model wasn't used.

