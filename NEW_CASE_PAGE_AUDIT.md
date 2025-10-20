# New Case Page Audit Report

## Executive Summary

This audit examines the current "New Case" page structure at `http://localhost:5173/case/new` to understand how it's organized, how it integrates with the rest of the platform, and how it can be enhanced to create a unified JSON-based case management system that integrates with the dictation functionality.

## Current Architecture Overview

### 1. Page Structure & Components

#### Main Components
- **NewCasePage.tsx** - Main page component
- **SecondarySectionNav.tsx** - Left sidebar navigation for CNESST sections
- **SectionForm.tsx** - Dynamic form component for each section
- **DictationPanel.tsx** - Right panel for audio-required sections
- **ExportModal.tsx** - Export functionality modal

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    App Header & Navigation                  │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Secondary  │              Main Form Area                   │
│  Section    │                                               │
│  Navigation │                                               │
│             │                                               │
│             │                                               │
├─────────────┼───────────────────────────────────────────────┤
│             │              Dictation Panel                  │
│             │            (Audio Required Only)              │
└─────────────┴───────────────────────────────────────────────┘
```

### 2. CNESST Form 204 Sections

The system supports 15 CNESST sections defined in `constants.ts`:

#### Non-Audio Sections (Basic Forms)
- **Section A**: Worker Information
- **Section B**: Physician Information  
- **Section C**: Report
- **Section Mandat**: Evaluation Mandate
- **Section Diagnostics**: CNESST Accepted Diagnoses
- **Section Modalité**: Interview Modality
- **Section 9**: Current Medication and Therapeutic Measures
- **Section 10**: Fact History and Evolution
- **Section 12**: Imaging and Additional Examinations
- **Section 13**: Discussion/Analysis
- **Section 14**: Conclusions
- **Section 15**: Physician Signature and Identification

#### Audio-Required Sections (Enhanced with Dictation)
- **Section 7**: Identification (Enhanced with merge functionality)
- **Section 8**: History (Single large text area)
- **Section 11**: Physical Examination

### 3. State Management

#### Case Store (Zustand)
```typescript
interface Section {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  data: Record<string, any>;
  lastModified: string;
  audioRequired: boolean;
}
```

**Key Features:**
- Persistent storage using Zustand persist middleware
- Auto-save functionality (2-second delay)
- Section status tracking
- Timestamp management

### 4. Form Structure Analysis

#### Section 7 (Enhanced - Identification)
**Current Structure:**
- Main Content (textarea)
- Patient Verbatim (textarea)
- Radiologist Verbatim (textarea)
- AI Merge functionality (combines all three)

**Template Integration:**
- Uses `section7.json` template with structured sections
- Voice triggers for different content types
- Validation rules and formatting requirements

#### Section 8 (History)
**Current Structure:**
- Single large textarea for content
- Uses `section8.json` template
- Comprehensive voice command support
- Pain scale integration
- Quality of life impact tracking

#### Section 11 (Physical Examination)
**Current Structure:**
- Uses `section11.json` template
- Medical summary sections
- Diagnostic tracking
- Consolidation date management
- Impairment percentage tables
- Work capacity evaluation

#### Default Sections (A, B, C, etc.)
**Current Structure:**
- Patient Name (input)
- Date of Birth (date input)
- Main Diagnosis (textarea)
- Observations and Notes (textarea)
- Additional Notes (textarea)

### 5. Dictation Integration

#### DictationPanel Component
- **Purpose**: Provides access to dictation functionality for audio-required sections
- **Navigation**: Redirects to `/dictation` page
- **Context**: Shows current section title
- **Features**: Real-time transcription info, AI accuracy stats

#### Current Integration Gap
- **Issue**: Dictation page operates independently
- **Problem**: No direct data flow between dictation and case forms
- **Opportunity**: Need unified session management

### 6. Backend API Analysis

#### Current API Endpoints
- **Templates**: `/api/templates/*` - Template management (archived)
- **Formatting**: `/api/format/*` - Content formatting services
- **Sessions**: `/api/sessions/*` - Session management (placeholder)
- **Export**: `/api/export/*` - Export functionality (placeholder)

#### Missing Case Management APIs
- No dedicated case CRUD endpoints
- No case-to-session linking
- No unified case data persistence
- No case export functionality

### 7. Template System Analysis

#### Existing Templates
1. **section7.json** - History of facts and evolution
2. **section8.json** - Subjective questionnaire  
3. **section11.json** - Medical conclusions
4. **history-evolution.json** - Evolution history
5. **wordForWordTemplate.json** - Word-for-word formatter

#### Template Structure
```json
{
  "id": "template_id",
  "section": "section_number",
  "name": "Template Name",
  "content": {
    "structure": {
      "title": "Section Title",
      "sections": [
        {
          "name": "section_name",
          "title": "Section Title",
          "template": "Template text with [PLACEHOLDERS]",
          "required": true,
          "voice_triggers": ["trigger1", "trigger2"]
        }
      ]
    },
    "voice_commands": [...],
    "formatting_rules": {...},
    "validation_rules": {...}
  }
}
```

## Integration Opportunities

### 1. Unified Case JSON Structure

**Proposed Case Schema:**
```json
{
  "caseId": "case_12345",
  "patientInfo": {
    "name": "Patient Name",
    "dateOfBirth": "1990-01-01",
    "diagnosis": "Main diagnosis"
  },
  "sections": {
    "section_a": {
      "status": "completed",
      "data": {...},
      "lastModified": "2024-01-01T10:00:00Z"
    },
    "section_7": {
      "status": "in_progress", 
      "data": {
        "mainContent": "...",
        "patientVerbatim": "...",
        "radiologistVerbatim": "...",
        "mergedContent": "..."
      },
      "dictationSessions": ["session_1", "session_2"],
      "lastModified": "2024-01-01T10:00:00Z"
    }
  },
  "metadata": {
    "createdAt": "2024-01-01T09:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "language": "fr",
    "physician": "Dr. Smith"
  }
}
```

### 2. Session-to-Case Integration

**Current State:**
- Dictation sessions are independent
- No case context in dictation
- No automatic saving to case sections

**Proposed Integration:**
- Link dictation sessions to specific case sections
- Auto-populate case forms from dictation results
- Real-time sync between dictation and case data

### 3. Enhanced Form Templates

**Current Limitations:**
- Static form structures
- Limited validation
- No dynamic field generation

**Proposed Enhancements:**
- Dynamic form generation from templates
- Real-time validation
- Conditional field display
- Voice command integration

## Recommendations

### Phase 1: Foundation (Immediate)
1. **Create Case Management API**
   - `POST /api/cases` - Create new case
   - `GET /api/cases/:id` - Get case data
   - `PUT /api/cases/:id` - Update case
   - `DELETE /api/cases/:id` - Delete case

2. **Implement Case Store Enhancement**
   - Add case-level state management
   - Implement case persistence
   - Add case-to-session linking

3. **Create Unified Case JSON Schema**
   - Define comprehensive case structure
   - Implement validation rules
   - Add metadata tracking

### Phase 2: Integration (Short-term)
1. **Dictation-Case Integration**
   - Link dictation sessions to case sections
   - Auto-populate forms from dictation
   - Real-time data synchronization

2. **Enhanced Form System**
   - Dynamic form generation from templates
   - Conditional field display
   - Advanced validation

3. **Export Functionality**
   - PDF generation from case data
   - DOCX export with formatting
   - JSON export for data portability

### Phase 3: Advanced Features (Medium-term)
1. **Template Management System**
   - Dynamic template creation
   - Template versioning
   - Template sharing

2. **Advanced Dictation Features**
   - Section-specific voice commands
   - Context-aware transcription
   - Multi-language support

3. **Analytics and Reporting**
   - Case completion tracking
   - Performance metrics
   - Usage analytics

## Technical Implementation Notes

### 1. Database Schema
```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY,
  patient_info JSONB,
  sections JSONB,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE case_sessions (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(id),
  section_id VARCHAR(50),
  session_data JSONB,
  created_at TIMESTAMP
);
```

### 2. API Endpoints Structure
```
/api/cases
├── GET /                    # List cases
├── POST /                   # Create case
├── GET /:id                 # Get case
├── PUT /:id                 # Update case
├── DELETE /:id              # Delete case
├── POST /:id/sections/:section  # Update section
└── POST /:id/export         # Export case

/api/cases/:id/sessions
├── GET /                    # List sessions for case
├── POST /                   # Create session
└── GET /:sessionId          # Get session data
```

### 3. Frontend State Management
```typescript
interface CaseState {
  currentCase: Case | null;
  sections: Record<string, SectionData>;
  activeSection: string;
  dictationSessions: DictationSession[];
  isDirty: boolean;
  lastSaved: string;
}
```

## Conclusion

The current New Case page provides a solid foundation with:
- ✅ Well-structured section navigation
- ✅ Persistent state management
- ✅ Template-based form generation
- ✅ Dictation panel integration

However, it lacks:
- ❌ Unified case management
- ❌ Session-to-case data flow
- ❌ Comprehensive case persistence
- ❌ Advanced export functionality

The proposed enhancements would transform this into a comprehensive case management system that seamlessly integrates dictation functionality with structured form data, creating a unified JSON-based workflow that supports the complete medical documentation process.

## Next Steps

1. **Immediate**: Implement basic case management API
2. **Short-term**: Create unified case JSON schema
3. **Medium-term**: Integrate dictation with case management
4. **Long-term**: Add advanced features and analytics

This audit provides the foundation for building a comprehensive, integrated case management system that leverages the existing infrastructure while adding the missing pieces for a complete medical documentation workflow.

