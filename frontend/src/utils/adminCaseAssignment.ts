/**
 * Utility for managing case assignments from Admin Dashboard to doctors
 * Uses localStorage for persistence (frontend-only for now)
 */

export interface AssignedCase {
  id: string;
  fileId: string;
  fileName: string;
  fileBase64?: string;
  assignedTo: string; // Doctor ID (empty string for unassigned cases)
  assignedBy: string; // Admin ID
  assignedAt: string;
  status: 'pending_review' | 'pending' | 'in_progress' | 'completed' | 'rejected' | 'submitted';
  source: {
    type: 'cnesst' | 'employer' | 'clinic';
    name: string;
  };
  patientName?: string;
  claimId?: string;
  injuryDate?: string;
  // Calendar booking
  scheduledDate?: string; // ISO date string (YYYY-MM-DD)
  scheduledTime?: string; // Time string (HH:mm)
  appointmentStatus?: 'scheduled' | 'completed' | 'cancelled';
  // Archive tracking
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  // Submission tracking
  submittedBy?: string; // User ID who submitted (QA or doctor)
  submittedAt?: string; // Timestamp of submission
  submittedOnBehalfOf?: string; // Doctor ID if submitted by QA
  // QA review tracking
  reviewedBy?: string; // QA user ID who reviewed
  reviewedAt?: string; // Timestamp of review
  reviewNotes?: string; // QA review notes
  supportingDocuments?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
    url?: string;
    size?: number;
    base64?: string;
  }>;
}

const STORAGE_KEY = 'techemd_admin_assignments';

/**
 * Get all assigned cases for a specific doctor
 */
export const getAssignedCasesForDoctor = (doctorId: string): AssignedCase[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allAssignments: AssignedCase[] = JSON.parse(stored);
    return allAssignments.filter(assignment => assignment.assignedTo === doctorId);
  } catch (error) {
    console.error('Error loading assigned cases:', error);
    return [];
  }
};

/**
 * Assign a case to one or more doctors
 * If doctorIds is empty, creates a case with 'pending' status (unassigned)
 */
export const assignCaseToDoctors = (
  fileId: string,
  fileName: string,
  fileBase64: string | undefined,
  doctorIds: string[],
  assignedBy: string,
  source: AssignedCase['source'],
  metadata?: {
    patientName?: string;
    claimId?: string;
    injuryDate?: string;
  }
): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existingAssignments: AssignedCase[] = stored ? JSON.parse(stored) : [];
    
    let newAssignments: AssignedCase[];
    
    if (doctorIds.length === 0) {
      // Create unassigned case (pending queue)
      newAssignments = [{
        id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileId,
        fileName,
        fileBase64,
        assignedTo: '', // Empty string for unassigned
        assignedBy,
        assignedAt: new Date().toISOString(),
        status: 'pending', // Use 'pending' for unassigned cases
        source,
        patientName: metadata?.patientName,
        claimId: metadata?.claimId,
        injuryDate: metadata?.injuryDate,
        supportingDocuments: fileBase64 ? [{
          id: `doc-${fileId}`,
          name: fileName,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          size: fileBase64 ? Math.round(fileBase64.length * 0.75) : 0,
          base64: fileBase64
        }] : []
      }];
    } else {
      // Assign to doctors
      newAssignments = doctorIds.map(doctorId => ({
        id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileId,
        fileName,
        fileBase64,
        assignedTo: doctorId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        status: 'pending_review',
        source,
        patientName: metadata?.patientName,
        claimId: metadata?.claimId,
        injuryDate: metadata?.injuryDate,
        supportingDocuments: fileBase64 ? [{
          id: `doc-${fileId}`,
          name: fileName,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
          size: fileBase64 ? Math.round(fileBase64.length * 0.75) : 0,
          base64: fileBase64
        }] : []
      }));
    }

    const updatedAssignments = [...existingAssignments, ...newAssignments];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssignments));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('assignmentUpdated'));
  } catch (error) {
    console.error('Error assigning case:', error);
    throw error;
  }
};

/**
 * Update case status
 */
export const updateCaseStatus = (
  assignmentId: string,
  status: AssignedCase['status'],
  metadata?: {
    submittedBy?: string;
    submittedOnBehalfOf?: string;
    reviewedBy?: string;
    reviewNotes?: string;
  }
): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const assignments: AssignedCase[] = JSON.parse(stored);
    const updated = assignments.map(a => {
      if (a.id === assignmentId) {
        const update: Partial<AssignedCase> = { status };
        
        // Track submission
        if (status === 'submitted') {
          update.submittedAt = new Date().toISOString();
          if (metadata?.submittedBy) {
            update.submittedBy = metadata.submittedBy;
          }
          if (metadata?.submittedOnBehalfOf) {
            update.submittedOnBehalfOf = metadata.submittedOnBehalfOf;
          }
        }
        
        // Track QA review
        if (status === 'completed' && metadata?.reviewedBy) {
          update.reviewedBy = metadata.reviewedBy;
          update.reviewedAt = new Date().toISOString();
          if (metadata.reviewNotes) {
            update.reviewNotes = metadata.reviewNotes;
          }
        }
        
        return { ...a, ...update };
      }
      return a;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('assignmentUpdated'));
  } catch (error) {
    console.error('Error updating case status:', error);
  }
};

/**
 * Submit case (for QA or doctor)
 */
export const submitCase = (
  assignmentId: string,
  submittedBy: string,
  submittedOnBehalfOf?: string
): void => {
  updateCaseStatus(assignmentId, 'submitted', {
    submittedBy,
    submittedOnBehalfOf,
  });
};

/**
 * Review case (for QA)
 */
export const reviewCase = (
  assignmentId: string,
  reviewedBy: string,
  reviewNotes?: string
): void => {
  // Review doesn't change status, just records the review
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const assignments: AssignedCase[] = JSON.parse(stored);
    const updated = assignments.map(a => 
      a.id === assignmentId 
        ? { 
            ...a, 
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reviewNotes: reviewNotes || a.reviewNotes
          }
        : a
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('assignmentUpdated'));
  } catch (error) {
    console.error('Error reviewing case:', error);
  }
};

/**
 * Reject case (send back to doctor)
 */
export const rejectCase = (
  assignmentId: string,
  rejectedBy: string,
  rejectionReason?: string
): void => {
  updateCaseStatus(assignmentId, 'in_progress', {
    reviewNotes: rejectionReason,
    reviewedBy: rejectedBy,
  });
};

/**
 * Get all assignments (for admin view)
 */
export const getAllAssignments = (): AssignedCase[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading all assignments:', error);
    return [];
  }
};

/**
 * Convert AssignedCase to ReviewCase format for Review Cases page
 */
export const convertToReviewCase = (assignedCase: AssignedCase) => {
  return {
    id: assignedCase.id,
    patientName: assignedCase.patientName || assignedCase.fileName.replace('.pdf', ''),
    claimId: assignedCase.claimId || `ASSIGNED-${assignedCase.id.substring(0, 8)}`,
    injuryDate: assignedCase.injuryDate || new Date(assignedCase.assignedAt).toISOString().split('T')[0],
    status: assignedCase.status,
    assignedAt: assignedCase.assignedAt,
    source: assignedCase.source,
    supportingDocuments: assignedCase.supportingDocuments?.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      uploadedAt: doc.uploadedAt,
      url: doc.url,
      size: doc.size,
      base64: doc.base64
    }))
  };
};


