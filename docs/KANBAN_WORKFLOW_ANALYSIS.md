# Kanban Board Workflow Analysis

**Date**: 2025-01-27  
**Status**: Analysis & Recommendations

---

## Current Implementation Status

### ✅ What's Working
- **Click-to-move buttons**: Cases can be moved between columns using "Start", "Mark In Review", "Submit" buttons
- **Status updates**: Moving a case updates its status in localStorage
- **Real-time refresh**: Components update when cases are moved
- **Case details modal**: Clicking a card shows case information

### ❌ What's Missing
- **Drag-and-drop**: Currently only click buttons (PRD says "drag-and-drop or click-to-move")
- **Submitted status tracking**: "Submitted" column is empty (no status mapping)
- **QA workflow**: No explicit QA team role or submission on behalf of doctors
- **Audit trail**: No tracking of who moved/submitted the case

---

## How Kanban Should Work (PRD Requirements)

### Workflow States
1. **New** (pending/pending_review)
   - Cases uploaded but not yet assigned
   - Admin assigns to doctor → moves to "In Progress"

2. **In Progress** (in_progress)
   - Doctor is actively working on the case
   - Doctor completes work → moves to "In Review"

3. **In Review** (completed)
   - Case is completed by doctor, awaiting QA/admin review
   - QA/Admin reviews and approves → moves to "Submitted"

4. **Submitted** (submitted - NEW STATUS NEEDED)
   - Case has been submitted to CNESST/EMR
   - Final state (no further moves)

### Interaction Methods
- **PRD says**: "Drag-and-drop or click-to-move"
- **Current**: Only click-to-move buttons
- **Recommendation**: Add drag-and-drop for better UX (but keep buttons as fallback)

---

## QA Team Workflow Question

### Scenario: QA Team Submitting on Behalf of Doctors

**Current State**: No explicit QA role or workflow

**Proposed Workflow**:
1. Doctor completes case → Status: `completed` → Shows in "In Review" column
2. QA team reviews the case:
   - Can view case details
   - Can see compliance flags
   - Can approve/reject
3. QA team submits on behalf of doctor:
   - Moves case from "In Review" → "Submitted"
   - Records: `submittedBy: 'qa-user-id'`, `submittedAt: timestamp`
   - Status: `submitted` (new status)

**Implementation Needs**:
- New status: `submitted` in `adminCaseAssignment.ts`
- Track `submittedBy` field (who submitted: doctor or QA)
- QA role permissions (can submit on behalf of doctors)
- Audit log entry for submission

---

## Recommendations

### 1. Add Drag-and-Drop (Priority: Medium)
- Use a library like `@dnd-kit/core` or `react-beautiful-dnd`
- Keep click buttons as fallback
- Better UX for power users

### 2. Implement Submitted Status (Priority: High)
- Add `submitted` to status types
- Map "Submitted" column to `submitted` status
- Add submission tracking (`submittedBy`, `submittedAt`)

### 3. QA Workflow Support (Priority: High)
- Add `submittedBy` field to track who submitted
- Allow QA role to submit on behalf of doctors
- Add audit log entry for submissions

### 4. Enhanced Case Details (Priority: Low)
- Show submission history
- Show who moved case between columns
- Show timestamps for each status change

---

## Proposed Status Flow

```
New (pending/pending_review)
  ↓ [Admin assigns to doctor]
In Progress (in_progress)
  ↓ [Doctor completes work]
In Review (completed)
  ↓ [QA/Admin reviews and submits]
Submitted (submitted) ← NEW STATUS
```

---

## Implementation Plan

### Phase 1: Fix Submitted Status (1-2 hours)
1. Add `submitted` to `AssignedCase['status']` type
2. Update `updateCaseStatus` to handle `submitted`
3. Map "Submitted" column to `submitted` status
4. Add "Submit" button in "In Review" column

### Phase 2: Add Submission Tracking (2-3 hours)
1. Add `submittedBy?: string` to `AssignedCase` interface
2. Add `submittedAt?: string` to `AssignedCase` interface
3. Update submission logic to record these fields
4. Display submission info in case details

### Phase 3: Add Drag-and-Drop (4-6 hours)
1. Install drag-and-drop library
2. Implement drag handlers
3. Keep click buttons as fallback
4. Test on mobile (may need touch handlers)

### Phase 4: QA Role Support (2-3 hours)
1. Check user role (doctor vs QA vs admin)
2. Show/hide submit button based on role
3. Record `submittedBy` with user ID
4. Add audit log entry

---

## Questions to Answer

1. **Should admins be able to drag-and-drop?**
   - **Answer**: Yes, for better UX. Drag-and-drop is more intuitive than clicking buttons.

2. **Is the Kanban fully functional?**
   - **Answer**: Partially. It works for moving cases forward, but:
     - No drag-and-drop (only buttons)
     - "Submitted" column doesn't work (no status mapping)
     - No submission tracking

3. **How should QA team submit on behalf of doctors?**
   - **Answer**: 
     - QA reviews cases in "In Review" column
     - QA clicks "Submit" button (or drags to "Submitted")
     - System records `submittedBy: 'qa-user-id'`
     - Case moves to "Submitted" column with `submitted` status
     - Audit log records: "Case submitted by QA team member X on behalf of Dr. Y"

---

## Next Steps

1. **Clarify requirements** with stakeholders:
   - Do we need drag-and-drop or are buttons sufficient?
   - Should QA be able to submit on behalf of doctors?
   - Do we need to track who submitted?

2. **Implement submitted status** (quick win)

3. **Add drag-and-drop** (if approved)

4. **Add QA workflow** (if needed)

---

**Document Status**: Analysis Complete - Awaiting Decisions

