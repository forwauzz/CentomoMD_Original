# CentomoMD – PRD Addendum: Live Bilingual Transcription Integration

## 1. Objective

Enable real-time transcription of bilingual (English/French) doctor–patient conversations directly into structured CNESST sections (especially Sections 7, 8, and 11), using AWS Transcribe Standard Streaming API, with:

- Law 25 / PIPEDA / HIPAA compliance
- Realtime or near-realtime preview
- Dictation mode toggle (Word-for-Word or Smart Dictation)
- Export fidelity to CNESST Word/PDF format
- One-hour uninterrupted transcription capability

## 2. Transcription Modes

| Mode          	| Description          	| Output Format 	| When to Use           	|
|-------------------|---------------------------|--------------------|----------------------------|
| Word-for-Word 	| Raw live speech-to-text   | Plain paragraph	| Fast, accurate capture 	|
| Smart Dictation   | AI-assisted, medical structured | Section 7–11 templates | Final reports, AI summaries |
| Ambient       	| Long-form capture, diarized | Streaming + merge | Only with signed consent  |

**Dictation Mode Toggle:**
- Located in UI beside record button.
- Defaults to Smart Dictation.
- Persists per section (e.g., Section 7 = Word-for-Word, Section 8 = Smart Dictation).

## 3. Runtime and Stream Behavior

- Each session must support minimum 1 hour uninterrupted streaming.
- Auto-reconnect logic should:
  - Resume stream if disconnected <15s
  - Log error and notify user if more than 3 reconnects fail

## 4. Section Mapping Logic (7, 8, 11)

### Section 7 – Historique de faits et évolution:
- Accepts chronological narrative
- Structure: Incident description, Medical evolution, Imaging/treatment history
- Voice cues: "Debut historique", "Fin section sept"

### Section 8 – Questionnaire subjectif:
- Accepts structured subjective data (pain scale, ADLs, patient's perception)
- Voice cues: "Nouvelle plainte", "Impact sur les activités", "Fin section huit"

### Section 11 – Conclusion médicale:
- Summaries, diagnostics, consolidation dates, impairments
- Voice cues: "Résumé médical", "Pourcentage atteinte", "Conclusion finale"

## 5. Voice Commands

| Command               	| Behavior                        	|
|---------------------------|--------------------------------------|
| "Démarrer transcription"  | Begins current mode              	|
| "Pause transcription" 	| Pauses without saving            	|
| "Fin section [X]"     	| Saves transcript to section X    	|
| "Effacer"             	| Clears last transcript buffer    	|
| "Nouveau paragraphe"  	| Line break                       	|
| "Sauvegarder et continuer"| Commits section and opens next   	|

Voice command listener is scoped only to current session and language mode.

## 6. Export Requirements

| Export Type   	| Contents              	| Format  	| Fidelity   	|
|-------------------|---------------------------|-------------|----------------|
| Transcript Only	| Raw transcription     	| DOCX / PDF  | Low        	|
| Structured Report  | Structured data (1–11)	| DOCX / PDF  | Medium     	|
| Full Form      	| CNESST pixel-perfect form | DOCX / PDF  | High       	|

- Section 12: Hardcoded table + optional signature
- Export locale auto-localized (FR)
- File Naming: `CENTOMO_[SECTION#]_[YYYY-MM-DD]_[PT_LASTNAME].pdf`

## 7. Compliance & Privacy Logic

- Region locked to ca-central-1 (Montreal)
- Temp audio and transcripts stored in S3 with 24h auto-delete
- No PHI in Postgres
- All transcripts deleted after export unless saved
- PHI never sent to third parties

## 8. Real-Time Preview

**MVP Strategy:**
- Post-processed preview (1–2 sec delay after sentence) for Phase 1

**Future:**
- Live caption preview (word-by-word) if latency <500ms

## 9. Tech Stack (Confirmed)

| Area           	| Tech                         	|
|--------------------|----------------------------------|
| Backend        	| Node.js, Express, TypeScript 	|
| Frontend       	| React, Vite, TailwindCSS, shadcn |
| Realtime Transcribe| amazon-transcribe-streaming-sdk  |
| Exports        	| docx-templater, PizZip, Puppeteer|
| Storage        	| Supabase Postgres + AWS S3   	|

## 10. MVP Dev Tasks

- [ ] Mic input (PCM, 16-bit, 16kHz)
- [ ] AWS Transcribe stream + auto-reconnect
- [ ] Section selector + mode toggle
- [ ] Transcript handler with section routing
- [ ] Post-processed preview (textarea buffer)
- [ ] Export DOCX + PDF (Section 7/8/11)
- [ ] Voice commands (basic triggers)
- [ ] Session timer + autosave every 5 min

## 🧩 Template Library for AI Formatting

CentomoMD will include a structured Template Library used to guide AI formatting for CNESST documentation. This is particularly important for sections with strict compliance or presentation requirements.

### Template Library Requirements:

- Each template must be linked to a specific CNESST section (e.g., Section 7, 8, 11).
- Templates must support bilingual structure (FR/EN).
- Voice command tags (e.g., 'Insert Impression', 'Insert Chronology') must be linked to formatting logic.
- The library must allow easy updates to templates without redeploying core code.
- Templates must support metadata such as author, version, last updated, and section logic.

### Use Cases:

- Automatically format dictated content according to Section 7, 8, or 11 template rules.
- Enable "AI smart insert" based on voice triggers from doctor (e.g., 'insert plan').
- Apply post-processing formatting logic consistently per section.
- Use templates to manage default placeholders or prompts for missing data.

**This module is required for production deployment.**

---

## Implementation Status

### ✅ Completed Features
- Template library structure implemented
- CNESST section templates (7, 8, 11) created
- Voice command system integrated
- Bilingual support (French/English)
- Template validation and formatting rules

### 🚧 In Progress
- Real-time transcription integration
- Export functionality (DOCX/PDF)
- Session management and autosave
- Voice command training interface

### 📋 Pending
- AWS Transcribe streaming implementation
- Auto-reconnect logic
- Post-processed preview system
- Compliance audit logging
- Production deployment preparation

---

*Document Version: 1.0*  
*Last Updated: 2024-01-01*  
*Status: Active Development*
