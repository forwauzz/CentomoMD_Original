import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Undo, 
  Redo, 
  MoreVertical, 
  FileText, 
  Copy,
  Save,
  Download,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useUIStore } from '@/stores/uiStore';
import { useI18n } from '@/lib/i18n';
import { CaseStepper } from '@/components/case/CaseStepper';
import { CaseSectionContent } from '@/components/case/CaseSectionContent';
import { CaseEditorFooter } from '@/components/case/CaseEditorFooter';
import { RagSidebar } from '@/components/case/RagSidebar';
import { ComplianceValidator, canGenerateReport } from '@/components/case/ComplianceValidator';
import { exportToDocx, exportToPdf, downloadBlob } from '@/utils/exportUtils';
import type { LegalVerificationResponse } from '@/services/legalVerification';

interface CaseData {
  id: string;
  patientName: string;
  claimId: string;
  sections: {
    [key: string]: any;
  };
  currentSection: number;
}

export const CaseEditorPage = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore(state => state.addToast);
  const { t } = useI18n();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationResult, setValidationResult] = useState<LegalVerificationResponse | null>(null);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    setLoading(true);
    try {
      // Load case data from localStorage or API
      const savedCase = localStorage.getItem(`case_${caseId}`);
      if (savedCase) {
        const parsed = JSON.parse(savedCase);
        
        // Check if Section 7 was generated from review page
        if (parsed.sections?.section_7?.generatedFromReview) {
          // If Section 7 exists from review, set current section to 7
          setCurrentSection(7);
          parsed.currentSection = 7;
        } else {
          setCurrentSection(parsed.currentSection || 1);
        }
        
        setCaseData(parsed);
      } else {
        // Check if case exists in assigned cases (from review page)
        // This handles cases that were accepted but not yet opened in editor
        try {
          const { getAllAssignments } = await import('@/utils/adminCaseAssignment');
          const allCases = getAllAssignments();
          const assignedCase = allCases.find(c => c.id === caseId);
          
          if (assignedCase) {
            // Create case structure from assigned case
            const newCase: CaseData = {
              id: caseId || '',
              patientName: assignedCase.patientName || 'Nouveau cas',
              claimId: assignedCase.claimId || '',
              sections: {},
              currentSection: 1
            };
            
            // Check if Section 7 content exists in localStorage from review
            const reviewCaseData = localStorage.getItem(`case_${caseId}`);
            if (reviewCaseData) {
              const reviewData = JSON.parse(reviewCaseData);
              if (reviewData.sections?.section_7) {
                newCase.sections.section_7 = reviewData.sections.section_7;
                newCase.currentSection = 7;
                setCurrentSection(7);
              }
            }
            
            setCaseData(newCase);
            saveCase(newCase);
          } else {
            // Create new case structure
            const newCase: CaseData = {
              id: caseId || '',
              patientName: 'Nouveau cas',
              claimId: '',
              sections: {},
              currentSection: 1
            };
            setCaseData(newCase);
            saveCase(newCase);
          }
        } catch (importError) {
          // Fallback to creating new case
          const newCase: CaseData = {
            id: caseId || '',
            patientName: 'Nouveau cas',
            claimId: '',
            sections: {},
            currentSection: 1
          };
          setCaseData(newCase);
          saveCase(newCase);
        }
      }
    } catch (error) {
      console.error('Failed to load case:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger le cas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCase = async (data?: CaseData) => {
    const caseToSave = data || caseData;
    if (!caseToSave) return;

    try {
      // Save to localStorage
      localStorage.setItem(`case_${caseId}`, JSON.stringify({
        ...caseToSave,
        currentSection,
        lastSaved: new Date().toISOString()
      }));
      
      // In production, also save to API
      // await apiFetch(`/api/cases/${caseId}`, { method: 'PUT', body: JSON.stringify(caseToSave) });
      
      setHasUnsavedChanges(false);
      addToast({
        type: 'success',
        title: 'Sauvegardé',
        message: 'Le cas a été sauvegardé avec succès.'
      });
    } catch (error) {
      console.error('Failed to save case:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de sauvegarder le cas.'
      });
    }
  };

  const handleSectionChange = (section: number) => {
    if (hasUnsavedChanges) {
      // Auto-save before switching sections
      saveCase();
    }
    setCurrentSection(section);
    if (caseData) {
      const updated = { ...caseData, currentSection: section };
      setCaseData(updated);
      saveCase(updated);
    }
  };

  const handleSectionUpdate = (sectionNumber: number, content: any) => {
    if (!caseData) return;
    
    const updated = {
      ...caseData,
      sections: {
        ...caseData.sections,
        [`section_${sectionNumber}`]: content
      }
    };
    setCaseData(updated);
    setHasUnsavedChanges(true);
    // Auto-save after a short delay
    const timeoutId = setTimeout(() => {
      saveCase(updated);
    }, 1000);
    return () => clearTimeout(timeoutId);
  };

  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!caseData) return;
    
    try {
      addToast({
        type: 'info',
        title: t('language') === 'fr' ? 'Export en cours' : 'Export in progress',
        message: t('language') === 'fr'
          ? `Génération du fichier ${format.toUpperCase()}...`
          : `Generating ${format.toUpperCase()} file...`
      });
      
      let blob: Blob;
      const fileName = `${caseData.claimId || 'case'}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'docx') {
        // Export to DOCX using docxtemplater
        blob = await exportToDocx(caseData);
        setExportBlob(blob);
        setExportFormat('docx');
        
        // For DOCX preview, generate PDF version for iframe preview
        // (browsers can't directly preview DOCX in iframe)
        try {
          const pdfBlob = await exportToPdf(caseData);
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setPreviewBlob(pdfBlob);
          setPreviewUrl(pdfUrl);
          setShowPreview(true);
        } catch (pdfError) {
          console.error('Error generating PDF preview:', pdfError);
          // If PDF generation fails, just download DOCX directly
          downloadBlob(blob, fileName);
          addToast({
            type: 'success',
            title: t('language') === 'fr' ? 'Export réussi' : 'Export successful',
            message: t('language') === 'fr'
              ? `Le fichier ${format.toUpperCase()} a été généré et téléchargé.`
              : `${format.toUpperCase()} file has been generated and downloaded.`
          });
        }
      } else {
        // Export to PDF using pdf-lib
        blob = await exportToPdf(caseData);
        const pdfUrl = URL.createObjectURL(blob);
        setPreviewBlob(blob);
        setPreviewUrl(pdfUrl);
        setExportBlob(blob);
        setExportFormat('pdf');
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? `Impossible d'exporter le cas en ${format.toUpperCase()}.`
          : `Unable to export case as ${format.toUpperCase()}.`
      });
    }
  };

  const handleDownloadExport = () => {
    if (!exportBlob || !exportFormat || !caseData) return;
    
    const fileName = `${caseData.claimId || 'case'}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    downloadBlob(exportBlob, fileName);
    
    addToast({
      type: 'success',
      title: t('language') === 'fr' ? 'Export réussi' : 'Export successful',
      message: t('language') === 'fr'
        ? `Le fichier ${exportFormat.toUpperCase()} a été téléchargé.`
        : `${exportFormat.toUpperCase()} file has been downloaded.`
    });
    
    // Clean up
    handleClosePreview();
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setExportBlob(null);
    setExportFormat(null);
  };

  if (loading || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#009639] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du cas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/review-cases')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Annuler">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Refaire">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="Plus d'options">
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Fichier">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Copier">
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => saveCase()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>Sauvegarder</span>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <ComplianceValidator
            caseData={caseData}
            onValidationComplete={setValidationResult}
            showButton={true}
            compact={true}
          />
          <div className="h-6 w-px bg-gray-300" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={!canGenerateReport(validationResult)}
            className="flex items-center gap-2"
            title={!canGenerateReport(validationResult) ? t('reportGenerationDisabled') : ''}
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleExport('docx')}
            disabled={!canGenerateReport(validationResult)}
            className="flex items-center gap-2"
            title={!canGenerateReport(validationResult) ? t('reportGenerationDisabled') : ''}
          >
            <FileDown className="h-4 w-4" />
            <span>DOCX</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title and Stepper */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-center mb-4">New Case</h1>
          <CaseStepper
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            sections={caseData.sections}
          />
        </div>

        {/* Section Content */}
        <div className={`flex-1 overflow-hidden ${currentSection === 7 || currentSection === 8 ? 'p-0' : currentSection === 12 ? 'p-6 overflow-y-auto' : 'p-6'}`}>
          <CaseSectionContent
            sectionNumber={currentSection}
            caseData={caseData}
            onUpdate={handleSectionUpdate}
            onSave={saveCase}
          />
        </div>
      </div>

      {/* Footer */}
      <CaseEditorFooter
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onCancel={() => navigate('/review-cases')}
        onSaveAndExit={() => {
          saveCase();
          navigate('/review-cases');
        }}
        onSaveAndContinue={() => {
          saveCase();
          if (currentSection < 13) {
            handleSectionChange(currentSection + 1);
          }
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        caseData={caseData}
        validationResult={validationResult}
        onValidationComplete={setValidationResult}
      />

      {/* RAG Sidebar */}
      <RagSidebar />

      {/* Export Preview Modal */}
      <Dialog open={showPreview} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t('language') === 'fr' 
                ? `Aperçu du rapport ${exportFormat === 'docx' ? '(DOCX - aperçu PDF)' : '(PDF)'}`
                : `Report Preview ${exportFormat === 'docx' ? '(DOCX - PDF preview)' : '(PDF)'}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden border rounded-lg bg-gray-100">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
                title="Export Preview"
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreview}>
              {t('language') === 'fr' ? 'Fermer' : 'Close'}
            </Button>
            <Button onClick={handleDownloadExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('language') === 'fr' 
                ? `Télécharger ${exportFormat?.toUpperCase() || ''}`
                : `Download ${exportFormat?.toUpperCase() || ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

