# TechéMD PRD Gap Analysis & Implementation Plan

**Date**: 2025-01-27  
**Status**: Analysis Complete  
**Scope**: Compare PRD v1.2 requirements against current codebase

---

## Executive Summary

The codebase has **strong foundations** in transcription, case editing, and compliance infrastructure, but is **missing critical Admin Dashboard features** and several PRD-specific workflows. This document identifies gaps and provides a prioritized implementation plan.

---

## What's Already Implemented

### Core Infrastructure
- **Authentication & Routing**: Login page, protected routes, role-based access
- **Case Management**: Case creation, editing, section-based workflow (13 sections)
- **Transcription System**: Full dictation pipeline with multiple modes
- **AI Formatting**: Section 7 & 8 AI summarization and formatting
- **Export Functionality**: PDF/DOCX export capabilities
- **Compliance Layer**: Law 25/PIPEDA/HIPAA infrastructure (backend)
- **Audit Logging**: Database schema and backend logging infrastructure
- **Bilingual Support**: French/English language switching
- **Review Cases Page**: Basic case review interface

### Backend Services
- Compliance scrubbing and PHI protection
- Legal verification service (mock/real)
- Case controller with CRUD operations
- Template management system
- Analytics endpoints (template usage stats)

---

## Missing Features (PRD Requirements)

### 1. Admin Dashboard (CRITICAL - Currently Stub)

**Current State**: `AdminDashboard.tsx` is a placeholder with "coming soon" message

**PRD Requirements**:
- **Incoming Cases Queue** table (new cases awaiting assignment)
- **Doctor Workload Widget** (cases per doctor, capacity tracking)
- **Compliance Alerts Panel** (auto-generated flags, missing fields)
- **Case Assignment UI** (assign cases to doctors with priority)
- **Kanban View** (New → In Progress → In Review → Submitted)
- **Case Reassignment** (change doctor assignment)
- **Upload New Case** button with metadata form (worker name, date, type)
- **Archive Case** functionality (Law 25 retention simulation)

**Impact**: **HIGH** - Core admin workflow is non-functional

---

### 2. Doctor Dashboard Enhancements (MEDIUM)

**Current State**: Basic dashboard with minimal cards

**PRD Requirements**:
- **Overview Cards**: "Active Cases", "In Review", "Ready to Submit" (with counts)
- **Sidebar Navigation**: "My Cases", "New Dictation", "Analytics" (partially exists)
- **Case Status Filtering**: Filter by status (Active, In Review, Ready to Submit)

**Impact**: **MEDIUM** - Doctor workflow is functional but lacks PRD-specified overview

---

### 3. Case Review Split View (MEDIUM)

**PRD Requirements**:
- **Split View Layout**: 
  - Left: Uploaded docs list (mocked)
  - Middle: Section 7 AI Summary (editable rich text) - *Partially exists*
  - Right: Citation window (placeholder data)
- **Document Upload List**: Show uploaded PDFs/documents per case
- **Citation Window**: Placeholder for RAG citations (RAG exists but not in split view)

**Current State**: Case editing exists but not in PRD-specified split view format

**Impact**: **MEDIUM** - UX doesn't match PRD specification

---

### 4. Compliance Validation UI (MEDIUM)

**PRD Requirements**:
- ❌ **"Validate" Button**: Highlights missing required fields, incomplete diagnosis, missing signature
- ❌ **Compliance Check Results**: Visual display of validation issues
- ❌ **"All Checks Passed" Gate**: Unlocks "Generate Report" button
- ❌ **Compliance Modal**: Flags list + checkbox to approve (for admins)

**Current State**: Backend compliance exists, but no frontend validation UI

**Impact**: **MEDIUM** - Compliance checks exist but not user-visible

---

### 5. CNESST Submission (LOW - Partially Exists)

**PRD Requirements**:
- **"Submit to CNESST" Button**: Stub that changes status to "Submitted" - *Exists in ReviewCasesPage*
- **Submission Log Entry**: "Case #2024-102 submitted by Dr Durusso – 11:42 AM EST" - *Backend logging exists, but not visible in UI*
- **Submission Status Tracking**: Visual indicator of submission state

**Current State**: Button exists but no status tracking UI

**Impact**: **LOW** - Basic functionality exists, needs polish

---

### 6. Analytics Page (MEDIUM)

**PRD Requirements**:
- **Cases per Status Chart**: Visual breakdown of case statuses
- **Average Completion Time**: Metric display
- **Doctor Performance Metrics**: Cases completed per doctor
- **Admin Analytics**: Case intake trends, compliance pass rates

**Current State**: Template analytics exist, but no case-level analytics

**Impact**: **MEDIUM** - Analytics infrastructure exists but not applied to cases

---

### 7. Audit Log Page (HIGH - For Compliance)

**PRD Requirements**:
- **Audit Log Page**: Simple scrollable list of audit events
- **Filter by User/Date/Action**: Search and filter capabilities
- **Export Audit Log**: Download audit trail for compliance

**Current State**: Backend audit logging exists, but no frontend page

**Impact**: **HIGH** - Required for Law 25 compliance demonstration

---

### 8. Report Preview Modal (LOW)

**PRD Requirements**:
- **Report Preview Modal**: Mock PDF generator preview before export
- **Preview All Sections**: Show formatted report before download

**Current State**: Export exists but no preview

**Impact**: **LOW** - Nice-to-have for demo

---

### 9. Mock Data Layer (MEDIUM - For Prototype)

**PRD Requirements**:
- **Mock Case Data**: JSON file with sample cases (2024-102, etc.)
- **Mock Document Uploads**: Simulated PDF uploads
- **Mock AI Summaries**: Pre-generated Section 7 summaries
- **Mock Compliance Flags**: Sample validation issues

**Current State**: Uses real backend, no mock data layer for prototype

**Impact**: **MEDIUM** - Needed for v0.dev prototype demo without backend

---

### 10. Case Data Model Alignment (LOW)

**PRD Requirements**:
```json
{
  "case_id": "2024-102",
  "worker_name": "Jean Tremblay",
  "injury_date": "2023-10-07",
  "assigned_doctor": "Dr. Harry Durusso",
  "status": "In Progress",
  "sections": {
    "7": { "summary": "AI generated text", "validated": true },
    "8": { "dictation": "transcribed text", "validated": true }
  },
  "compliance": {
    "law25": true,
    "pipeda": true,
    "flags": []
  },
  "timeline": [
    { "event": "case_uploaded", "timestamp": "2024-10-07T10:22:00Z" },
    { "event": "assigned", "user": "admin", "timestamp": "2024-10-07T11:05:00Z" }
  ]
}
```

**Current State**: Case data model exists but may not match PRD schema exactly

**Impact**: **LOW** - Data model likely compatible, needs verification

---

## CRITICAL: Preserve Existing Functionality

### Pages/Components That Must NOT Be Modified
- **`ReviewCasesPage.tsx`** - Working "in_progress" tab (lines 551-596) - DO NOT TOUCH
- **`caseStore.ts`** - Existing status workflow (`draft`, `in_progress`, `completed`) - READ ONLY
- **`SecondarySectionNav.tsx`** - Case navigation - DO NOT MODIFY
- **`SectionForm.tsx`** - Section editing - DO NOT MODIFY
- **Backend `/api/cases/:id/status`** - Existing status API - DO NOT MODIFY

### Implementation Strategy
- **Create NEW components only** - No modifications to existing pages
- **Use separate status system** - Admin uses `adminCaseAssignment.ts` status types
- **Feature flags** - Gate new functionality
- **Test existing workflows** - Verify "in_progress" tab still works after each change

---

## Prioritized Implementation Plan

### Phase 1: Critical Admin Features (Week 1)
**Goal**: Make Admin Dashboard functional for case management

1. **Admin Dashboard Core** (3-4 days)
   - Incoming Cases Queue table
   - Doctor Workload Widget
   - Compliance Alerts Panel
   - Case Assignment UI (assign to doctor + priority)

2. **Case Upload & Assignment** (2-3 days)
   - "Upload New Case" button + metadata form
   - PDF upload (mock for prototype)
   - Assign to doctor dropdown
   - Case status management

3. **Kanban View** (2 days)
   - Board with columns: New → In Progress → In Review → Submitted
   - Drag-and-drop or click-to-move
   - Case card details on click

**Files to Create/Modify**:
- `frontend/src/pages/AdminDashboard.tsx` (major rewrite)
- `frontend/src/components/admin/IncomingCasesQueue.tsx` (new)
- `frontend/src/components/admin/DoctorWorkloadWidget.tsx` (new)
- `frontend/src/components/admin/ComplianceAlertsPanel.tsx` (new)
- `frontend/src/components/admin/CaseAssignmentModal.tsx` (new)
- `frontend/src/components/admin/KanbanBoard.tsx` (new)
- `frontend/src/services/adminService.ts` (new - mock data layer)

---

### Phase 2: Doctor Dashboard & Case Review (Week 2)
**Goal**: Enhance doctor workflow to match PRD

1. **Doctor Dashboard Cards** (1-2 days)
   - Active Cases count card
   - In Review count card
   - Ready to Submit count card
   - Link to filtered case lists

2. **Case Review Split View** (2-3 days)
   - Three-panel layout (docs | summary | citations)
   - Document list component (mock uploads)
   - Citation window (connect to existing RAG)
   - Editable Section 7 summary (already exists, needs layout)

3. **Compliance Validation UI** (2 days)
   - "Validate" button in case editor
   - Compliance check results display
   - Visual flags for missing fields
   - "Generate Report" unlock gate

**Files to Create/Modify**:
- `frontend/src/components/dashboard/ActiveCasesCard.tsx` (new)
- `frontend/src/components/dashboard/InReviewCard.tsx` (new)
- `frontend/src/components/dashboard/ReadyToSubmitCard.tsx` (new)
- `frontend/src/pages/CaseReviewPage.tsx` (new - split view)
- `frontend/src/components/case/DocumentList.tsx` (new)
- `frontend/src/components/case/CitationWindow.tsx` (new)
- `frontend/src/components/case/ComplianceValidator.tsx` (new)
- `frontend/src/services/complianceService.ts` (new - frontend validation)

---

### Phase 3: Analytics & Audit (Week 3)
**Goal**: Add reporting and compliance visibility

1. **Analytics Page** (2-3 days)
   - Cases per status chart (bar/pie)
   - Average completion time metric
   - Doctor performance table
   - Admin intake trends

2. **Audit Log Page** (2 days)
   - Scrollable audit log list
   - Filter by user/date/action
   - Export audit log (CSV/JSON)

3. **CNESST Submission Polish** (1 day)
   - Submission status indicator
   - Submission log entry display
   - Status change notifications

**Files to Create/Modify**:
- `frontend/src/pages/AnalyticsPage.tsx` (new)
- `frontend/src/components/analytics/CaseStatusChart.tsx` (new)
- `frontend/src/components/analytics/CompletionTimeMetric.tsx` (new)
- `frontend/src/components/analytics/DoctorPerformanceTable.tsx` (new)
- `frontend/src/pages/AuditLogPage.tsx` (new)
- `frontend/src/components/audit/AuditLogList.tsx` (new)
- `frontend/src/components/audit/AuditLogFilters.tsx` (new)
- `frontend/src/routes/cases.ts` (backend - add analytics endpoints)

---

### Phase 4: Mock Data & Polish (Week 4)
**Goal**: Prototype-ready with mock data

1. **Mock Data Layer** (2 days)
   - JSON file with sample cases (2024-102, etc.)
   - Mock document uploads
   - Pre-generated AI summaries
   - Mock compliance flags

2. **Report Preview Modal** (1 day)
   - PDF preview before export
   - Section-by-section preview

3. **Demo Polish** (2 days)
   - UI/UX refinements
   - Error handling
   - Loading states
   - Bilingual labels

**Files to Create/Modify**:
- `frontend/src/data/mockCases.json` (new)
- `frontend/src/services/mockDataService.ts` (new)
- `frontend/src/components/case/ReportPreviewModal.tsx` (new)
- Update all components for mock data fallback

---

## Implementation Checklist

### Admin Dashboard
- [ ] Incoming Cases Queue table
- [ ] Doctor Workload Widget
- [ ] Compliance Alerts Panel
- [ ] Case Assignment Modal
- [ ] Upload New Case form
- [ ] Kanban Board view
- [ ] Archive Case functionality

### Doctor Dashboard
- [ ] Active Cases card
- [ ] In Review card
- [ ] Ready to Submit card
- [ ] Case status filtering

### Case Review
- [ ] Split view layout (docs | summary | citations)
- [ ] Document list component
- [ ] Citation window
- [ ] Compliance validation UI
- [ ] "Validate" button
- [ ] "Generate Report" unlock gate

### Analytics
- [ ] Cases per status chart
- [ ] Average completion time
- [ ] Doctor performance metrics
- [ ] Admin intake trends

### Audit & Compliance
- [ ] Audit Log page
- [ ] Audit log filters
- [ ] Export audit log
- [ ] Compliance modal (admin)

### Submission & Export
- [ ] CNESST submission status tracking
- [ ] Submission log display
- [ ] Report preview modal

### Mock Data
- [ ] Mock cases JSON
- [ ] Mock document uploads
- [ ] Mock AI summaries
- [ ] Mock compliance flags

---

## 🔧 Technical Considerations

### Mock Data Strategy
- Use feature flag to switch between real backend and mock data
- Store mock data in `frontend/src/data/` directory
- Create `MockDataService` that mimics backend API structure
- Enable easy toggle for demo vs. production

### State Management
- Use existing `caseStore` for case data
- Create `adminStore` for admin-specific state
- Use `uiStore` for compliance validation state

### Backend Integration
- Most backend endpoints exist
- May need new endpoints for:
  - Admin case assignment
  - Analytics aggregation
  - Audit log retrieval
  - Compliance validation (frontend-friendly)

### UI Components
- Leverage existing shadcn/ui components
- Use existing design system (CNESST green theme)
- Maintain bilingual support throughout

---

## Success Metrics (PRD Alignment)

| KPI | PRD Target | Current Status | Gap |
|-----|-----------|----------------|-----|
| Avg. time to create and submit mock report | ≤ 7 minutes | Unknown | Need measurement |
| Doctor AI acceptance rate ("Keep Summary") | ≥ 70% | Unknown | Need tracking |
| Admin case tracking accuracy | 100% | N/A | Admin dashboard not functional |
| Prototype demo completion with no errors | 95% success | Unknown | Need testing |

---

## Next Steps

1. **Review this gap analysis** with stakeholders
2. **Prioritize phases** based on demo timeline
3. **Create feature branches** for each phase
4. **Implement Phase 1** (Admin Dashboard) first
5. **Iterate** based on feedback

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-01-27

