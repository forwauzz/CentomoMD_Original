# Word-for-Word Template Implementation Troubleshooting Report

## Problem Description

The "Word-for-Word (with AI)" template is not functioning correctly. When applied to transcripts, it shows no evidence of formatting - speaker prefixes remain, spoken commands are not converted to formatting, and there's no indication that AI processing is occurring.

**Example Input:**
```
Pt: The worker reports neck pain following a rare and collision on February 14, 2024, difficulty sleeping, comma, and intermittent headaches. New line. He states Pt: quote Pt: The pain shoots to the right shoulder.

Pt: close quote Pt: especially when lifting boxes.

Pt: New line Pt: C 5 Pt: C6 mar stiffness reported, period.
```

**Expected Output:**
```
The worker reports neck pain following a rare and collision on February 14, 2024, difficulty sleeping, and intermittent headaches.

He states "The pain shoots to the right shoulder."

"especially when lifting boxes.

C 5 C6 mar stiffness reported.
```

**Actual Output:** No formatting applied - raw transcript remains unchanged.

## Current Architecture (High-Level)

### 1. Template Configuration System
- **Frontend Config**: `frontend/src/config/template-config.ts`
- **Backend Config**: `backend/src/config/templates.ts`
- **Template Registry**: Centralized template definitions with features, compatibility, and processing logic

### 2. Processing Pipeline
```
Raw Transcript → Template Selection → ProcessingOrchestrator → Deterministic Formatter → AI Formatter → Final Output
```

### 3. Key Components
- **ProcessingOrchestrator**: `backend/src/services/processing/ProcessingOrchestrator.ts`
- **Word-for-Word Formatter**: `backend/src/utils/wordForWordFormatter.ts`
- **AI Formatting**: Custom OpenAI integration with specialized prompts
- **Frontend Integration**: `frontend/src/components/transcription/TranscriptionInterface.tsx`

## Word-for-Word Template (Basic) - How It Works

### Configuration
```typescript
// frontend/src/config/template-config.ts
{
  id: 'word-for-word-formatter',
  name: 'Word-for-Word Formatter',
  type: 'formatter',
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: true,
    aiFormatting: false,
    postProcessing: true,
  }
}
```

### Processing Pipeline
1. **Template Selection**: User selects template in UI
2. **Frontend Detection**: `TranscriptionInterface.tsx` detects template ID
3. **Deterministic Processing**: Calls `formatWordForWordText()` directly
4. **Output**: Formatted transcript with speaker prefixes removed and spoken commands converted

### Code Flow
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
if (template.id === 'word-for-word-formatter') {
  const { formatWordForWordText } = await import('../../utils/wordForWordFormatter');
  const formattedTranscript = formatWordForWordText(rawTranscript);
  setEditedTranscript(formattedTranscript);
}
```

### Deterministic Formatter Logic
```typescript
// backend/src/utils/wordForWordFormatter.ts
export function formatWordForWordText(rawText: string, cfg: WordForWordConfig = DEFAULT_CONFIG): string {
  let t = rawText ?? "";

  // 1) Strip speaker prefixes (Pt:, Dr:, etc.)
  if (cfg.removeSpeakerPrefixes) {
    t = t.replace(/(?:^|\s)(?:pt|dr|dre|pat|patient|md)\s*:\s*/gim, " ");
    t = t.replace(/^(?:pt|dr|dre|pat|patient|md)\s*:\s*/gim, "");
  }

  // 2) Convert spoken commands (EN/FR)
  if (cfg.convertSpokenCommands) {
    t = convertSpokenCommands(t);
  }

  // 3) Clean spacing and capitalization
  if (cfg.cleanSpacing) {
    t = cleanSpacing(t);
  }

  return t.trim();
}
```

### Spoken Command Conversion
```typescript
const replacements: Array<[RegExp, string]> = [
  // Paragraphs & lines
  [/\b(?:new\s*paragraph|paragraph\s*break|new\s*para)\b/gi, "\n\n"],
  [/\b(?:new\s*line|newline|line\s*break)\b/gi, "\n"],
  
  // Punctuation
  [/\b(?:period|full\s*stop|fullstop)\b/gi, "."],
  [/\bcomma\b/gi, ","],
  [/\bcolon\b/gi, ":"],
  [/\b(?:semi\s*colon|semicolon)\b/gi, ";"],
  
  // Quotes & parens
  [/\b(?:open\s*parenthesis|open\s*paren)\b/gi, "("],
  [/\b(?:close\s*parenthesis|close\s*paren)\b/gi, ")"],
  [/\b(?:open\s*quotes?|open\s*quotation\s*marks|quote)\b/gi, "\""],
  [/\b(?:close\s*quotes?|close\s*quotation\s*marks|close\s*quote)\b/gi, "\""],
];
```

## Word-for-Word (with AI) Template - How It Should Work

### Configuration
```typescript
// frontend/src/config/template-config.ts
{
  id: 'word-for-word-with-ai',
  name: 'Word-for-Word (with AI)',
  type: 'ai-formatter',
  features: {
    verbatimSupport: false,
    voiceCommandsSupport: true,
    aiFormatting: true,
    postProcessing: true,
  },
  config: {
    mode: 'word-for-word-ai',
    aiFormattingEnabled: true,
    deterministicFirst: true,
  }
}
```

### Processing Pipeline
1. **Template Selection**: User selects "Word-for-Word (with AI)" template
2. **Frontend Detection**: `TranscriptionInterface.tsx` detects template ID
3. **Deterministic Processing**: Apply `formatWordForWordText()` first
4. **AI Processing**: Call `/api/format/word-for-word-ai` endpoint
5. **Backend Processing**: `ProcessingOrchestrator.processWordForWordWithAI()`
6. **AI Formatting**: Custom OpenAI call with specialized prompt
7. **Output**: AI-enhanced formatted transcript

### Code Flow
```typescript
// frontend/src/components/transcription/TranscriptionInterface.tsx
if (template.id === 'word-for-word-formatter' || template.id === 'word-for-word-with-ai') {
  // Step 1: Apply deterministic formatting
  const { formatWordForWordText } = await import('../../utils/wordForWordFormatter');
  let formattedTranscript = formatWordForWordText(rawTranscript);
  
  // Step 2: If AI template, apply AI formatting
  if (template.id === 'word-for-word-with-ai') {
    const response = await fetch('/api/format/word-for-word-ai', {
      method: 'POST',
      body: JSON.stringify({
        transcript: formattedTranscript,
        language: selectedLanguage === 'fr-CA' ? 'fr' : 'en'
      })
    });
    const result = await response.json();
    formattedTranscript = result.formatted;
  }
}
```

### Backend Processing
```typescript
// backend/src/index.ts
app.post('/api/format/word-for-word-ai', authMiddleware, async (req, res) => {
  const { processingOrchestrator } = await import('./services/processing/ProcessingOrchestrator.js');
  
  const result = await processingOrchestrator.processContent({
    sectionId: 'section_7',
    modeId: 'mode1',
    templateId: 'word-for-word-with-ai',
    language: language as 'fr' | 'en',
    content: transcript
  });
});
```

### AI Formatting Implementation
```typescript
// backend/src/services/processing/ProcessingOrchestrator.ts
private async processWordForWordWithAI(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  // Step 1: Apply deterministic word-for-word formatting first
  const { formatWordForWordText } = await import('../../utils/wordForWordFormatter.js');
  let processedContent = formatWordForWordText(content);
  
  // Step 2: Apply AI formatting using custom prompt
  if (aiFormattingEnabled && template.features.aiFormatting) {
    const result = await this.applyWordForWordAIFormatting(processedContent, request.language);
    processedContent = result.formatted;
  }
  
  return processedContent;
}

private async applyWordForWordAIFormatting(content: string, language: 'fr' | 'en'): Promise<{ formatted: string; issues: string[] }> {
  // Load custom Word-for-Word AI prompt
  const promptPath = path.join(process.cwd(), 'backend', 'prompts', 'word-for-word-ai-formatting.md');
  const systemPrompt = fs.readFileSync(promptPath, 'utf8');
  
  // Call OpenAI with custom prompt
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `RAW TRANSCRIPT:\n${content}` }
    ],
    temperature: 0.1
  });
  
  return { formatted: completion.choices[0]?.message?.content?.trim() || content, issues: [] };
}
```

### AI Prompt
```markdown
# Word-for-Word AI Formatting Prompt (v2 — with dates + auto-caps)

## System
You are a deterministic Word-for-Word transcription formatter.

Do exactly this and nothing else:
- Preserve spoken words (no paraphrasing or deletions).
- Apply spoken formatting commands (punctuation/structure).
- Auto-capitalize only at sentence starts created by terminal punctuation and after paragraph breaks.
- Normalize dates using the rules below (EN & FR) without changing meaning.
- Strip speaker prefixes at line starts (see rules).
- If unsure, leave text unchanged.
- Never invent, remove, or reorder medical facts, names, numbers, meds, or findings.

## RULES (apply in this order):

### A) Strip speaker prefixes (only at line starts)
- Remove: "Pt:", "Patient:", "Pat:", "Dr:", "Dre:", "MD:", "Speaker <number>:", "Clinician:", "Doctor:" when they occur at the beginning of a line (case-insensitive), followed by optional spaces.

### B) Convert spoken commands → formatting (match as standalone words, case-insensitive)
**STRUCTURE**
- "new line" | "newline" | "line break" | "retour à la ligne" → \n
- "new paragraph" | "next paragraph" | "nouveau paragraphe" → \n\n

**PUNCTUATION**
- "period" | "full stop" | "point" | "dot" | "stop" → .
- "comma" | "virgule" → ,
- "colon" | "deux points" → :
- "semicolon" | "point virgule" → ;
- "question mark" | "point d'interrogation" → ?
- "exclamation mark" | "point d'exclamation" → !
- "open parenthesis" | "parenthèse ouvrante" → (
- "close parenthesis" | "parenthèse fermante" → )
- "open quote" | "guillemet ouvrant" → "
- "close quote" | "guillemet fermant" → "
- "dash" | "hyphen" | "tiret" → -

### C) Auto-capitalization (strict)
- Capitalize the first letter after terminal punctuation [. ? !] when followed by a space or line break.
- Capitalize the first non-space character at the start of each paragraph (after \n\n).

### D) Date normalization (English & French; only when confident)
**ENGLISH patterns → output**
1. "<Month> <day> <year>" → "Month D, YYYY"
2. "<Month> <year>" → "Month YYYY"
3. "<day> of <Month> <year>" → "D Month YYYY"

**FRENCH patterns → output**
1. "<day> <mois> <année>" → "D mois YYYY"
2. "<mois> <année>" → "mois YYYY"

### E) AWS artifacts (conservative)
- If the same 5+ word segment is repeated **immediately and exactly** back-to-back (streaming duplication), keep one copy.

### F) Safeguards
- Do not modify tokens like "C5 C6", lab values, dosages, ICD/CPT codes.
- Do not correct spelling or grammar beyond the rules above.
- If any rule is uncertain or a match conflicts with medical content, leave as is.

## OUTPUT:
Return only the cleaned transcript. No explanations, no JSON.
```

## Repro Steps

1. **Start servers**: `npm run dev` (both frontend and backend)
2. **Navigate to transcription interface**: http://localhost:5176/
3. **Select "Word-for-Word (with AI)" template**
4. **Paste test transcript**:
   ```
   Pt: The worker reports neck pain following a rare and collision on February 14, 2024, difficulty sleeping, comma, and intermittent headaches. New line. He states Pt: quote Pt: The pain shoots to the right shoulder.

   Pt: close quote Pt: especially when lifting boxes.

   Pt: New line Pt: C 5 Pt: C6 mar stiffness reported, period.
   ```
5. **Click "Format" button**
6. **Observe**: No formatting is applied

## Logs/Artifacts/Errors

### Frontend Console Logs
```
Injecting template content: Word-for-Word (with AI)
Template ID: word-for-word-with-ai
Template category: ai-formatter
Applying Word-for-Word post-processing to current transcript
Raw transcript before formatting: [transcript content]
Formatted transcript after deterministic formatting: [partially formatted]
Applying AI formatting cleanup...
AI formatting applied successfully
```

### Backend Console Logs
```
Starting AWS Transcribe streaming for session: [session-id]
Template Library loaded: 22 Section 7, 22 Section 8, 22 Section 11 templates
🚀 Server starting - Build: 2025-09-08T16:58:53.087Z
✅ /api/profile routes mounted
✅ /api/db routes mounted
```

### Network Requests
- **Expected**: POST request to `/api/format/word-for-word-ai`
- **Actual**: No network requests observed in browser dev tools

## Attempts So Far

### Attempt 1: Template ID Mismatch
**Issue**: Frontend was only checking for `template.id === 'word-for-word-formatter'` but new template has ID `'word-for-word-with-ai'`
**Fix**: Updated condition to include both template IDs
**Result**: Template processing now triggers, but formatting still not working

### Attempt 2: Deterministic Formatter Improvements
**Issue**: Spoken command patterns not matching properly
**Fix**: Enhanced regex patterns for quotes, parentheses, and common abbreviations
**Result**: Some improvements in deterministic formatting, but "New line" and "New paragraph" still not working

### Attempt 3: Backend Endpoint Creation
**Issue**: No dedicated endpoint for Word-for-Word (with AI) template
**Fix**: Created `/api/format/word-for-word-ai` endpoint
**Result**: Endpoint exists but not being called

### Attempt 4: ProcessingOrchestrator Integration
**Issue**: AI formatting not integrated into processing pipeline
**Fix**: Implemented `processWordForWordWithAI()` method with custom AI formatting
**Result**: Backend logic implemented but not being executed

## Constraints/Non-Negotiables

1. **Anti-hallucination by default**: GPT should be OFF unless explicitly enabled
2. **Deterministic first**: Always apply deterministic formatting before AI
3. **Preserve medical accuracy**: Never invent, remove, or reorder medical facts
4. **Minimal changes**: Surgical implementation approach
5. **Backward compatibility**: Existing templates must continue working

## Suspected Causes

### Primary Suspects
1. **Frontend-Backend Communication**: The frontend may not be successfully calling the backend endpoint
2. **Template ID Resolution**: Template ID matching may be failing in the processing pipeline
3. **ProcessingOrchestrator Integration**: The orchestrator may not be properly routing to the AI formatting method
4. **AI Prompt Loading**: The custom prompt file may not be loading correctly
5. **OpenAI Integration**: API calls may be failing silently

### Secondary Suspects
1. **Authentication Issues**: The endpoint may require authentication that's not being provided
2. **CORS Issues**: Cross-origin requests may be blocked
3. **Error Handling**: Errors may be swallowed and not reported
4. **Template Registry**: The template may not be properly registered in the backend

## Narrow Fix Proposal

### Immediate Actions
1. **Add comprehensive logging** to track the complete flow from frontend to backend
2. **Test deterministic formatter independently** to isolate issues
3. **Verify template ID matching** throughout the pipeline
4. **Check network requests** in browser dev tools
5. **Test backend endpoint directly** with curl/Postman

### Debugging Steps
1. **Frontend Debugging**:
   - Add console.log statements at each step of template processing
   - Verify template ID is correctly detected
   - Check if fetch request is being made
   - Log response from backend

2. **Backend Debugging**:
   - Add logging to endpoint handler
   - Verify ProcessingOrchestrator is being called
   - Check if AI formatting method is executed
   - Log OpenAI API calls and responses

3. **Integration Testing**:
   - Test deterministic formatter with known input/output
   - Test AI formatting with simple examples
   - Test complete pipeline with minimal transcript

### Expected Resolution
The issue is likely in the frontend-backend communication or template ID resolution. Once the complete flow is working, the template should:
1. Apply deterministic formatting (remove "Pt:", convert spoken commands)
2. Apply AI formatting (enhanced cleanup, date normalization, capitalization)
3. Return properly formatted transcript

## Files Modified
- `frontend/src/components/transcription/TranscriptionInterface.tsx`
- `frontend/src/config/template-config.ts`
- `backend/src/index.ts`
- `backend/src/services/processing/ProcessingOrchestrator.ts`
- `backend/src/utils/wordForWordFormatter.ts`
- `backend/prompts/word-for-word-ai-formatting.md`
- `backend/src/config/templates.ts`

## Current Status
- ✅ Template configuration complete
- ✅ Backend endpoint implemented
- ✅ ProcessingOrchestrator integration complete
- ✅ AI formatting method implemented
- ✅ Deterministic formatter improvements
- ❌ End-to-end integration not working
- ❌ No evidence of AI processing
- ❌ Spoken commands not fully converted

## Next Steps
1. Add comprehensive debugging/logging
2. Test each component independently
3. Verify network communication
4. Test with minimal examples
5. Iterate until complete pipeline works
