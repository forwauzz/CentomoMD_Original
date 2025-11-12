import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Save, CheckCircle2, XCircle, Maximize2, Minimize2, Mic, MicOff } from 'lucide-react';
import { DocumentList } from '@/components/case/DocumentList';
import { PDFViewer } from '@/components/case/PDFViewer';
import { CitationWindow } from '@/components/case/CitationWindow';
import { RichTextEditor } from '@/components/case/RichTextEditor';
import { mockDataService } from '@/services/mockDataService';
import { useI18n } from '@/lib/i18n';
import { useUIStore } from '@/stores/uiStore';
import { getAllAssignments, AssignedCase } from '@/utils/adminCaseAssignment';
import { apiFetch } from '@/lib/api';
import { MOCK_REVIEW_CASES, type ReviewCase } from '@/data/mockReviewCases';
import { useTranscription } from '@/hooks/useTranscription';

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  url?: string;
  base64?: string;
}

export const CaseReviewPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const addToast = useUIStore(state => state.addToast);
  
  const [caseData, setCaseData] = useState<AssignedCase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [section7Content, setSection7Content] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'fullscreen-pdf'>('split');
  const [isDictating, setIsDictating] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Smart dictation hook
  const { inputLanguage } = useUIStore();
  const dictationLanguage = inputLanguage === 'fr' ? 'fr-CA' : 'en-US';
  const {
    isRecording,
    currentTranscript,
    startRecording,
    stopRecording,
    error: dictationError
  } = useTranscription(undefined, dictationLanguage, 'smart_dictation');

  // Recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (caseId) {
      loadCaseData();
    }
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      if (!caseId) {
        throw new Error('No case ID provided');
      }

      console.log('Loading case data for:', caseId);
      
      // First try to find in mock review cases (most common source for Review Cases page)
      let foundCase: AssignedCase | null = null;
      const mockCase = MOCK_REVIEW_CASES.find((c) => c.id === caseId);
      
      if (mockCase) {
        console.log('Found case in mock review cases:', mockCase);
            // Convert ReviewCase to AssignedCase format
            foundCase = {
              id: mockCase.id,
              fileId: mockCase.id,
              fileName: mockCase.fileName || `${mockCase.patientName} - ${mockCase.claimId}.pdf`,
              fileBase64: mockCase.fileBase64,
              assignedTo: '',
              assignedBy: 'system',
              assignedAt: mockCase.assignedAt,
              status: mockCase.status === 'pending_review' ? 'pending_review' : 
                      mockCase.status === 'in_progress' ? 'in_progress' :
                      mockCase.status === 'completed' ? 'completed' :
                      mockCase.status === 'rejected' ? 'rejected' : 'pending',
              source: mockCase.source,
              patientName: mockCase.patientName,
              claimId: mockCase.claimId,
              injuryDate: mockCase.injuryDate,
            } as AssignedCase;
      }
      
      // If not found in mock data, try assigned cases
      if (!foundCase) {
        const allCases = getAllAssignments();
        foundCase = allCases.find((c) => c.id === caseId) || null;
        if (foundCase) {
          console.log('Found case in assigned cases:', foundCase);
        }
      }
      
      // If still not found, try to load from API (for cases created via API)
      if (!foundCase) {
        try {
          const apiCase = await apiFetch(`/api/cases/${caseId}`);
          if (apiCase && apiCase.id) {
            console.log('Found case in API:', apiCase);
            // Convert API case to AssignedCase format
            foundCase = {
              id: apiCase.id,
              fileId: apiCase.id,
              fileName: apiCase.name || 'Case',
              assignedTo: apiCase.user_id || '',
              assignedBy: 'system',
              assignedAt: apiCase.created_at || new Date().toISOString(),
              status: (apiCase.status || 'in_progress') as AssignedCase['status'],
              source: {
                type: 'clinic',
                name: 'Clinic',
              },
              patientName: apiCase.patientInfo?.name,
              claimId: apiCase.patientInfo?.claimId,
            } as AssignedCase;
          }
        } catch (apiError) {
          console.log('Case not found in API:', apiError);
        }
      }
      
      if (foundCase) {
        setCaseData(foundCase);
        
        // Load documents from case
        const caseDocs: Document[] = [];
        if (foundCase.fileBase64) {
          caseDocs.push({
            id: foundCase.fileId,
            name: foundCase.fileName,
            type: 'application/pdf',
            uploadedAt: foundCase.assignedAt,
            base64: foundCase.fileBase64,
          });
        }
        if (foundCase.supportingDocuments) {
          foundCase.supportingDocuments.forEach((doc) => {
            caseDocs.push({
              id: doc.id,
              name: doc.name,
              type: doc.type,
              uploadedAt: doc.uploadedAt,
              base64: doc.base64,
            });
          });
        }
        // If no documents, create a mock PDF document for demo purposes
        if (caseDocs.length === 0) {
          // Create a placeholder PDF document (mock base64)
          caseDocs.push({
            id: `doc-${foundCase.id}`,
            name: `${foundCase.patientName || foundCase.claimId || 'Case'}.pdf`,
            type: 'application/pdf',
            uploadedAt: foundCase.assignedAt,
            base64: 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo3MCA3NTAgVGQKKEhlbGxvIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI2MyAwMDAwMCBuIAowMDAwMDAwMzIxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE1CiUlRU9G', // Minimal valid PDF base64
          });
        }
        setDocuments(caseDocs);
        
        // Set first document as selected if available
        if (caseDocs.length > 0) {
          setSelectedDocument(caseDocs[0]);
        }
        
        // Load Section 7 content - try to get from case sections if available
        // For now, use patient name as placeholder with some default content
        const defaultContent = foundCase.patientName 
          ? `Résumé pour ${foundCase.patientName} (${foundCase.claimId})`
          : foundCase.claimId || '';
        setSection7Content(defaultContent);
        
        // Set loading to false after successful load
        setLoading(false);
      } else {
        console.error('Case not found:', caseId);
        console.log('Available mock cases:', MOCK_REVIEW_CASES.map(c => c.id));
        addToast({
          type: 'error',
          title: t('language') === 'fr' ? 'Cas non trouvé' : 'Case not found',
          message: t('language') === 'fr' 
            ? `Le cas "${caseId}" n'existe pas. Vérifiez que le cas a été créé et assigné.`
            : `Case "${caseId}" does not exist. Please ensure the case has been created and assigned.`,
        });
        // Don't auto-redirect, let user see the error and navigate back manually
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading case:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de charger les données du cas.'
          : 'Unable to load case data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newDoc: Document = {
          id: `doc-${Date.now()}`,
          name: file.name,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          base64: base64.split(',')[1] || base64,
        };
        setDocuments([...documents, newDoc]);
        addToast({
          type: 'success',
          title: t('language') === 'fr' ? 'Document téléversé' : 'Document uploaded',
          message: t('language') === 'fr'
            ? `Le document "${file.name}" a été téléversé avec succès.`
            : `Document "${file.name}" uploaded successfully.`,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading document:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de téléverser le document.'
          : 'Unable to upload document.',
      });
    }
  };

  const saveSection7Content = () => {
    if (!caseId) return false;
    
    try {
      // Load existing case data from localStorage (used by CaseEditorPage)
      const existingCaseData = localStorage.getItem(`case_${caseId}`);
      let savedCaseData: any;
      
      if (existingCaseData) {
        savedCaseData = JSON.parse(existingCaseData);
      } else {
        // Create new case structure if it doesn't exist
        savedCaseData = {
          id: caseId,
          patientName: caseData?.patientName || 'Nouveau cas',
          claimId: caseData?.claimId || '',
          sections: {},
          currentSection: 7
        };
      }
      
      // Update Section 7 content
      if (!savedCaseData.sections) {
        savedCaseData.sections = {};
      }
      
      savedCaseData.sections.section_7 = {
        summary: section7Content,
        lastModified: new Date().toISOString(),
        generatedFromReview: true
      };
      
      // Save to localStorage (this will be picked up by CaseEditorPage)
      localStorage.setItem(`case_${caseId}`, JSON.stringify(savedCaseData));
      return true;
    } catch (error) {
      console.error('Error saving Section 7 content:', error);
      return false;
    }
  };

  const handleSave = () => {
    if (!caseId || !section7Content) {
      addToast({
        type: 'warning',
        title: t('language') === 'fr' ? 'Avertissement' : 'Warning',
        message: t('language') === 'fr'
          ? 'Veuillez ajouter du contenu à la Section 7 avant d\'enregistrer.'
          : 'Please add content to Section 7 before saving.',
      });
      return;
    }
    
    if (saveSection7Content()) {
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Enregistré' : 'Saved',
        message: t('language') === 'fr'
          ? 'Le contenu de la Section 7 a été enregistré et sera disponible dans la page d\'édition.'
          : 'Section 7 content has been saved and will be available in the editor page.',
      });
    } else {
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible d\'enregistrer le contenu de la Section 7.'
          : 'Unable to save Section 7 content.',
      });
    }
  };

  const handleSaveAndContinue = async () => {
    if (!caseId) return;
    
    // Save Section 7 content
    if (!saveSection7Content()) {
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible d\'enregistrer le contenu de la Section 7.'
          : 'Unable to save Section 7 content.',
      });
      return;
    }
    
    // Update case status to in_progress
    try {
      // Update mock data status
      const allCases = getAllAssignments();
      const caseToUpdate = allCases.find(c => c.id === caseId);
      if (caseToUpdate) {
        caseToUpdate.status = 'in_progress';
        // Trigger storage update event
        window.dispatchEvent(new Event('assignmentUpdated'));
      }
      
      // Update MOCK_REVIEW_CASES if it exists there
      const mockCaseIndex = MOCK_REVIEW_CASES.findIndex(c => c.id === caseId);
      if (mockCaseIndex !== -1) {
        MOCK_REVIEW_CASES[mockCaseIndex].status = 'in_progress';
      }
      
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Cas accepté' : 'Case accepted',
        message: t('language') === 'fr'
          ? 'Le cas a été accepté et ajouté à vos cas en cours. Redirection vers l\'éditeur...'
          : 'Case has been accepted and added to your in-progress cases. Redirecting to editor...',
      });
      
      // Navigate to case editor in in_progress tab
      setTimeout(() => {
        navigate(`/case/edit/${caseId}?tab=in_progress`);
      }, 1000);
    } catch (error) {
      console.error('Error updating case status:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de mettre à jour le statut du cas.'
          : 'Unable to update case status.',
      });
    }
  };

  // Sync isDictating with isRecording state
  useEffect(() => {
    setIsDictating(isRecording);
  }, [isRecording]);

  // Handle dictation transcript updates
  useEffect(() => {
    if (currentTranscript && isRecording) {
      // Append transcript to Section 7 content
      setSection7Content(prev => {
        const separator = prev.trim() ? '\n\n' : '';
        return prev + separator + currentTranscript;
      });
    }
  }, [currentTranscript, isRecording]);

  // Handle dictation errors
  useEffect(() => {
    if (dictationError) {
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur de dictée' : 'Dictation Error',
        message: dictationError.message || (t('language') === 'fr' 
          ? 'Une erreur est survenue lors de la dictée.'
          : 'An error occurred during dictation.'),
      });
      setIsDictating(false);
    }
  }, [dictationError, addToast, t]);

  const handleToggleDictation = async () => {
    if (isRecording) {
      try {
        stopRecording();
        setIsDictating(false);
        addToast({
          type: 'success',
          title: t('language') === 'fr' ? 'Dictée arrêtée' : 'Dictation Stopped',
          message: t('language') === 'fr'
            ? 'La dictée a été arrêtée et le contenu a été ajouté à la Section 7.'
            : 'Dictation stopped and content has been added to Section 7.',
        });
      } catch (error) {
        console.error('Failed to stop dictation:', error);
        addToast({
          type: 'error',
          title: t('language') === 'fr' ? 'Erreur' : 'Error',
          message: t('language') === 'fr'
            ? 'Impossible d\'arrêter la dictée.'
            : 'Unable to stop dictation.',
        });
      }
    } else {
      try {
        await startRecording();
        setIsDictating(true);
        addToast({
          type: 'info',
          title: t('language') === 'fr' ? 'Dictée démarrée' : 'Dictation Started',
          message: t('language') === 'fr'
            ? 'La dictée intelligente a démarré. Parlez maintenant.'
            : 'Smart dictation started. Speak now.',
        });
      } catch (error) {
        console.error('Failed to start dictation:', error);
        setIsDictating(false);
        addToast({
          type: 'error',
          title: t('language') === 'fr' ? 'Erreur' : 'Error',
          message: t('language') === 'fr'
            ? 'Impossible de démarrer la dictée. Vérifiez les permissions du microphone.'
            : 'Unable to start dictation. Please check microphone permissions.',
        });
      }
    }
  };

  const handleGenerateHistory = async () => {
    if (!caseId) return;
    
    addToast({
      type: 'info',
      title: t('language') === 'fr' ? 'Génération en cours' : 'Generating',
      message: t('language') === 'fr'
        ? 'Génération de l\'historique et de l\'évolution...'
        : 'Generating history and evolution...',
    });

    try {
      // Use mock data service to generate Section 7 summary
      const generatedContent = await mockDataService.getSection7Summary(caseId);
      setSection7Content(generatedContent);
      
      // Auto-save the generated content to localStorage
      try {
        const existingCaseData = localStorage.getItem(`case_${caseId}`);
        let savedCaseData: any;
        
        if (existingCaseData) {
          savedCaseData = JSON.parse(existingCaseData);
        } else {
          // Use caseData from component state if available
          savedCaseData = {
            id: caseId,
            patientName: caseData?.patientName || 'Nouveau cas',
            claimId: caseData?.claimId || '',
            sections: {},
            currentSection: 7
          };
        }
        
        if (!savedCaseData.sections) {
          savedCaseData.sections = {};
        }
        
        savedCaseData.sections.section_7 = {
          summary: generatedContent,
          lastModified: new Date().toISOString(),
          generatedFromReview: true
        };
        
        localStorage.setItem(`case_${caseId}`, JSON.stringify(savedCaseData));
      } catch (error) {
        console.error('Error auto-saving generated content:', error);
      }
      
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Généré' : 'Generated',
        message: t('language') === 'fr'
          ? 'L\'historique et l\'évolution ont été générés. Vous pouvez maintenant les modifier. Le contenu sera disponible dans la page d\'édition après acceptation.'
          : 'History and evolution have been generated. You can now edit them. Content will be available in the editor page after acceptance.',
      });
    } catch (error) {
      console.error('Error generating history:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de générer l\'historique.'
          : 'Unable to generate history.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/review-cases')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('language') === 'fr' ? 'Retour' : 'Back'}
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t('caseReview')}</h1>
              <p className="text-sm text-gray-600">
                {caseData.claimId || caseData.id.substring(0, 8)} • {caseData.patientName || caseData.fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('save')}
            </Button>
            <Button 
              onClick={handleSaveAndContinue}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {t('language') === 'fr' ? 'Enregistrer et continuer au cas' : 'Save Summary and Continue to Case'}
            </Button>
            <Button 
              onClick={() => {
                // Handle reject - update case status and navigate back
                if (caseId) {
                  // In a real app, this would call an API to reject the case
                  addToast({
                    type: 'info',
                    title: t('language') === 'fr' ? 'Cas rejeté' : 'Case rejected',
                    message: t('language') === 'fr'
                      ? 'Le cas a été rejeté.'
                      : 'Case has been rejected.',
                  });
                }
                navigate('/review-cases?tab=pending');
              }}
              variant="outline"
              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              {t('language') === 'fr' ? 'Rejeter' : 'Reject'}
            </Button>
          </div>
        </div>
      </div>

      {/* Two-Column Layout with Citation Window Below */}
      <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-hidden">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'split' ? 'fullscreen-pdf' : 'split')}
            className="flex items-center gap-2"
          >
            {viewMode === 'split' ? (
              <>
                <Maximize2 className="h-4 w-4" />
                {t('language') === 'fr' ? 'Vue PDF complète' : 'Full PDF View'}
              </>
            ) : (
              <>
                <Minimize2 className="h-4 w-4" />
                {t('language') === 'fr' ? 'Vue divisée' : 'Split View'}
              </>
            )}
          </Button>
        </div>

        {/* Conditional Layout Based on View Mode */}
        {viewMode === 'fullscreen-pdf' ? (
          /* Full-Screen PDF View with Dictation */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {selectedDocument ? (
              <div className="flex-1 min-h-0 flex flex-col relative" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <PDFViewer 
                    document={selectedDocument}
                    onClose={() => setViewMode('split')}
                  />
                </div>
                {/* Dictation Button Overlay - Compact and Non-Intrusive */}
                <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
                  {/* Recording Status Indicator (only when recording) */}
                  {isRecording && (
                    <div className="bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="text-sm font-medium">
                        {formatDuration(recordingDuration)}
                      </span>
                    </div>
                  )}
                  
                  {/* Dictation Button */}
                  <Button
                    onClick={handleToggleDictation}
                    size={isRecording ? "lg" : "default"}
                    variant={isRecording ? "destructive" : "default"}
                    className={`flex items-center gap-2 shadow-lg transition-all ${
                      isRecording 
                        ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t('language') === 'fr' ? 'Arrêter' : 'Stop'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {t('language') === 'fr' ? 'Dictée' : 'Dictate'}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-center">
                  <p className="text-gray-500">
                    {t('language') === 'fr' 
                      ? 'Sélectionnez un document pour l\'afficher en plein écran'
                      : 'Select a document to view in full screen'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Split View: Two Columns - Document Viewer and Section 7 Editor */
          <>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
              {/* Left: Document List/Viewer */}
              <div className="h-full min-h-0">
                <DocumentList
                  documents={documents}
                  onDocumentSelect={handleDocumentSelect}
                  onDocumentUpload={handleDocumentUpload}
                  selectedDocumentId={selectedDocument?.id}
                />
              </div>

              {/* Right: Section 7 Summary Editor */}
              <div className="h-full min-h-0">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>{t('section7History')}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateHistory}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-3 w-3" />
                          {t('language') === 'fr' ? 'Générer l\'historique' : 'Generate History'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleToggleDictation}
                          className={`flex items-center gap-2 relative ${
                            isRecording 
                              ? 'bg-red-50 border-red-300 text-red-700' 
                              : ''
                          }`}
                        >
                          {isRecording && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />
                          )}
                          {isRecording ? (
                            <>
                              <MicOff className="h-3 w-3" />
                              <span>{t('language') === 'fr' ? 'Arrêter' : 'Stop'}</span>
                              {recordingDuration > 0 && (
                                <span className="text-xs ml-1">
                                  ({formatDuration(recordingDuration)})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3" />
                              <span>{t('language') === 'fr' ? 'Dictée' : 'Dictate'}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-4">
                    <RichTextEditor
                      value={section7Content}
                      onChange={setSection7Content}
                      placeholder={t('section7SummaryPlaceholder')}
                      className="h-full"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom: Citation Window - Full Width Row */}
            <div className="h-80 flex-shrink-0">
              <CitationWindow caseId={caseId} sectionContent={section7Content} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

