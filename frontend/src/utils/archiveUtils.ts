/**
 * Archive utilities for case archiving (Law 25 retention simulation)
 */

import { getAllAssignments, AssignedCase } from './adminCaseAssignment';

const ARCHIVE_STORAGE_KEY = 'techemd_archived_cases';

export interface ArchivedCase extends AssignedCase {
  archivedAt: string;
  archivedBy: string;
  retentionDate?: string; // Date when case should be deleted (Law 25)
}

/**
 * Archive a case
 */
export const archiveCase = (caseId: string, archivedBy: string): void => {
  try {
    // Update case assignment
    const stored = localStorage.getItem('techemd_admin_assignments');
    if (stored) {
      const assignments: AssignedCase[] = JSON.parse(stored);
      const updated = assignments.map((a) => {
        if (a.id === caseId) {
          return {
            ...a,
            archived: true,
            archivedAt: new Date().toISOString(),
            archivedBy,
          };
        }
        return a;
      });
      localStorage.setItem('techemd_admin_assignments', JSON.stringify(updated));
    }

    // Add to archive storage
    const archived = getAllArchivedCases();
    const case_ = getAllAssignments().find((c) => c.id === caseId);
    if (case_) {
      const archivedCase: ArchivedCase = {
        ...case_,
        archived: true,
        archivedAt: new Date().toISOString(),
        archivedBy,
        retentionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 7 years
      };
      archived.push(archivedCase);
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archived));
    }

    window.dispatchEvent(new Event('assignmentUpdated'));
    window.dispatchEvent(new Event('archiveUpdated'));
  } catch (error) {
    console.error('Error archiving case:', error);
  }
};

/**
 * Get all archived cases
 */
export const getAllArchivedCases = (): ArchivedCase[] => {
  try {
    const stored = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading archived cases:', error);
    return [];
  }
};

/**
 * Restore an archived case
 */
export const restoreCase = (caseId: string): void => {
  try {
    // Remove from archive
    const archived = getAllArchivedCases();
    const filtered = archived.filter((c) => c.id !== caseId);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(filtered));

    // Update case assignment
    const stored = localStorage.getItem('techemd_admin_assignments');
    if (stored) {
      const assignments: AssignedCase[] = JSON.parse(stored);
      const updated = assignments.map((a) => {
        if (a.id === caseId) {
          const { archived, archivedAt, archivedBy, ...rest } = a;
          return rest;
        }
        return a;
      });
      localStorage.setItem('techemd_admin_assignments', JSON.stringify(updated));
    }

    window.dispatchEvent(new Event('assignmentUpdated'));
    window.dispatchEvent(new Event('archiveUpdated'));
  } catch (error) {
    console.error('Error restoring case:', error);
  }
};

/**
 * Get cases eligible for deletion (past retention date)
 */
export const getCasesEligibleForDeletion = (): ArchivedCase[] => {
  const archived = getAllArchivedCases();
  const now = new Date();
  return archived.filter((c) => {
    if (!c.retentionDate) return false;
    return new Date(c.retentionDate) < now;
  });
};

