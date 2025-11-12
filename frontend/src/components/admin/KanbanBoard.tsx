import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getAllAssignments, AssignedCase, updateCaseStatus, submitCase, reviewCase, rejectCase } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authClient';
import { Building2, Briefcase, Stethoscope, ChevronRight, User, CheckCircle, XCircle } from 'lucide-react';

type KanbanColumn = 'new' | 'in_progress' | 'in_review' | 'submitted';

interface KanbanColumnConfig {
  id: KanbanColumn;
  statuses: AssignedCase['status'][];
  nextStatus?: AssignedCase['status'];
}

const COLUMN_CONFIGS: KanbanColumnConfig[] = [
  {
    id: 'new',
    statuses: ['pending', 'pending_review'],
    nextStatus: 'in_progress',
  },
  {
    id: 'in_progress',
    statuses: ['in_progress'],
    nextStatus: 'completed',
  },
  {
    id: 'in_review',
    statuses: ['completed'],
    nextStatus: undefined, // Submitted is final
  },
  {
    id: 'submitted',
    statuses: ['submitted'],
    nextStatus: undefined,
  },
];

// Mock doctor names - in production, this would come from API
const MOCK_DOCTORS: Record<string, string> = {
  'doctor-1': 'Dr. Harry Durusso',
  'doctor-2': 'Dr. Marie Dubois',
  'doctor-3': 'Dr. Jean Tremblay',
};

export const KanbanBoard: React.FC = () => {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCase, setSelectedCase] = useState<AssignedCase | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isDragging, setIsDragging] = useState<string | null>(null);
  
  // Check user role
  const userRole = user?.role || 'user';
  const isQA = userRole === 'qa' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  const casesByColumn = useMemo(() => {
    const allCases = getAllAssignments();
    const columns: Record<KanbanColumn, AssignedCase[]> = {
      new: [],
      in_progress: [],
      in_review: [],
      submitted: [],
    };

    allCases.forEach((case_) => {
      // Map cases to columns based on status
      if (case_.status === 'pending' || case_.status === 'pending_review') {
        columns.new.push(case_);
      } else if (case_.status === 'in_progress') {
        columns.in_progress.push(case_);
      } else if (case_.status === 'completed') {
        columns.in_review.push(case_);
      } else if (case_.status === 'submitted') {
        columns.submitted.push(case_);
      }
    });

    return columns;
  }, [refreshKey]);

  const handleMoveCase = (case_: AssignedCase, targetColumn: KanbanColumn) => {
    const config = COLUMN_CONFIGS.find((c) => c.id === targetColumn);
    if (!config || !config.nextStatus) {
      // Can't move to this column or it's a final state
      return;
    }

    updateCaseStatus(case_.id, config.nextStatus);
    setRefreshKey((prev) => prev + 1);
  };

  const handleDragStart = (e: React.DragEvent, caseId: string) => {
    setIsDragging(caseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumn: KanbanColumn) => {
    e.preventDefault();
    if (!isDragging) return;

    const case_ = getAllAssignments().find((c) => c.id === isDragging);
    if (!case_) {
      setIsDragging(null);
      return;
    }

    // Check if move is valid
    const currentColumn = getCaseColumn(case_);
    const canMove = canMoveBetweenColumns(currentColumn, targetColumn);
    
    if (canMove) {
      if (targetColumn === 'submitted') {
        // Special handling for submission
        if (isQA && case_.assignedTo) {
          submitCase(case_.id, user?.id || 'qa', case_.assignedTo);
        } else {
          submitCase(case_.id, user?.id || 'user');
        }
      } else {
        handleMoveCase(case_, targetColumn);
      }
    }
    
    setIsDragging(null);
    setRefreshKey((prev) => prev + 1);
  };

  const getCaseColumn = (case_: AssignedCase): KanbanColumn => {
    if (case_.status === 'pending' || case_.status === 'pending_review') return 'new';
    if (case_.status === 'in_progress') return 'in_progress';
    if (case_.status === 'completed') return 'in_review';
    if (case_.status === 'submitted') return 'submitted';
    return 'new';
  };

  const canMoveBetweenColumns = (from: KanbanColumn, to: KanbanColumn): boolean => {
    // Allow forward moves only
    const order: KanbanColumn[] = ['new', 'in_progress', 'in_review', 'submitted'];
    const fromIndex = order.indexOf(from);
    const toIndex = order.indexOf(to);
    return toIndex > fromIndex && toIndex - fromIndex === 1;
  };

  const handleReviewAndSubmit = () => {
    if (!selectedCase) return;
    
    // Record review
    if (isQA) {
      reviewCase(selectedCase.id, user?.id || 'qa', reviewNotes);
    }
    
    // Submit on behalf of doctor
    if (selectedCase.assignedTo) {
      submitCase(selectedCase.id, user?.id || 'qa', selectedCase.assignedTo);
    } else {
      submitCase(selectedCase.id, user?.id || 'qa');
    }
    
    setShowReviewModal(false);
    setReviewNotes('');
    setSelectedCase(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleReject = () => {
    if (!selectedCase) return;
    
    rejectCase(selectedCase.id, user?.id || 'qa', reviewNotes);
    setShowReviewModal(false);
    setReviewNotes('');
    setSelectedCase(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSubmitClick = (case_: AssignedCase) => {
    if (isQA) {
      // QA can review before submitting
      setSelectedCase(case_);
      setShowReviewModal(true);
    } else {
      // Doctor submits directly
      submitCase(case_.id, user?.id || 'user');
      setRefreshKey((prev) => prev + 1);
    }
  };

  const getSourceInfo = (source: AssignedCase['source']) => {
    switch (source.type) {
      case 'cnesst':
        return { icon: Building2, color: 'text-[#009639]' };
      case 'employer':
        return { icon: Briefcase, color: 'text-blue-600' };
      case 'clinic':
        return { icon: Stethoscope, color: 'text-purple-600' };
    }
  };

  const getColumnLabel = (column: KanbanColumn): string => {
    switch (column) {
      case 'new':
        return t('pendingReview');
      case 'in_progress':
        return t('inProgress');
      case 'in_review':
        return t('inReview');
      case 'submitted':
        return t('submitted');
    }
  };

  const getColumnNextLabel = (column: KanbanColumn): string => {
    switch (column) {
      case 'new':
        return t('start');
      case 'in_progress':
        return t('markInReview');
      case 'in_review':
        return t('submit');
      case 'submitted':
        return '';
    }
  };

  const CaseCard: React.FC<{ case_: AssignedCase; currentColumn: KanbanColumn }> = ({
    case_,
    currentColumn,
  }) => {
    const sourceInfo = getSourceInfo(case_.source);
    const Icon = sourceInfo.icon;
    const nextColumn = COLUMN_CONFIGS.find((c, idx) => {
      const currentIdx = COLUMN_CONFIGS.findIndex((col) => col.id === currentColumn);
      return idx === currentIdx + 1;
    });

    return (
      <Card
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedCase(case_)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {case_.claimId || case_.id.substring(0, 8)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{case_.fileName}</div>
              </div>
              <Icon className={`h-4 w-4 ${sourceInfo.color} flex-shrink-0`} />
            </div>

            {case_.patientName && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span>{case_.patientName}</span>
              </div>
            )}

            {case_.assignedTo && MOCK_DOCTORS[case_.assignedTo] && (
              <div className="text-xs text-gray-500">
                {t('doctor')}: {MOCK_DOCTORS[case_.assignedTo]}
              </div>
            )}

            {case_.injuryDate && (
              <div className="text-xs text-gray-500">
                {t('injuryDate')}:{' '}
                {new Date(case_.injuryDate).toLocaleDateString(
                  language === 'fr' ? 'fr-CA' : 'en-CA'
                )}
              </div>
            )}

            {nextColumn && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  if (nextColumn.id === 'submitted') {
                    handleSubmitClick(case_);
                  } else {
                    handleMoveCase(case_, nextColumn.id);
                  }
                }}
              >
                {getColumnNextLabel(currentColumn)}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            {/* QA Review Actions in In Review column */}
            {currentColumn === 'in_review' && isQA && (
              <div className="flex gap-1 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs text-green-600 border-green-300 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCase(case_);
                    setShowReviewModal(true);
                  }}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('review')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('kanbanView')}</h2>
          <p className="text-white/80 text-sm mt-1">{t('manageCasesByMoving')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMN_CONFIGS.map((config) => {
          const cases = casesByColumn[config.id];
          return (
            <div key={config.id} className="flex flex-col">
              <div className="bg-white rounded-t-lg p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{getColumnLabel(config.id)}</h3>
                  <Badge variant="outline" className="bg-gray-100">
                    {cases.length}
                  </Badge>
                </div>
              </div>
              <div
                className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] max-h-[600px] overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, config.id)}
              >
                {cases.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">{t('noCases')}</div>
                ) : (
                  cases.map((case_) => (
                    <div
                      key={case_.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, case_.id)}
                      className={isDragging === case_.id ? 'opacity-50' : ''}
                    >
                      <CaseCard case_={case_} currentColumn={config.id} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Details Modal */}
      {selectedCase && !showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t('caseDetails')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCase(null)}
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">{t('case')}:</span>{' '}
                    {selectedCase.claimId || selectedCase.id.substring(0, 8)}
                  </div>
                  <div>
                    <span className="font-medium">{t('worker')}:</span>{' '}
                    {selectedCase.patientName || '-'}
                  </div>
                  {selectedCase.assignedTo && MOCK_DOCTORS[selectedCase.assignedTo] && (
                    <div>
                      <span className="font-medium">{t('doctor')}:</span>{' '}
                      {MOCK_DOCTORS[selectedCase.assignedTo]}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">{t('source')}:</span>{' '}
                    {selectedCase.source.name}
                  </div>
                  <div>
                    <span className="font-medium">{t('injuryDate')}:</span>{' '}
                    {selectedCase.injuryDate
                      ? new Date(selectedCase.injuryDate).toLocaleDateString(
                          language === 'fr' ? 'fr-CA' : 'en-CA'
                        )
                      : '-'}
                  </div>
                  {selectedCase.submittedBy && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        {t('submittedBy')}: {selectedCase.submittedBy}
                        {selectedCase.submittedAt && (
                          <> ({new Date(selectedCase.submittedAt).toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA')})</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QA Review Modal */}
      {showReviewModal && selectedCase && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('reviewAndSubmit')}</DialogTitle>
              <DialogDescription>
                {selectedCase.assignedTo && MOCK_DOCTORS[selectedCase.assignedTo] && (
                  <span>
                    {t('reviewCaseFrom')} {MOCK_DOCTORS[selectedCase.assignedTo]}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="review-notes">{t('reviewNotesOptional')}</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={t('addReviewNotes')}
                  rows={4}
                />
              </div>
              {selectedCase.reviewNotes && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-xs text-gray-500 mb-1">{t('previousNotes')}:</div>
                  <div className="text-sm">{selectedCase.reviewNotes}</div>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewNotes('');
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleReject}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('reject')}
              </Button>
              <Button
                onClick={handleReviewAndSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('approveAndSubmit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

