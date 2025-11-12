/**
 * Mock Data Service - Mimics backend API structure for prototype
 * Feature flag to switch between real/mock data
 */

import mockCases from '@/data/mockCases.json';

export interface MockCase {
  id: string;
  case_id: string;
  worker_name: string;
  injury_date: string;
  assigned_doctor: string;
  status: string;
  sections: Record<string, any>;
  compliance: {
    status: string;
    flags: Array<{
      type: string;
      severity: string;
      section: string;
      message: string;
    }>;
  };
  timeline: Array<{
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }>;
  source: {
    type: string;
    name: string;
  };
  claimId: string;
  patientName: string;
}

// Feature flag - set to true to use mock data
const USE_MOCK_DATA = true;

export const mockDataService = {
  /**
   * Get all cases
   */
  getCases: async (): Promise<MockCase[]> => {
    if (!USE_MOCK_DATA) {
      // In production, this would call the real API
      throw new Error('Real API not implemented');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockCases as MockCase[];
  },

  /**
   * Get case by ID
   */
  getCase: async (id: string): Promise<MockCase | null> => {
    if (!USE_MOCK_DATA) {
      throw new Error('Real API not implemented');
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    const case_ = mockCases.find(c => c.id === id);
    return (case_ as MockCase) || null;
  },

  /**
   * Assign case to doctor
   */
  assignCase: async (caseId: string, doctorId: string, _assignedBy: string): Promise<void> => {
    if (!USE_MOCK_DATA) {
      throw new Error('Real API not implemented');
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    // In real implementation, this would update the backend
    console.log('Mock: Assigning case', caseId, 'to doctor', doctorId);
  },

  /**
   * Update case status
   */
  updateCaseStatus: async (caseId: string, status: string): Promise<void> => {
    if (!USE_MOCK_DATA) {
      throw new Error('Real API not implemented');
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Mock: Updating case', caseId, 'status to', status);
  },

  /**
   * Get mock AI summary for Section 7
   */
  getSection7Summary: async (caseId: string): Promise<string> => {
    if (!USE_MOCK_DATA) {
      throw new Error('Real API not implemented');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Résumé automatique généré pour le cas ${caseId}. Le patient présente des symptômes compatibles avec une lésion musculosquelettique. L'examen physique révèle des limitations fonctionnelles.`;
  },

  /**
   * Get mock AI summary for Section 8
   */
  getSection8Summary: async (caseId: string): Promise<string> => {
    if (!USE_MOCK_DATA) {
      throw new Error('Real API not implemented');
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Résumé de la dictée pour le cas ${caseId}. Le patient décrit l'incident et les symptômes actuels.`;
  },
};

