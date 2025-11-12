# TechéMD PRD Implementation Plan

**Date**: 2025-01-27  
**Status**: Ready for Review  
**Scope**: Implementation plan for missing PRD features

---

## Quick Summary

**What's Missing**: Admin Dashboard (critical), Analytics Page, Audit Log Page, Case Review Split View, Compliance Validation UI

**What Exists**: Case management, transcription, AI formatting, export, compliance backend, assignment utilities

---

## Priority 1: Admin Dashboard (CRITICAL)

### Current State
- `AdminDashboard.tsx` is a stub ("coming soon")
- Assignment utilities exist (`adminCaseAssignment.ts`) but not connected to UI

### Required Components

1. **Incoming Cases Queue** (Table)
   - List of new cases awaiting assignment
   - Columns: Case ID, Worker Name, Injury Date, Source, Actions
   - "Assign" button opens assignment modal

2. **Doctor Workload Widget** (Card)
   - Shows cases per doctor
   - Capacity indicator (e.g., "Dr. Durusso: 5/10 cases")
   - Click to see doctor's case list

3. **Compliance Alerts Panel** (Card)
   - Auto-generated flags count
   - Missing required fields
   - Incomplete diagnoses
   - Click to see flagged cases

4. **Case Assignment Modal**
   - Doctor dropdown
   - Priority selector (High/Medium/Low)
   - Assign button
   - Uses existing `assignCaseToDoctors()` utility

5. **Kanban Board View** (Tab/View)
   - Columns: New → In Progress → In Review → Submitted
   - Drag-and-drop or click-to-move
   - Case cards show: ID, worker name, assigned doctor, status

6. **Upload New Case** (Button + Form)
   - PDF upload (mock for prototype)
   - Metadata form: Worker Name, Injury Date, Case Type
   - Submit creates case in "New" status

### Implementation Steps

**IMPORTANT**: All new components - do NOT modify existing ReviewCasesPage or caseStore status logic

```typescript
// 1. Create Admin Dashboard structure (NEW FILE)
frontend/src/pages/AdminDashboard.tsx
  - Tabs: Queue | Kanban | Analytics
  - Import existing assignment utilities
  - DO NOT import or modify ReviewCasesPage

// 2. Create queue component (NEW FILE)
frontend/src/components/admin/IncomingCasesQueue.tsx
  - Table with cases
  - Filter by status
  - Assign button
  - Uses adminCaseAssignment.ts (separate from caseStore)

// 3. Create workload widget (NEW FILE)
frontend/src/components/admin/DoctorWorkloadWidget.tsx
  - Card showing doctor stats
  - Uses getAllAssignments() from adminCaseAssignment.ts
  - Separate from ReviewCasesPage "in_progress" tab

// 4. Create compliance alerts (NEW FILE)
frontend/src/components/admin/ComplianceAlertsPanel.tsx
  - Count of flags
  - List of flagged cases
  - Link to case details

// 5. Create assignment modal (NEW FILE)
frontend/src/components/admin/CaseAssignmentModal.tsx
  - Doctor selector
  - Priority selector
  - Calls assignCaseToDoctors() (uses separate status types)

// 6. Create kanban board (NEW FILE)
frontend/src/components/admin/KanbanBoard.tsx
  - 4 columns (New, In Progress, In Review, Submitted)
  - Case cards
  - Status update on move
  - Uses adminCaseAssignment status (NOT caseStore status)

// 7. Create upload form (NEW FILE)
frontend/src/components/admin/UploadCaseForm.tsx
  - PDF upload (mock)
  - Metadata fields
  - Creates case via API or mock service
  - Does NOT affect existing case creation flow
```

**Status Separation Strategy**:
- Admin workflow uses: `pending_review`, `assigned`, `in_review`, `submitted` (from adminCaseAssignment.ts)
- Doctor workflow uses: `draft`, `in_progress`, `completed` (from caseStore.ts - UNTOUCHED)
- These are separate status systems that don't interfere

**Estimated Time**: 5-7 days

---

## Priority 2: Doctor Dashboard Enhancements

### Current State
- Basic dashboard exists
- Only shows "Start Dictation" card

### Required Components

1. **Active Cases Card**
   - Count of active cases
   - Link to filtered case list

2. **In Review Card**
   - Count of cases in review
   - Link to filtered case list

3. **Ready to Submit Card**
   - Count of completed cases
   - Link to submission page

### Implementation Steps

```typescript
// 1. Create dashboard cards
frontend/src/components/dashboard/ActiveCasesCard.tsx
frontend/src/components/dashboard/InReviewCard.tsx
frontend/src/components/dashboard/ReadyToSubmitCard.tsx

// 2. Update DashboardCards.tsx
  - Add new cards
  - Fetch case counts from API or mock data
  - Link to filtered ReviewCasesPage
```

**Estimated Time**: 2-3 days

---

## Priority 3: Case Review Split View

### Current State
- Case editing exists but not in split view
- Section 7 has AI summary (editable)
- RAG exists but not in citation window

### Required Layout

```
┌─────────────┬──────────────────┬─────────────┐
│   Docs      │  Section 7       │  Citations  │
│   List      │  AI Summary      │  Window     │
│             │  (Editable)      │  (RAG)      │
└─────────────┴──────────────────┴─────────────┘
```

### Implementation Steps

```typescript
// 1. Create split view page
frontend/src/pages/CaseReviewPage.tsx
  - Three-column layout
  - Responsive (stacks on mobile)

// 2. Create document list
frontend/src/components/case/DocumentList.tsx
  - Shows uploaded PDFs
  - Mock data for prototype
  - Upload button

// 3. Create citation window
frontend/src/components/case/CitationWindow.tsx
  - Connect to existing RAG
  - Show citations for Section 7
  - Placeholder data for prototype

// 4. Update Section 7 component
frontend/src/components/case/sections/Section07.tsx
  - Ensure editable rich text
  - Works in split view layout
```

**Estimated Time**: 3-4 days

---

## Priority 4: Compliance Validation UI

### Current State
- Backend compliance exists (`legalVerification.ts`)
- No frontend validation UI

### Required Components

1. **"Validate" Button**
   - In case editor footer
   - Calls compliance service
   - Shows validation results

2. **Validation Results Display**
   - List of issues (missing fields, incomplete diagnosis, etc.)
   - Visual indicators (red/yellow/green)
   - "Fix" links to relevant sections

3. **"Generate Report" Gate**
   - Disabled until all checks pass
   - Shows "All Checks Passed" message when ready

4. **Compliance Modal** (Admin)
   - List of all flags
   - Approve/reject buttons
   - Audit trail

### Implementation Steps

```typescript
// 1. Create validation component
frontend/src/components/case/ComplianceValidator.tsx
  - Validation button
  - Results display
  - Uses existing legalVerification service

// 2. Update case editor footer
frontend/src/components/case/CaseEditorFooter.tsx
  - Add "Validate" button
  - Gate "Generate Report" button
  - Show validation status

// 3. Create compliance modal
frontend/src/components/admin/ComplianceModal.tsx
  - Flags list
  - Approve/reject actions
  - Audit logging
```

**Estimated Time**: 2-3 days

---

## Priority 5: Analytics Page

### Current State
- Template analytics exist
- No case-level analytics

### Required Components

1. **Cases per Status Chart**
   - Bar or pie chart
   - Status breakdown

2. **Average Completion Time**
   - Metric card
   - Time from creation to submission

3. **Doctor Performance Table**
   - Cases completed per doctor
   - Average time per doctor

4. **Admin Intake Trends**
   - Cases per day/week
   - Line chart

### Implementation Steps

```typescript
// 1. Create analytics page
frontend/src/pages/AnalyticsPage.tsx
  - Tabs: Overview | Doctors | Trends

// 2. Create chart components
frontend/src/components/analytics/CaseStatusChart.tsx
frontend/src/components/analytics/CompletionTimeMetric.tsx
frontend/src/components/analytics/DoctorPerformanceTable.tsx
frontend/src/components/analytics/IntakeTrendsChart.tsx

// 3. Create backend endpoints (if needed)
backend/src/routes/analytics.ts
  - GET /api/analytics/cases
  - GET /api/analytics/doctors
  - GET /api/analytics/trends
```

**Estimated Time**: 3-4 days

---

## Priority 6: Audit Log Page

### Current State
- Backend audit logging exists (`audit_logs` table)
- No frontend page

### Required Components

1. **Audit Log List**
   - Scrollable table
   - Columns: Timestamp, User, Action, Resource, Details

2. **Filters**
   - By user
   - By date range
   - By action type
   - By resource type

3. **Export**
   - CSV download
   - JSON download

### Implementation Steps

```typescript
// 1. Create audit log page
frontend/src/pages/AuditLogPage.tsx
  - Table with audit entries
  - Filters sidebar
  - Export button

// 2. Create audit log components
frontend/src/components/audit/AuditLogList.tsx
frontend/src/components/audit/AuditLogFilters.tsx

// 3. Create backend endpoint
backend/src/routes/audit.ts
  - GET /api/audit/logs
  - Query params: userId, startDate, endDate, action, resourceType
```

**Estimated Time**: 2-3 days

---

## Priority 7: Mock Data Layer (For Prototype)

### Purpose
Enable v0.dev prototype demo without backend dependency

### Required Components

1. **Mock Cases JSON**
   - Sample cases matching PRD schema
   - Case 2024-102, etc.

2. **Mock Data Service**
   - Mimics backend API
   - Feature flag to switch real/mock

3. **Mock Document Uploads**
   - Simulated PDFs
   - Base64 placeholders

4. **Mock AI Summaries**
   - Pre-generated Section 7 summaries
   - Pre-generated Section 8 dictations

### Implementation Steps

```typescript
// 1. Create mock data
frontend/src/data/mockCases.json
  - Array of case objects
  - Matches PRD schema

// 2. Create mock service
frontend/src/services/mockDataService.ts
  - getCases()
  - getCase(id)
  - assignCase()
  - updateCaseStatus()
  - etc.

// 3. Add feature flag
frontend/src/lib/featureFlags.ts
  - USE_MOCK_DATA: boolean

// 4. Update API calls
  - Check flag
  - Use mock service if enabled
  - Use real API if disabled
```

**Estimated Time**: 2-3 days

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| **Week 1** | Admin Dashboard | Queue, Workload, Alerts, Assignment, Kanban |
| **Week 2** | Doctor Dashboard + Case Review | Cards, Split View, Document List, Citations |
| **Week 3** | Compliance + Analytics | Validation UI, Analytics Page, Audit Log |
| **Week 4** | Mock Data + Polish | Mock service, Report Preview, Demo polish |

**Total Estimated Time**: 4 weeks (20-25 days)

---

## CRITICAL: Do Not Break Existing Functionality

### Pages/Components to PRESERVE (DO NOT MODIFY)
- **`ReviewCasesPage.tsx`** - Working "in_progress" tab must remain untouched
- **`caseStore.ts`** - Existing case status workflow (`in_progress`, `completed`, `draft`)
- **`SecondarySectionNav.tsx`** - Case navigation and status management
- **`SectionForm.tsx`** - Section editing with status tracking
- **`RecentCasesCard.tsx`** - Recent cases display
- **Backend case status API** - `/api/cases/:id/status` endpoint

### Implementation Strategy
- **Create NEW components** for admin features
- **Create NEW pages** (AdminDashboard, AnalyticsPage, AuditLogPage)
- **Extend existing stores** only if necessary (add new methods, don't modify existing)
- **Use feature flags** to gate new functionality
- **Test existing workflows** after each change

### Status Compatibility
- Admin Dashboard will use **separate status tracking** for admin workflow
- Doctor "in_progress" cases remain in `ReviewCasesPage` unchanged
- Admin assignment status (`pending_review`, `assigned`, etc.) is separate from case editing status
- No changes to existing `status: 'in_progress'` logic in caseStore

---

## Technical Notes

### Existing Utilities to Leverage
- `adminCaseAssignment.ts` - Case assignment logic (already uses separate status types)
- `legalVerification.ts` - Compliance checking
- `exportUtils.ts` - PDF/DOCX export
- `caseStore.ts` - Case state management (read-only for new features)

### New Services Needed
- `adminService.ts` - Admin-specific API calls (NEW, doesn't touch existing)
- `analyticsService.ts` - Analytics data fetching (NEW)
- `auditService.ts` - Audit log retrieval (NEW)
- `mockDataService.ts` - Mock data layer (NEW)

### Backend Endpoints Needed (NEW, won't affect existing)
- `GET /api/admin/cases/queue` - Incoming cases
- `GET /api/admin/workload` - Doctor workload
- `GET /api/admin/compliance/flags` - Compliance alerts
- `GET /api/analytics/cases` - Case analytics
- `GET /api/analytics/doctors` - Doctor performance
- `GET /api/audit/logs` - Audit log entries

---

## Acceptance Criteria

### Admin Dashboard
- [ ] Admin can see incoming cases queue
- [ ] Admin can assign cases to doctors
- [ ] Admin can view doctor workload
- [ ] Admin can see compliance alerts
- [ ] Admin can view cases in Kanban board
- [ ] Admin can upload new cases

### Doctor Dashboard
- [ ] Doctor sees active cases count
- [ ] Doctor sees in-review cases count
- [ ] Doctor sees ready-to-submit cases count

### Case Review
- [ ] Split view shows docs | summary | citations
- [ ] Documents can be uploaded/viewed
- [ ] Citations window shows RAG results
- [ ] Section 7 summary is editable

### Compliance
- [ ] "Validate" button checks compliance
- [ ] Validation results are displayed
- [ ] "Generate Report" is gated by validation
- [ ] Admin can approve/reject flags

### Analytics
- [ ] Cases per status chart displays
- [ ] Average completion time shows
- [ ] Doctor performance table shows
- [ ] Intake trends chart displays

### Audit Log
- [ ] Audit log page shows entries
- [ ] Filters work (user/date/action)
- [ ] Export works (CSV/JSON)

---

## Getting Started

1. **Review this plan** with stakeholders
2. **Create feature branch**: `feat/admin-dashboard-phase1`
3. **Start with Admin Dashboard** (Priority 1)
4. **Iterate** based on feedback

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-01-27

