import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Send, 
  Database,
  Upload,
  Eye,
  FileCheck,
  Building2,
  Briefcase,
  Stethoscope,
  LayoutGrid
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import { useCaseStore } from '@/stores/caseStore';
import { useUserStore } from '@/stores/userStore';
import { ClinicSelectionModal } from '@/components/case/ClinicSelectionModal';
import { useI18n } from '@/lib/i18n';
import { CalendarEventModal } from '@/components/calendar/CalendarEventModal';
import { bookCaseAppointment } from '@/utils/calendarUtils';
import { SubmissionStatusTracker } from '@/components/case/SubmissionStatusTracker';
import { archiveCase } from '@/utils/archiveUtils';
import { Archive, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { exportToPdf, downloadBlob } from '@/utils/exportUtils';
import { Download, Printer } from 'lucide-react';

interface ReviewCase {
  id: string;
  patientName: string;
  claimId: string;
  injuryDate: string;
  status: 'pending_review' | 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedAt: string;
  clinicName?: string; // Optional since cases can come from other sources
  source: {
    type: 'cnesst' | 'employer' | 'clinic';
    name: string; // Name of the source (CNESST, employer name, or clinic name)
  };
  priority?: 'low' | 'medium' | 'high';
  rejectedAt?: string;
  rejectionReason?: string;
}

export const ReviewCasesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = useUIStore(state => state.addToast);
  const { createNewCase } = useCaseStore();
  const { t, language } = useI18n();
  
  // Get initial tab from URL params, default to 'pending'
  const initialTab = (searchParams.get('tab') as 'pending' | 'in_progress' | 'completed' | 'rejected') || 'pending';
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed' | 'rejected'>(initialTab);
  
  // Update URL when tab changes
  useEffect(() => {
    if (searchParams.get('tab') !== activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, searchParams, setSearchParams]);
  
  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['pending', 'in_progress', 'completed', 'rejected'].includes(tabParam)) {
      setActiveTab(tabParam as 'pending' | 'in_progress' | 'completed' | 'rejected');
    }
  }, [searchParams]);
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [allCases, setAllCases] = useState<ReviewCase[]>([]); // Store all cases for badge counts
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ReviewCase | null>(null);
  const [showReviewView, setShowReviewView] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [pendingCaseForAccept, setPendingCaseForAccept] = useState<ReviewCase | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewCase, setPreviewCase] = useState<ReviewCase | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const profile = useUserStore((s) => s.profile);

  useEffect(() => {
    loadCases();
  }, [activeTab]);

  const loadCases = async () => {
    setLoading(true);
    try {
      // Import mock data from shared file
      const { MOCK_REVIEW_CASES } = await import('@/data/mockReviewCases');
      const mockCases = MOCK_REVIEW_CASES;

      // Use existing allCases if available (to preserve rejections), otherwise use mockCases
      const casesToUse = allCases.length > 0 ? allCases : mockCases;
      
      // Store all cases for badge counts (only update if not already set)
      if (allCases.length === 0) {
        setAllCases(casesToUse);
      }

      // Filter by active tab
      const filtered = casesToUse.filter(c => {
        if (activeTab === 'pending') {
          return c.status === 'pending_review' || c.status === 'pending';
        }
        return c.status === activeTab;
      });

      setCases(filtered);
    } catch (error) {
      console.error('Failed to load cases:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les cas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (case_: ReviewCase) => {
    // Check if user has a default clinic
    if (!profile?.default_clinic_id) {
      // Show clinic selection modal
      setPendingCaseForAccept(case_);
      setShowClinicModal(true);
      return;
    }

    // User has default clinic, proceed with case creation
    await createCaseWithClinic(case_, profile.default_clinic_id);
  };

  const handleClinicSelected = async (clinic: any) => {
    if (!pendingCaseForAccept) return;

    try {
      await createCaseWithClinic(pendingCaseForAccept, clinic.id);
      setShowClinicModal(false);
      setPendingCaseForAccept(null);
    } catch (error) {
      console.error('Error creating case with selected clinic:', error);
    }
  };

  const createCaseWithClinic = async (case_: ReviewCase, clinicId: string) => {
    try {
      console.log('📝 Creating case with clinic:', { clinicId, case: case_ });
      
      // Create case directly via API with clinic_id (similar to PrimarySidebar approach)
      const clientToken = crypto.randomUUID();
      const requestBody = {
        clinic_id: clinicId,
        client_token: clientToken,
        patientInfo: {
          name: case_.patientName,
          claimId: case_.claimId,
          injuryDate: case_.injuryDate
        },
        metadata: {
          language: 'fr',
          status: 'draft'
        }
      };
      
      console.log('📤 Sending request:', requestBody);
      
      const response = await apiFetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response received:', response);

      if (response.success) {
        const caseId = response.data.id;
        
        console.log('✅ Case created successfully:', caseId);
        
        addToast({
          type: 'success',
          title: 'Cas accepté',
          message: `Le cas ${case_.claimId} a été accepté.`
        });

        // Show booking modal to schedule appointment
        setCaseToBook({
          id: caseId,
          name: case_.patientName || case_.claimId || case_.fileName,
        });
        setShowBookingModal(true);
      } else {
        console.error('❌ Case creation failed:', response);
        throw new Error(response.error || 'Failed to create case');
      }
    } catch (error: any) {
      console.error('❌ Error creating case:', error);
      const errorMessage = error?.message || 'Impossible d\'accepter le cas.';
      addToast({
        type: 'error',
        title: 'Erreur',
        message: errorMessage
      });
    }
  };

  const handleBookAppointment = (date: string, time: string) => {
    if (caseToBook) {
      bookCaseAppointment(caseToBook.id, date, time);
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Rendez-vous planifié' : 'Appointment Scheduled',
        message: t('language') === 'fr'
          ? `Le cas a été planifié pour le ${date} à ${time}`
          : `Case scheduled for ${date} at ${time}`,
      });
      setCaseToBook(null);
      setShowBookingModal(false);
      // Navigate to case editor after booking
      if (caseToBook.id) {
        navigate(`/case/edit/${caseToBook.id}`);
      }
    }
  };

  const handleReject = async (case_: ReviewCase) => {
    try {
      // In real implementation, this would call an API
      addToast({
        type: 'info',
        title: 'Cas rejeté',
        message: `Le cas ${case_.claimId} a été rejeté.`
      });

      // Update case status to rejected in both arrays
      const updatedCase = {
        ...case_,
        status: 'rejected' as const,
        rejectedAt: new Date().toISOString()
      };
      
      setAllCases(allCases.map(c => c.id === case_.id ? updatedCase : c));
      setCases(cases.map(c => c.id === case_.id ? updatedCase : c));
      
      // If we're on the pending tab and there are no more pending cases, switch to rejected tab
      if (activeTab === 'pending') {
        const remainingPending = cases.filter(c => 
          c.id !== case_.id && (c.status === 'pending_review' || c.status === 'pending')
        );
        if (remainingPending.length === 0) {
          setActiveTab('rejected');
        }
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de rejeter le cas.'
      });
    }
  };

  const handleGenerateSummary = async (case_: ReviewCase) => {
    try {
      // Generate summary and save to drafts
      addToast({
        type: 'success',
        title: 'Résumé généré',
        message: 'Le résumé a été généré et sauvegardé dans vos brouillons.'
      });

      // Update case status to in_progress
      setCases(cases.map(c => 
        c.id === case_.id ? { ...c, status: 'in_progress' } : c
      ));
      setShowReviewView(false);
      setActiveTab('in_progress');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer le résumé.'
      });
    }
  };

  const handleSubmitToClinic = async (case_: ReviewCase) => {
    try {
      addToast({
        type: 'success',
        title: 'Soumis à la clinique',
        message: `Le cas ${case_.claimId} a été soumis à l'administrateur de la clinique.`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de soumettre le cas.'
      });
    }
  };

  const handlePushToEMR = async (case_: ReviewCase) => {
    try {
      addToast({
        type: 'success',
        title: 'Envoyé à l\'EMR',
        message: `Le cas ${case_.claimId} a été envoyé au système EMR.`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer le cas à l\'EMR.'
      });
    }
  };

  const handleSendToCNESST = async (case_: ReviewCase) => {
    try {
      addToast({
        type: 'success',
        title: 'Envoyé à la CNESST',
        message: `Le cas ${case_.claimId} a été envoyé directement à la CNESST.`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer le cas à la CNESST.'
      });
    }
  };

  const handlePreviewCompletedCase = async (case_: ReviewCase) => {
    setPreviewCase(case_);
    setShowPreviewModal(true);
    setPreviewLoading(true);
    
    try {
      // Load case data from localStorage (where completed cases are stored)
      const caseDataStr = localStorage.getItem(`case_${case_.id}`);
      let caseData: any = null;
      
      if (caseDataStr) {
        caseData = JSON.parse(caseDataStr);
      } else {
        // Try to load from API if not in localStorage
        try {
          const apiCase = await apiFetch(`/api/cases/${case_.id}`);
          if (apiCase && apiCase.id) {
            caseData = {
              id: apiCase.id,
              patientName: apiCase.patientInfo?.name || case_.patientName,
              claimId: apiCase.patientInfo?.claimId || case_.claimId,
              sections: apiCase.sections || {},
            };
          }
        } catch (apiError) {
          console.error('Error loading case from API:', apiError);
        }
      }
      
      // If still no case data, create a minimal structure from ReviewCase
      if (!caseData) {
        caseData = {
          id: case_.id,
          patientName: case_.patientName,
          claimId: case_.claimId,
          sections: {},
        };
      }
      
      // Generate PDF preview
      const pdfBlob = await exportToPdf(caseData);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPreviewUrl(pdfUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de générer l\'aperçu du rapport.'
          : 'Unable to generate report preview.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreviewModal(false);
    setPreviewCase(null);
    setPreviewUrl(null);
  };

  const handleDownloadPreview = async () => {
    if (!previewCase || !previewUrl) return;
    
    try {
      // Fetch the blob from the URL
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      
      const fileName = `${previewCase.claimId || 'case'}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadBlob(blob, fileName);
      
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Téléchargement réussi' : 'Download successful',
        message: t('language') === 'fr'
          ? 'Le rapport a été téléchargé.'
          : 'Report has been downloaded.',
      });
    } catch (error) {
      console.error('Error downloading preview:', error);
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur' : 'Error',
        message: t('language') === 'fr'
          ? 'Impossible de télécharger le rapport.'
          : 'Unable to download report.',
      });
    }
  };

  const handlePrintPreview = () => {
    if (!previewUrl) return;
    
    const printWindow = window.open(previewUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  const getSourceInfo = (source: ReviewCase['source']) => {
    switch (source.type) {
      case 'cnesst':
        return {
          label: 'CNESST',
          icon: Building2,
          color: 'text-[#009639]',
          bgColor: 'bg-[#009639]/10',
          borderColor: 'border-[#009639]/20'
        };
      case 'employer':
        return {
          label: 'Employeur',
          icon: Briefcase,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'clinic':
        return {
          label: 'Clinique',
          icon: Stethoscope,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
    }
  };

  if (showReviewView && selectedCase) {
    return (
      <CaseReviewView
        case_={selectedCase}
        onBack={() => {
          setShowReviewView(false);
          setSelectedCase(null);
        }}
        onGenerateSummary={() => handleGenerateSummary(selectedCase)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('reviewCases')}</h1>
        <p className="text-gray-600 mt-1">{t('manageAssignedCases')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">
            {t('pendingReview')}
            {allCases.filter(c => c.status === 'pending_review' || c.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-red-600">{allCases.filter(c => c.status === 'pending_review' || c.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            {t('inProgress')}
            {allCases.filter(c => c.status === 'in_progress').length > 0 && (
              <Badge className="ml-2 bg-blue-600">{allCases.filter(c => c.status === 'in_progress').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('completed')}
            {allCases.filter(c => c.status === 'completed').length > 0 && (
              <Badge className="ml-2 bg-green-600">{allCases.filter(c => c.status === 'completed').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            {t('rejected')}
            {allCases.filter(c => c.status === 'rejected').length > 0 && (
              <Badge className="ml-2 bg-red-600">{allCases.filter(c => c.status === 'rejected').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <div className="text-center py-12">{t('loading')}</div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPendingCases')}</h3>
                <p className="text-gray-600">{t('noPendingCases')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{case_.patientName}</h3>
                          <Badge variant="outline">{case_.claimId}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Source:</span>{' '}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                              {(() => {
                                const sourceInfo = getSourceInfo(case_.source);
                                const Icon = sourceInfo.icon;
                                return (
                                  <>
                                    <Icon className={`h-3 w-3 ${sourceInfo.color}`} />
                                    <span>{case_.source.name}</span>
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Date lésion:</span>{' '}
                            {new Date(case_.injuryDate).toLocaleDateString('fr-CA')}
                          </div>
                          <div>
                            <span className="font-medium">Assigné:</span>{' '}
                            {new Date(case_.assignedAt).toLocaleDateString('fr-CA')}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/case/review/${case_.id}`);
                          }}
                          className="flex items-center space-x-2"
                        >
                          <LayoutGrid className="h-4 w-4" />
                          <span>{t('review')}</span>
                        </Button>
                        <Button
                          onClick={() => handleAccept(case_)}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Accepter</span>
                        </Button>
                        <Button
                          onClick={() => handleReject(case_)}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Rejeter</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          {loading ? (
            <div className="text-center py-12">{t('loading')}</div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCasesInProgress')}</h3>
                <p className="text-gray-600">{t('noCasesInProgress')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/case/edit/${case_.id}`)}>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{case_.patientName}</h3>
                          <Badge variant="outline">{case_.claimId}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{t('source')}:</span>{' '}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                            {(() => {
                              const sourceInfo = getSourceInfo(case_.source);
                              const Icon = sourceInfo.icon;
                              return (
                                <>
                                  <Icon className={`h-3 w-3 ${sourceInfo.color}`} />
                                  <span>{case_.source.name}</span>
                                </>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/case/review/${case_.id}`);
                          }}
                          className="flex items-center gap-2"
                        >
                          <LayoutGrid className="h-4 w-4" />
                          {t('language') === 'fr' ? 'Réviser' : 'Review'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/case/edit/${case_.id}`);
                          }}
                        >
                          {t('continue')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {loading ? (
            <div className="text-center py-12">{t('loading')}</div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCasesCompleted')}</h3>
                <p className="text-gray-600">{t('noCasesCompleted')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{case_.patientName}</h3>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {t('completed')}
                          </Badge>
                          <Badge variant="outline">{case_.claimId}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <span className="font-medium">{t('source')}:</span>{' '}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                            {(() => {
                              const sourceInfo = getSourceInfo(case_.source);
                              const Icon = sourceInfo.icon;
                              return (
                                <>
                                  <Icon className={`h-3 w-3 ${sourceInfo.color}`} />
                                  <span>{case_.source.name}</span>
                                </>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewCompletedCase(case_);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <LayoutGrid className="h-4 w-4" />
                          <span>{t('review')}</span>
                        </Button>
                        <Button
                          onClick={() => handleSubmitToClinic(case_)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Send className="h-4 w-4" />
                          <span>{t('submitToClinic')}</span>
                        </Button>
                        <Button
                          onClick={() => handlePushToEMR(case_)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Database className="h-4 w-4" />
                          <span>{t('sendToEMR')}</span>
                        </Button>
                        <Button
                          onClick={() => handleSendToCNESST(case_)}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>{t('sendToCNESST')}</span>
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(t('language') === 'fr' ? 'Archiver ce cas?' : 'Archive this case?')) {
                              archiveCase(case_.id, profile?.id || 'user');
                              addToast({
                                type: 'success',
                                title: t('language') === 'fr' ? 'Cas archivé' : 'Case Archived',
                                message: t('language') === 'fr' ? 'Le cas a été archivé' : 'Case has been archived',
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Archive className="h-4 w-4" />
                          <span>{t('language') === 'fr' ? 'Archiver' : 'Archive'}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {loading ? (
            <div className="text-center py-12">{t('loading')}</div>
          ) : cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCasesRejected')}</h3>
                <p className="text-gray-600">{t('noCasesRejected')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{case_.patientName}</h3>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {t('rejectedStatus')}
                          </Badge>
                          <Badge variant="outline">{case_.claimId}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">{t('source')}:</span>{' '}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                              {(() => {
                                const sourceInfo = getSourceInfo(case_.source);
                                const Icon = sourceInfo.icon;
                                return (
                                  <>
                                    <Icon className={`h-3 w-3 ${sourceInfo.color}`} />
                                    <span>{case_.source.name}</span>
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{t('injuryDateLabel')}:</span>{' '}
                            {new Date(case_.injuryDate).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA')}
                          </div>
                          <div>
                            <span className="font-medium">{t('assignedDate')}:</span>{' '}
                            {new Date(case_.assignedAt).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA')}
                          </div>
                          {case_.rejectedAt && (
                            <div>
                              <span className="font-medium">{t('rejectedDate')}:</span>{' '}
                              {new Date(case_.rejectedAt).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA')}
                            </div>
                          )}
                        </div>
                        {case_.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <span className="text-sm font-medium text-red-900">{t('rejectionReason')}:</span>
                            <p className="text-sm text-red-700 mt-1">{case_.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Completed Case Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t('language') === 'fr' 
                ? `Aperçu du rapport - ${previewCase?.claimId || ''}`
                : `Report Preview - ${previewCase?.claimId || ''}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden border rounded-lg bg-gray-100 min-h-[600px]">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">{t('language') === 'fr' ? 'Génération de l\'aperçu...' : 'Generating preview...'}</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
                title="Report Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  {t('language') === 'fr' 
                    ? 'Impossible de charger l\'aperçu du rapport.'
                    : 'Unable to load report preview.'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreview}>
              {t('language') === 'fr' ? 'Fermer' : 'Close'}
            </Button>
            <Button variant="outline" onClick={handlePrintPreview} disabled={!previewUrl || previewLoading}>
              <Printer className="h-4 w-4 mr-2" />
              {t('language') === 'fr' ? 'Imprimer' : 'Print'}
            </Button>
            <Button onClick={handleDownloadPreview} disabled={!previewUrl || previewLoading} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t('language') === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface CaseReviewViewProps {
  case_: ReviewCase;
  onBack: () => void;
  onGenerateSummary: () => void;
}

const CaseReviewView: React.FC<CaseReviewViewProps> = ({ case_, onBack, onGenerateSummary }) => {
  const getSourceInfo = (source: ReviewCase['source']) => {
    switch (source.type) {
      case 'cnesst':
        return {
          label: 'CNESST',
          icon: Building2,
          color: 'text-[#009639]',
          bgColor: 'bg-[#009639]/10',
          borderColor: 'border-[#009639]/20'
        };
      case 'employer':
        return {
          label: 'Employeur',
          icon: Briefcase,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'clinic':
        return {
          label: 'Clinique',
          icon: Stethoscope,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
    }
  };

  const sourceInfo = getSourceInfo(case_.source);
  const SourceIcon = sourceInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Révision du cas</h1>
          <p className="text-gray-600 mt-1">{case_.claimId} - {case_.patientName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentation du patient</CardTitle>
          <CardDescription>
            Informations et documents relatifs à ce cas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nom du patient</label>
              <p className="text-sm font-medium">{case_.patientName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Réclamation CNESST</label>
              <p className="text-sm font-medium">{case_.claimId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date de lésion</label>
              <p className="text-sm font-medium">
                {new Date(case_.injuryDate).toLocaleDateString('fr-CA')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Source</label>
              <div className="flex items-center gap-2 mt-1">
                <SourceIcon className={`h-4 w-4 ${sourceInfo.color}`} />
                <p className="text-sm font-medium">{case_.source.name}</p>
              </div>
            </div>
          </div>

          {/* Mock Documentation Sections */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium">Documents disponibles</h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Rapport médical initial</p>
                    <p className="text-xs text-gray-500">2024-04-20</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Radiographie lombaire</p>
                    <p className="text-xs text-gray-500">2024-04-21</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Notes d'évolution</p>
                    <p className="text-xs text-gray-500">2024-04-22</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
              </div>
            </div>
          </div>

          {/* Generate Summary Button */}
          <div className="border-t pt-6">
            <Button
              onClick={onGenerateSummary}
              size="lg"
              className="w-full sm:w-auto flex items-center space-x-2"
            >
              <FileCheck className="h-5 w-5" />
              <span>Générer le résumé</span>
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Le résumé sera généré et sauvegardé automatiquement dans vos brouillons.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clinic Selection Modal */}
      <ClinicSelectionModal
        isOpen={showClinicModal}
        onClose={() => {
          setShowClinicModal(false);
          setPendingCaseForAccept(null);
        }}
        onSelectClinic={handleClinicSelected}
        title="Sélectionner une clinique"
        description="Veuillez sélectionner une clinique pour créer ce cas patient"
      />

      <CalendarEventModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        caseId={caseToBook?.id}
        caseName={caseToBook?.name}
        doctorId={profile?.id}
        onBook={handleBookAppointment}
      />
    </div>
  );
};

