# Critical Systems Protection Plan

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Purpose:** Document all critical endpoints, APIs, configs, and systems that must NOT be touched during template combinations migration

---

## ⚠️ **CRITICAL: DO NOT MODIFY THESE SYSTEMS**

This document lists all critical systems that must remain **completely untouched** during the template combinations database migration. Any changes to these systems could break production functionality.

---

## 1. **Processing Orchestrator System** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/services/processing/ProcessingOrchestrator.ts` - **884 lines**
- `backend/src/config/sections.ts` - Section manager
- `backend/src/config/modes.ts` - Mode manager
- `backend/src/config/templates.ts` - **Backend template registry (NOT frontend config)**

### **Key Components**
```typescript
// ProcessingOrchestrator uses backend/config/templates.ts (NOT frontend)
import { templateManager, TemplateConfig } from '../../config/templates.js';

// This is SEPARATE from frontend/src/config/template-config.ts
// DO NOT confuse the two!
```

### **What It Does**
- Coordinates sections, modes, and templates
- Validates compatibility between section/mode/template
- Routes processing requests to correct handlers
- Used by `/api/format/mode2` endpoint

### **Dependencies**
- Uses `templateManager` from `backend/src/config/templates.ts`
- Uses `sectionManager` from `backend/src/config/sections.ts`
- Uses `modeManager` from `backend/src/config/modes.ts`

### **⚠️ Migration Impact**
- ✅ **SAFE**: ProcessingOrchestrator can continue using `backend/src/config/templates.ts`
- ✅ **NO CHANGES NEEDED**: Orchestrator doesn't need to know about database templates
- ⚠️ **NOTE**: Frontend template combinations (`frontend/src/config/template-config.ts`) are SEPARATE from backend orchestrator templates

---

## 2. **Format API Endpoints** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/routes/format.ts` - Format router (mode2 endpoint)
- `backend/src/index.ts` - Mode1, word-for-word-ai, history-evolution endpoints

### **Critical Endpoints: DO NOT TOUCH**

#### **1. `/api/format/mode2` (Smart Dictation)**
- **Location:** `backend/src/routes/format.ts:46-162`
- **Purpose:** Main formatting endpoint for template application
- **Key Features:**
  - Accepts `inputLanguage`, `outputLanguage`, `templateId`
  - Routes to `ProcessingOrchestrator`
  - Used by transcription interface
- **Dependencies:**
  - Uses `ProcessingOrchestrator` (which uses backend template manager)
  - Does NOT use frontend template combinations

#### **2. `/api/format/mode1` (Word-for-Word)**
- **Location:** `backend/src/index.ts:1755-1832`
- **Purpose:** Basic word-for-word formatting
- **Key Features:**
  - Accepts `inputLanguage`, `outputLanguage`
  - Uses `Mode1Formatter`
  - Independent of templates

#### **3. `/api/format/word-for-word-ai` (Word-for-Word with AI)**
- **Location:** `backend/src/index.ts:1835-1912`
- **Purpose:** Deterministic word-for-word with GPT cleanup
- **Key Features:**
  - Uses `wordForWordAIFormatter`
  - Independent of templates

#### **4. `/api/format-history-evolution` (History of Evolution)**
- **Location:** `backend/src/index.ts:1915-1974`
- **Purpose:** Special formatting for history of evolution
- **Key Features:**
  - Uses `enhancedFormatHistoryEvolutionText`
  - Independent of templates

### **⚠️ Migration Impact**
- ✅ **ALL ENDPOINTS SAFE**: Format endpoints don't need database template integration
- ✅ **NO CHANGES NEEDED**: Endpoints continue working as-is
- ⚠️ **NOTE**: Frontend can fetch template metadata from database, but processing logic stays the same

---

## 3. **Layer System** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/services/layers/LayerManager.ts` - Layer manager
- `backend/src/services/layers/UniversalCleanupLayer.ts` - Universal cleanup layer
- `backend/src/services/layers/ClinicalExtractionLayer.ts` - Clinical extraction layer
- `backend/config/layers/*.json` - Layer configuration files

### **Layer Configuration Files: DO NOT MODIFY**
```
backend/config/layers/
├── universal-cleanup-layer.json      # ✅ DO NOT MODIFY
├── clinical-extraction-layer.json    # ✅ DO NOT MODIFY
├── verbatim-layer.json               # ✅ DO NOT MODIFY
├── voice-commands-layer.json         # ✅ DO NOT MODIFY
└── template-combinations.json        # ⚠️ CAN MODIFY (references layers)
```

### **Key Components**

#### **1. LayerManager**
- **Purpose:** Manages all processing layers
- **Location:** `backend/src/services/layers/LayerManager.ts`
- **Features:**
  - Loads layer configs from JSON files
  - Manages template combinations (which layers to apply)
  - Handles layer dependencies and fallbacks

#### **2. UniversalCleanupLayer**
- **Purpose:** Universal transcript cleanup + clinical entity extraction
- **Location:** `backend/src/services/layers/UniversalCleanupLayer.ts`
- **Features:**
  - Cleans transcript (removes timestamps, hesitations)
  - Extracts clinical entities (FR/EN)
  - Caching support
  - Used by template combinations

#### **3. ClinicalExtractionLayer**
- **Purpose:** Legacy clinical extraction (separate from universal cleanup)
- **Location:** `backend/src/services/layers/ClinicalExtractionLayer.ts`
- **Features:**
  - Extracts clinical entities from transcripts
  - Caching support

### **Template Combinations Config**
- **File:** `backend/config/layers/template-combinations.json`
- **Purpose:** Defines which layers to apply for each template combination
- **Examples:**
  ```json
  {
    "universal-cleanup": {
      "layers": ["universal-cleanup-layer"],
      "fallback": "template-only"
    },
    "template-verbatim": {
      "layers": ["verbatim-layer"],
      "fallback": "template-only"
    }
  }
  ```

### **⚠️ Migration Impact**
- ✅ **LAYERS SAFE**: Layer processing logic unchanged
- ✅ **LAYER CONFIGS SAFE**: Layer JSON files unchanged
- ⚠️ **TEMPLATE COMBINATIONS**: This config file defines layer combinations, but layers themselves are independent
- ✅ **NO CHANGES NEEDED**: Layer system continues working as-is

---

## 4. **Language Input/Output System** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `frontend/src/stores/uiStore.ts` - Language state management
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Language selectors
- `backend/src/config/flags.ts` - Language feature flags
- `backend/src/routes/format.ts` - Language parameter handling

### **Key Components**

#### **1. Frontend Language State**
```typescript
// frontend/src/stores/uiStore.ts
interface UIState {
  inputLanguage: 'fr' | 'en';     // For dictation (fr-CA/en-US)
  outputLanguage: 'fr' | 'en';    // For template output
}
```

#### **2. Language Selectors**
- **Location:** `frontend/src/components/transcription/TranscriptionInterface.tsx:1046-1081`
- **Components:**
  - `InputLanguageSelector` - Selects dictation language
  - `OutputLanguageSelector` - Selects output language (with CNESST policy warning)

#### **3. Backend Language Handling**
- **Location:** `backend/src/routes/format.ts:79-102`
- **Features:**
  - Accepts `inputLanguage`, `outputLanguage`
  - Policy gate for CNESST sections (must output French unless flag enabled)
  - Backward compatibility with legacy `language` parameter

### **Environment Variables: DO NOT MODIFY**
```bash
# Language configuration flags
ENABLE_OUTPUT_LANGUAGE_SELECTION=true
CNESST_SECTIONS_DEFAULT_OUTPUT=fr
ALLOW_NON_FRENCH_OUTPUT=false
```

### **⚠️ Migration Impact**
- ✅ **LANGUAGE SYSTEM SAFE**: No changes needed
- ✅ **NO CHANGES NEEDED**: Language handling continues working
- ⚠️ **NOTE**: Templates in database will store language preferences, but language processing logic is separate

---

## 5. **Backend Template Manager** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/config/templates.ts` - **Backend template registry (655 lines)**
- **Note:** This is SEPARATE from `frontend/src/config/template-config.ts`

### **Key Components**

#### **TemplateManager Class**
```typescript
// backend/src/config/templates.ts
export class TemplateManager {
  private templates: TemplateRegistry;
  
  getTemplate(templateId: string): TemplateConfig | null;
  getAllTemplates(): TemplateConfig[];
  getTemplatesBySection(sectionId: string): TemplateConfig[];
  getTemplatesByMode(modeId: string): TemplateConfig[];
  // ... more methods
}

export const templateManager = new TemplateManager();
```

### **Template Registry**
- **Location:** `backend/src/config/templates.ts:54-517`
- **Structure:** `TEMPLATE_REGISTRY` object with template definitions
- **Used By:**
  - `ProcessingOrchestrator`
  - Backend processing logic
  - **NOT used by frontend**

### **⚠️ Migration Impact**
- ✅ **BACKEND TEMPLATE MANAGER SAFE**: This is SEPARATE from frontend template combinations
- ✅ **NO CHANGES NEEDED**: Backend continues using static registry
- ⚠️ **NOTE**: Backend `TemplateManager` is for processing logic, frontend template combinations are for UI selection
- ✅ **SAFE TO IGNORE**: Backend template registry is independent of database migration

---

## 6. **Formatter Services** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/services/formatter/mode2.ts` - Mode 2 formatter
- `backend/src/services/formatter/historyEvolution.ts` - History evolution formatter
- `backend/src/utils/wordForWordFormatter.ts` - Word-for-word formatter
- `backend/src/services/aiFormattingService.ts` - AI formatting service

### **Key Formatters**

#### **1. Mode2Formatter**
- **Purpose:** Smart dictation formatting with templates
- **Location:** `backend/src/services/formatter/mode2.ts`
- **Features:**
  - Applies section-specific formatting (Section 7, Section 8)
  - Uses LayerManager for layer processing
  - Template combination support

#### **2. HistoryEvolutionFormatter**
- **Purpose:** History of evolution specific formatting
- **Location:** `backend/src/services/formatter/historyEvolution.ts`
- **Features:**
  - Worker-first rule enforcement
  - Chronological order
  - Medical terminology preservation

#### **3. WordForWordFormatter**
- **Purpose:** Deterministic word-for-word formatting
- **Location:** `backend/src/utils/wordForWordFormatter.ts`
- **Features:**
  - Voice command conversion
  - Spacing cleanup
  - Capitalization

#### **4. AIFormattingService**
- **Purpose:** GPT-based formatting
- **Location:** `backend/src/services/aiFormattingService.ts`
- **Features:**
  - OpenAI API integration
  - Prompt management
  - Caching

### **⚠️ Migration Impact**
- ✅ **ALL FORMATTERS SAFE**: No changes needed
- ✅ **NO CHANGES NEEDED**: Formatters continue working as-is
- ⚠️ **NOTE**: Formatters receive template IDs but don't need database access

---

## 7. **Section and Mode Managers** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/config/sections.ts` - Section manager
- `backend/src/config/modes.ts` - Mode manager

### **Key Components**

#### **SectionManager**
- **Purpose:** Manages CNESST sections (7, 8, 11)
- **Location:** `backend/src/config/sections.ts`
- **Features:**
  - Section definitions
  - Language support per section
  - Mode compatibility per section

#### **ModeManager**
- **Purpose:** Manages dictation modes (mode1, mode2, mode3)
- **Location:** `backend/src/config/modes.ts`
- **Features:**
  - Mode definitions
  - Section compatibility
  - Capabilities per mode

### **⚠️ Migration Impact**
- ✅ **MANAGERS SAFE**: No changes needed
- ✅ **NO CHANGES NEEDED**: Section and mode definitions are static
- ⚠️ **NOTE**: These are separate from template management

---

## 8. **Configuration and Flags** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/config/flags.ts` - Feature flags
- `backend/.env.example` - Environment variable template
- `backend/src/config/env.ts` - Environment variable loader

### **Key Environment Variables**

#### **Language Flags**
```bash
ENABLE_OUTPUT_LANGUAGE_SELECTION=true
CNESST_SECTIONS_DEFAULT_OUTPUT=fr
ALLOW_NON_FRENCH_OUTPUT=false
```

#### **Universal Cleanup Flags**
```bash
UNIVERSAL_CLEANUP_ENABLED=true
UNIVERSAL_CLEANUP_SHADOW=false
```

#### **Processing Flags**
```bash
SLO_P95_MS=5000
SLO_P99_MS=8000
CACHE_TTL_SECONDS=604800
```

### **⚠️ Migration Impact**
- ✅ **FLAGS SAFE**: No changes needed
- ✅ **NO CHANGES NEEDED**: Feature flags continue working
- ⚠️ **NOTE**: Can add new flag for database template loading (optional)

---

## 9. **Frontend Transcription Interface** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY (Except Template Loading)**
- `frontend/src/components/transcription/TranscriptionInterface.tsx` - Main transcription UI
- `frontend/src/components/transcription/TemplateSelector.tsx` - Template selection
- `frontend/src/components/transcription/TemplateDropdown.tsx` - Template dropdown
- `frontend/src/hooks/useTranscription.ts` - Audio capture & WebSocket

### **What Can Change**
- ✅ **Template Loading**: `TemplateContext` can fetch from API (with static fallback)
- ✅ **Template Selection UI**: Can show database templates instead of static configs

### **What Cannot Change**
- ❌ **API Call Format**: `/api/format/mode2` endpoint signature
- ❌ **Language Parameters**: `inputLanguage`, `outputLanguage` handling
- ❌ **Template ID Format**: Template IDs must remain consistent
- ❌ **WebSocket Logic**: Audio capture and real-time transcription

### **⚠️ Migration Impact**
- ✅ **UI SAFE**: Only template loading changes (with fallback)
- ✅ **NO BREAKING CHANGES**: All existing functionality preserved
- ⚠️ **NOTE**: Template selection can use database, but processing flow stays same

---

## 10. **Database Schema (Existing Tables)** 🔴 **CRITICAL**

### **Tables: DO NOT MODIFY**
- `users` - User accounts
- `profiles` - User profiles
- `sessions` - Transcription sessions
- `transcripts` - Transcript content
- `cases` - Medical cases
- `templates` - **Existing template table (legacy, can leave empty)**
- `clinics` - Clinic information
- `audit_logs` - Audit trail
- `voice_command_mappings` - Voice command mappings

### **⚠️ Migration Impact**
- ✅ **ALL EXISTING TABLES SAFE**: Only adding new table
- ✅ **NO SCHEMA CHANGES**: Only creating `template_combinations` table
- ⚠️ **NOTE**: Existing `templates` table can remain empty (it's not used)

---

## 11. **API Endpoints (Existing)** 🔴 **CRITICAL**

### **Endpoints: DO NOT MODIFY**

#### **Formatting Endpoints**
- `POST /api/format/mode1` - Mode 1 formatting
- `POST /api/format/mode2` - Mode 2 formatting (Smart Dictation)
- `POST /api/format/word-for-word-ai` - Word-for-word with AI
- `POST /api/format-history-evolution` - History of evolution

#### **Template Endpoints (Placeholder - Can Enhance)**
- `GET /api/templates` - Get all templates (placeholder)
- `GET /api/templates/:id` - Get template by ID (placeholder)
- `POST /api/templates` - Create template (placeholder)
- `PUT /api/templates/:id` - Update template (placeholder)
- `DELETE /api/templates/:id` - Delete template (placeholder)

#### **New Endpoints (Safe to Add)**
- `GET /api/template-combinations` - **NEW** Get template combinations from database
- `GET /api/template-combinations/:id` - **NEW** Get template combination by ID
- `POST /api/template-combinations/:id/usage` - **NEW** Update usage stats

### **⚠️ Migration Impact**
- ✅ **EXISTING ENDPOINTS SAFE**: No changes to format endpoints
- ✅ **NEW ENDPOINTS SAFE**: Only adding new endpoints, not modifying existing
- ⚠️ **NOTE**: Can enhance placeholder template endpoints later, but format endpoints stay unchanged

---

## 12. **WebSocket System** 🔴 **CRITICAL**

### **Files: DO NOT MODIFY**
- `backend/src/index.ts` - WebSocket server setup
- `backend/src/services/transcriptionService.ts` - AWS Transcribe integration
- `frontend/src/hooks/useTranscription.ts` - WebSocket client

### **Key Components**
- WebSocket server: `ws://localhost:3001/ws/transcription`
- Audio capture: `getUserMedia()` → `AudioContext` → `ScriptProcessor`
- AWS Transcribe: Streaming transcription service
- Real-time updates: Partial results forwarded to frontend

### **⚠️ Migration Impact**
- ✅ **WEBSOCKET SAFE**: No changes needed
- ✅ **NO CHANGES NEEDED**: Audio capture and transcription continue working
- ⚠️ **NOTE**: Transcription system is completely independent of templates

---

## ✅ **Safe Migration Changes**

### **What CAN Be Modified**

1. **Frontend Template Context** (`frontend/src/contexts/TemplateContext.tsx`)
   - ✅ Add API fetching with static fallback
   - ✅ Map database schema to `TemplateConfig` format

2. **Template Management Page** (`frontend/src/pages/TemplateCombinationManagement.tsx`)
   - ✅ Can show database templates
   - ✅ Can save templates to database (optional)

3. **New Database Table** (`backend/src/database/schema.ts`)
   - ✅ Add `template_combinations` table schema

4. **New API Endpoints** (`backend/src/index.ts` or `backend/src/routes/templateCombinations.ts`)
   - ✅ Add `/api/template-combinations` endpoints
   - ✅ Add template combination service

5. **Data Migration Script** (`backend/scripts/migrate-template-combinations.ts`)
   - ✅ Script to migrate static configs to database

### **What MUST Stay Unchanged**

1. **ProcessingOrchestrator** - No changes
2. **Format API Endpoints** - No changes
3. **Layer System** - No changes
4. **Language System** - No changes
5. **Backend Template Manager** - No changes
6. **Formatter Services** - No changes
7. **Section/Mode Managers** - No changes
8. **WebSocket System** - No changes
9. **Existing Database Tables** - No schema changes

---

## 📋 **Migration Safety Checklist**

Before starting migration, verify:

- [ ] No changes to `ProcessingOrchestrator.ts`
- [ ] No changes to format endpoints (`/api/format/*`)
- [ ] No changes to layer files (`LayerManager.ts`, `UniversalCleanupLayer.ts`, etc.)
- [ ] No changes to language system (`uiStore.ts`, language selectors)
- [ ] No changes to backend template manager (`backend/src/config/templates.ts`)
- [ ] No changes to formatter services (`mode2.ts`, `historyEvolution.ts`, etc.)
- [ ] No changes to section/mode managers
- [ ] No changes to WebSocket system
- [ ] Only adding new database table (not modifying existing)
- [ ] Only adding new API endpoints (not modifying existing)
- [ ] Frontend template loading has static fallback
- [ ] All existing functionality tested after migration

---

## 🚨 **Emergency Rollback Plan**

If migration causes issues:

1. **Disable API fetching in frontend**
   ```typescript
   // frontend/src/contexts/TemplateContext.tsx
   const loadTemplateCombinations = async () => {
     // Force static config fallback
     return TEMPLATE_CONFIGS.filter(template => template.isActive);
   };
   ```

2. **Drop new database table** (if needed)
   ```sql
   DROP TABLE IF EXISTS template_combinations;
   ```

3. **Revert frontend changes**
   ```bash
   git revert <migration-commit>
   ```

---

**End of Critical Systems Protection Plan**

