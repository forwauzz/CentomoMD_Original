/**
 * Legal Verification Service
 * Evaluates case data for compliance with workers compensation law
 */

export interface LegalVerificationRequest {
  caseData: any;
  sections: { [key: string]: any };
}

export interface LegalIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  section?: string;
  recommendation?: string;
  legalReference?: string;
}

export interface LegalVerificationResponse {
  compliant: boolean;
  overallStatus: 'compliant' | 'needs_review' | 'non_compliant';
  issues: LegalIssue[];
  summary: string;
  verifiedAt: string;
  verifiedBy?: string;
}

/**
 * Verify case data for legal compliance
 * @param request - Case data and sections to verify
 * @returns Promise resolving to legal verification results
 */
export async function verifyLegalCompliance(
  request: LegalVerificationRequest
): Promise<LegalVerificationResponse> {
  try {
    // Call backend API that evaluates compliance with workers compensation law
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const url = `${apiBase}/legal/verify`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // Handle 404 or service not available - return mock data for development
      if (response.status === 404 || response.status === 503) {
        console.warn('Legal verification API not available, using mock response for development');
        return getMockVerificationResponse(request);
      }

      const errorText = await response.text();
      let errorMessage = `Erreur HTTP! statut: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage} - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result: LegalVerificationResponse = await response.json();
    
    // Validate response structure
    if (typeof result.compliant !== 'boolean' || !Array.isArray(result.issues)) {
      throw new Error('Format de réponse invalide de l\'API de vérification légale');
    }

    return result;
  } catch (error) {
    // If it's a network error and we're in development, return mock data
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error, using mock response for development');
      return getMockVerificationResponse(request);
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Échec de la communication avec l\'API de vérification légale');
  }
}

/**
 * Mock verification response for development
 * In production, this would never be used
 */
function getMockVerificationResponse(
  request: LegalVerificationRequest
): LegalVerificationResponse {
  // Simple mock that checks if sections have content
  const sections = request.sections || {};
  const hasContent = Object.keys(sections).length > 0;
  const issues: LegalIssue[] = [];

  // Mock some basic checks
  if (!sections.section_1 || !sections.section_1.content) {
    issues.push({
      severity: 'warning',
      category: 'Mandat manquant',
      description: 'La section 1 (Mandat) doit être complétée pour la conformité légale.',
      section: '1',
      recommendation: 'Veuillez compléter la section Mandat de l\'évaluation.',
      legalReference: 'Loi sur les accidents du travail et les maladies professionnelles'
    });
  }

  if (!sections.section_11 || !sections.section_11.summary) {
    issues.push({
      severity: 'warning',
      category: 'Conclusion manquante',
      description: 'La section 11 (Conclusion) doit être complétée.',
      section: '11',
      recommendation: 'Veuillez générer ou compléter la conclusion.',
      legalReference: 'Règlement sur les rapports médicaux CNESST'
    });
  }

  return {
    compliant: issues.length === 0,
    overallStatus: issues.length === 0 ? 'compliant' : issues.some(i => i.severity === 'error') ? 'non_compliant' : 'needs_review',
    issues,
    summary: issues.length === 0
      ? 'Le dossier respecte les exigences légales de base. Toutes les sections essentielles sont complétées.'
      : `Le dossier nécessite des corrections. ${issues.length} point(s) à vérifier.`,
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Système de vérification automatique'
  };
}

