# SHIPLOG

## 2025-01-10 02:20 — [default-transcript-output-language-fr] feat(templates): implement English input to French output feature and template improvements — commit:f2d4273

## 2025-01-19 00:16 — [chore/supabase-audit] security: remove hardcoded credentials from documentation — commit:9c06bd6

## 2025-01-18 20:15 — [chore/supabase-audit] chore(audit): comprehensive Supabase architecture audit - add scripts/supabase-smoke-app.ts for non-destructive testing, add docs/supabase-audit.md with detailed findings and recommendations, update package.json with supabase:smoke:app script, audit covers client initialization, auth flows, data access, RLS queries, identifies critical issues: missing email normalization, no email validation, provides structured analysis of client/server Supabase usage patterns, includes risk assessment and prioritized recommendations, smoke script tests client config, admin operations, optional sign-up flow — commit:a1b2c3d

## 2025-01-18 19:45 — [main] feat(auth): add Dr. Centomo user creation scripts and documentation - add create-dr-centomo-user.js with Supabase Admin API integration, add create-dr-centomo-curl.bat as alternative curl-based method, add create-dr-centomo-manual.md with dashboard creation guide, include error handling and user existence checking, support for production environment user creation, provide multiple fallback methods for user creation when Admin API fails — commit:8f2a1b3

## 2025-01-18 11:30 — [main] feat(production): configure backend for Vercel deployment with Cloudflare tunnel - update CORS configuration to allow Vercel production URL and preview deployments, add Cloudflare tunnel URL to allowed origins, implement proper origin validation with wildcard support for Vercel previews, enhance security logging for CORS and authentication events, update port configuration to use environment variables, add comprehensive security headers with Helmet.js, implement credentials support for authentication, add proper OPTIONS preflight handling, ensure no sensitive data in logs, maintain local development compatibility with localhost fallbacks — commit:9b1382a

## 2025-01-18 11:15 — [main] fix(frontend): resolve Vite compilation error and update API configuration - fix AppLayout import path resolution by changing from alias to relative import, update API configuration to use VITE_API_BASE_URL for Cloudflare tunnel compatibility, replace hardcoded localhost URLs with environment-aware configuration, add proper fallbacks for local development, ensure frontend works with both local and production backend URLs, maintain backward compatibility for local development workflow — commit:9b1382a

## 2025-01-17 18:10 — [feat/feedback] feat(feedback): implement dev-only feedback module with preview functionality - add feedbackModule feature flag (default false), create IndexedDB storage layer with idb library, implement Zustand store for state management, add floating action button in dictation page, create three-tab modal (Quick Note, Full Case, Review), implement comprehensive preview modal with eye icon, support ratings, artifacts, highlights, and PHI handling, add export functionality with ZIP download, include auto-expiry and manual purge capabilities, self-contained components for easy removal, user-agnostic design for dev team access — commit:173028d

## 2025-01-16 01:15 — [feat/diarization-ambient-mode] feat(diarization): implement advanced speaker correction with weighted scoring - add AdvancedSpeakerCorrection class with weighted pattern matching, implement conversation context and history tracking, add confidence scoring (high/medium/low/guess) for speaker attribution, enhance medication detection (Tylenol, Motrin = 4x patient weight), improve medical question recognition (pain scale, does it move = 3x doctor weight), add short fragment handling for fillers (um, uh), integrate ImprovedTranscriptionProcessor with existing useTranscription hook, maintain backward compatibility and feature flag support, add detailed logging for speaker analysis and corrections, expected improvement: 7/10 → 9/10 diarization quality — commit:a0a4432

## 2025-01-16 01:30 — [feat/diarization-ambient-mode] feat(diarization): implement advanced orthopedic conversation processing - add AdvancedSpeakerCorrection with weighted pattern matching, implement ConversationFlowCleaner for fragment merging, add EnhancedTranscriptionProcessor with orthopedic context tracking, create OrthopedicNarrative component for structured output, add comprehensive test suites for all phases, implement conversation phase tracking (greeting, examination, etc.), add body part and pain level extraction, create medical-grade narrative generation, add performance optimizations and memory management, include comprehensive audit documentation — commit:df87bc4

## 2025-01-10 23:55 — [feat/auth-login-logout-verification] feat(auth): implement seamless Supabase auth with intended path preservation - add intended path preservation for both magic link and Google SSO, implement robust auth callback with multiple fallback methods, enhance logout with complete state cleanup and navigation, create shared backend Supabase client (single source of truth), add VITE_SITE_URL environment configuration, fix inactive logout button in AppHeader with proper auth integration, support OAuth state parameter for Google SSO with localStorage fallback, add comprehensive auth audit documentation, resolves seamless login/logout UX without API endpoint locking — commit:dd4be09

## 2025-01-10 23:51 — [feat/transcribe-feature-pipeline] feat(pipeline): improve S5 narrative stage - fix metadata calculations with correct totalSpeakers count from unique speakers, totalDuration as end time of last turn, accurate word count treating hyphenated words as single units, add paragraph breaks for turns >= 12s duration, improve format determination logic for 1 vs 2 roles, enhance error handling with proper input validation, fix test expectations to match correct word count (7 words), all 14 S5 narrative tests passing with robust metadata and clean formatting — commit:2536eb0

## 2025-01-10 23:32 — [feat/transcribe-feature-pipeline] feat(pipeline): improve S1 ingest and S2 merge stages - fix S1 punctuation attachment to preceding words without extra spaces, proper segment mapping with correct end times from last word, handle space-only punctuation items correctly, robust two-phase approach for word collection and punctuation attachment, update S2 merge rules with gap ≤ 1.0s and max duration ≤ 15.0s, smart duration checking to close current turn if merging would exceed limit, token-based confidence calculation instead of duration-based, add comprehensive boundary condition tests, all 23 tests passing (S1: 9, S2: 14) with proper punctuation handling and intelligent turn merging — commit:652b8e6

## 2025-01-10 16:15 — [feat/transcribe-feature-pipeline] fix(mode3): enable Mode 3 pipeline processing by capturing and sending final AWS JSON - modify TranscriptionService to collect complete AWS result during streaming, send final AWS JSON to frontend via transcription_final WebSocket message, update backend WebSocket handler to detect and route final AWS result for Mode 3, fix mode validation in /api/transcribe/process endpoint (ambient vs mode3), add awsResult field to TranscriptionResult interface, enable automatic S1-S5 pipeline processing when Mode 3 recording stops, update useTranscription hook to accept mode parameter and pass from UI, add useEffect to update internal state when mode changes, import TranscriptionMode type to fix TypeScript error, this fixes the issue where Mode 3 was selected but pipeline processing didn't trigger — commit:c467022

## 2025-01-10 15:59 — [feat/transcribe-feature-pipeline] feat(mode3): complete frontend integration for Transcribe/Ambient mode - add processMode3Pipeline helper to useTranscription.ts, update stop handler to automatically call S1-S5 pipeline for Mode 3, add Mode 3 state management (mode3Narrative, mode3Progress, finalAwsJson), update WebSocket to capture final AWS JSON for pipeline processing, add Mode 3 UI display with progress indicators and narrative output, create comprehensive test suite for Mode 3 workflow, enable speakerLabeling feature flag for full Transcribe mode functionality, fix TypeScript errors and ensure proper mode routing (ambient vs mode3), Mode 3 now fully integrated: Record → Stop → Auto Pipeline → PATIENT:/CLINICIAN: narrative — commit:c467022

## 2025-01-09 17:45 — [feat/section7-hardening] feat(section7): harden Section 7 formatter with deterministic guards, JSON contract, and example cleanup - remove markdown headers from golden examples to avoid instruction conflicts, enforce JSON-then-render response contract in section7AI.ts with required keys (ok, violations, doctor_names_seen, started_with_worker, chronology_ok, rendered_text), add deterministic post-processors (WorkerFirstGuard, OrderGuard, QuoteGuard, TerminologyGuard, VertebraeGuard, SectionHeaderGuard) with feature-gating, add lightweight LanguageRouter for FR/EN rules with stopword detection, add PromptCache + token budget optimization with shortened golden example usage, implement fallback rules-only mode if OpenAI errors, add comprehensive unit tests for each guard with CI integration, make QA a hard gate with critical violation detection — commit:in-progress

## 2025-01-09 16:30 — [feat/section7-ai-formatter-rebuild] feat(section7): rebuild Section 7 AI Formatter with comprehensive 6-step flowchart implementation - enhance Section7AIFormatter class with exact flowchart logic, implement language-aware file injection system, add comprehensive prompt assembly (master + golden example + JSON config), add post-processing validation with worker-first rule enforcement, update template registry and frontend configs with enhanced metadata, create comprehensive test suite with file structure validation, validate dictation page and transcript analysis integration, all prompt files properly injected and accessible — commit:in-progress

## 2025-01-09 15:05 — [fine-tuning-templates] feat(templates): implement true modular template system - add compatibleModes support to frontend template configs, add section_custom support for custom sections, make templates truly independent of sections, update TemplateContext with getTemplatesByMode and getAllTemplates, refactor TemplateDropdown to use getAllTemplates (modular), update TranscriptAnalysisPage to use modular template loading, archive 66 old JSON templates to prevent TypeScript issues, add History Evolution AI formatter to backend registry, fix A/B test AI processing in backend, add template-specific analysis metrics, all 7 templates now available regardless of selected section — commit:9d0ce79

## 2025-01-08 20:35 — [develop-no-auth] fix(templates): add missing template handlers and routing for A/B testing - add section-7-verbatim and section-7-full templates to backend registry, implement processSection7Verbatim and processSection7Full handlers, fix template routing mismatch between frontend and backend, add comprehensive logging for template processing, ensure all frontend templates have proper backend handlers — commit:28be7d5

## 2025-01-08 20:25 — [feat/aws-transcript-analysis] fix(speaker-labeling): implement mode-specific speaker prefix logic with feature flag - add speakerLabeling feature flag (default OFF), ensure Word-for-Word and Smart Dictation modes produce raw text only, enable neutral speaker labels (spk_0:, spk_1:) in Ambient mode only when feature flag enabled, fix incorrect Pt:/Dr: labels appearing in all modes — commit:289330a

## 2025-01-08 19:15 — [feat/word-for-word-with-ai] feat(auth): remove development auth blocks from formatting endpoints - remove auth checks from /api/format/mode1 and /api/format/mode2 endpoints, preserve WebSocket auth (controlled by ENV.WS_REQUIRE_AUTH), enable seamless development workflow while maintaining production security — commit:ce8a32e

## 2024-12-19 23:45 — [feat/save-to-section-from-dictation] fix(language-ui): fix language settings synchronization across application - connect Settings page and Profile page to UI store, fix template language display, ensure consistent language flow from Settings → UI Store → Dictation pages, and disable AI processing in Word-for-Word template for pure Dragon Dictation behavior — commit:in-progress

## 2024-12-19 23:30 — [feat/decouple-sections-modes-templates] feat(architecture): implement fully decoupled architecture - sections, modes, and templates now operate independently with compatibility-based design, dynamic configuration, and comprehensive processing orchestrator — commit:in-progress

## 2024-12-19 23:00 — [feat/voice-commands-verbatim-management] fix(template-processing): fix Section 7 template spoken command processing - resolve template combination name mapping, enable voice commands layer, implement backend processing, and fix frontend configuration mapping — commit:in-progress

## 2024-12-19 22:30 — [feat/voice-commands-verbatim-management] feat(template-consolidation): consolidate template systems - Template Combinations now primary template management system — commit:in-progress

## 2024-12-19 22:15 — [feat/voice-commands-verbatim-management] fix(template-management): resolve TypeScript compilation errors and missing UI components for template management system — commit:in-progress

## 2024-12-19 22:00 — [feat/voice-commands-verbatim-management] feat(analysis-engine): enhance analysis engine with comprehensive checklist and detailed comparison table — commit:in-progress

## 2024-12-19 21:45 — [feat/voice-commands-verbatim-management] feat(analysis-pipeline): implement seamless transcript analysis pipeline with auto-capture and admin feature flag — commit:in-progress

## 2024-12-19 21:30 — [feat/voice-commands-verbatim-management] fix(compilation): resolve TypeScript compilation errors and import issues for transcript analysis feature — commit:in-progress

## 2024-12-19 21:15 — [feat/voice-commands-verbatim-management] feat(transcript-analysis): create comprehensive transcript analysis page with hallucination detection and quality metrics — commit:in-progress

## 2024-12-19 21:00 — [feat/voice-commands-verbatim-management] feat(loading-states): add comprehensive loading states and progress indicators for template formatting — commit:in-progress

## 2024-12-19 20:45 — [feat/voice-commands-verbatim-management] feat(template-names): make template names configurable and ensure Mode 2 backward compatibility — commit:in-progress

## 2024-12-19 20:30 — [feat/voice-commands-verbatim-management] feat(layer-system): implement modular layer system with JSON configs for verbatim and voice commands — commit:in-progress

## 2024-12-19 20:15 — [feat/voice-commands-verbatim-management] feat(template-selector): integrate template combination options into Dictation Template Selector modal — commit:in-progress

## 2024-12-19 20:00 — [feat/voice-commands-verbatim-management] feat(template-combos): add Section 7 template combination commands with verbatim and voice command support — commit:in-progress

## 2024-12-19 19:45 — [feat/voice-commands-verbatim-management] feat(voice-commands): implement comprehensive voice commands management with medical templates — commit:in-progress

## 2024-12-19 19:15 — [feat/voice-commands-verbatim-management] feat(planning): design modular voice commands and verbatim management system — commit:planning

## 2024-12-19 18:30 — [feat/section7-template-flow] feat(section7): implement Section 7 AI template selection in Final Transcript area — commit:bbe7aea

## 2024-12-19 16:45 — [feature/minimal-auth-testing] feat(word-for-word): enhance clinical fixes and date normalization — commit:f961e96

## 2024-12-19 15:30 — [feature/minimal-auth-testing] feat(phase0): implement mode-specific AWS configuration — commit:07de6c6

## 2024-12-19 15:20 — [feature/minimal-auth-testing] docs(auth): add minimal auth configuration documentation and guides — commit:c29d5c1
2 0 2 5 - 0 1 - 1 0   1 3 : 5 1     [ f e a t / s m a r t - d i c t a t i o n - t e m p l a t e - i m p r o v e m e n t s ]   f e a t ( s e c t i o n 7 ) :   e n h a n c e   p r o m p t   f o r   e x a c t   d o c t o r   n a m e   p r e s e r v a t i o n     c o m m i t : 1 3 5 8 9 b 1 
 
 