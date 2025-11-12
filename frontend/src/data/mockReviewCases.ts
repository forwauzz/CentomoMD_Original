/**
 * Shared mock review cases data
 * Used by both ReviewCasesPage and CaseReviewPage
 */

export interface ReviewCase {
  id: string;
  patientName: string;
  claimId: string;
  injuryDate: string;
  status: 'pending_review' | 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedAt: string;
  clinicName?: string;
  source: {
    type: 'cnesst' | 'employer' | 'clinic';
    name: string;
  };
  priority?: 'low' | 'medium' | 'high';
  rejectedAt?: string;
  rejectionReason?: string;
  fileBase64?: string; // Add PDF file data for review
  fileName?: string;
}

export const MOCK_REVIEW_CASES: ReviewCase[] = [
  {
    id: 'case-001',
    patientName: 'Jean Tremblay',
    claimId: 'CNESST-24-7788',
    injuryDate: '2024-04-19',
    status: 'pending_review',
    assignedAt: '2024-01-15T10:00:00Z',
    clinicName: 'Clinique St-Justine',
    source: {
      type: 'clinic',
      name: 'Clinique St-Justine'
    },
    priority: 'high',
    fileName: 'Jean_Tremblay_Chart.pdf',
    // Mock base64 PDF - in production this would be a real PDF
    fileBase64: undefined, // Will be generated or loaded from storage
  },
  {
    id: 'case-002',
    patientName: 'Marie Dubois',
    claimId: 'CNESST-24-7890',
    injuryDate: '2024-05-10',
    status: 'pending_review',
    assignedAt: '2024-01-16T14:00:00Z',
    clinicName: 'CHUM',
    source: {
      type: 'clinic',
      name: 'CHUM'
    },
    priority: 'medium'
  },
  {
    id: 'case-003',
    patientName: 'Pierre Martin',
    claimId: 'CNESST-24-7901',
    injuryDate: '2024-05-15',
    status: 'in_progress',
    assignedAt: '2024-01-10T09:00:00Z',
    clinicName: 'Clinique St-Justine',
    source: {
      type: 'clinic',
      name: 'Clinique St-Justine'
    }
  },
  {
    id: 'case-004',
    patientName: 'Sophie Leblanc',
    claimId: 'CNESST-24-7912',
    injuryDate: '2024-05-20',
    status: 'completed',
    assignedAt: '2024-01-05T08:00:00Z',
    clinicName: 'CHUM',
    source: {
      type: 'clinic',
      name: 'CHUM'
    }
  },
  {
    id: 'case-005',
    patientName: 'Luc Bouchard',
    claimId: 'CNESST-24-7923',
    injuryDate: '2024-05-25',
    status: 'rejected',
    assignedAt: '2024-01-12T11:00:00Z',
    clinicName: 'Clinique St-Justine',
    source: {
      type: 'employer',
      name: 'Agnico Eagle Mines'
    },
    rejectedAt: '2024-01-18T15:00:00Z',
    rejectionReason: 'Hors de ma spécialité'
  },
  {
    id: 'case-006',
    patientName: 'Isabelle Gagnon',
    claimId: 'CNESST-24-7934',
    injuryDate: '2024-05-28',
    status: 'rejected',
    assignedAt: '2024-01-14T09:00:00Z',
    clinicName: 'CHUM',
    source: {
      type: 'cnesst',
      name: 'CNESST'
    },
    rejectedAt: '2024-01-19T10:00:00Z',
    rejectionReason: 'Conflit d\'intérêts'
  },
  {
    id: 'case-007',
    patientName: 'Robert Lavoie',
    claimId: 'CNESST-24-7945',
    injuryDate: '2024-06-01',
    status: 'pending_review',
    assignedAt: '2024-01-20T08:00:00Z',
    source: {
      type: 'cnesst',
      name: 'CNESST'
    },
    priority: 'high'
  },
  {
    id: 'case-008',
    patientName: 'Catherine Roy',
    claimId: 'CNESST-24-7956',
    injuryDate: '2024-06-05',
    status: 'in_progress',
    assignedAt: '2024-01-18T13:00:00Z',
    source: {
      type: 'employer',
      name: 'Hydro-Québec'
    }
  }
];

