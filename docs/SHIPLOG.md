# SHIPLOG

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
