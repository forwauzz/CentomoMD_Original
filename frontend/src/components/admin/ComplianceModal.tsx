import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Info, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authClient';

interface ComplianceFlag {
  id: string;
  caseId: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  description: string;
  section?: string;
  recommendation?: string;
  legalReference?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flags: ComplianceFlag[];
  onApprove?: (flagId: string) => void;
  onReject?: (flagId: string) => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  open,
  onOpenChange,
  flags,
  onApprove,
  onReject,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set());

  const handleToggleFlag = (flagId: string) => {
    const newSelected = new Set(selectedFlags);
    if (newSelected.has(flagId)) {
      newSelected.delete(flagId);
    } else {
      newSelected.add(flagId);
    }
    setSelectedFlags(newSelected);
  };

  const handleApproveSelected = () => {
    selectedFlags.forEach((flagId) => {
      onApprove?.(flagId);
    });
    setSelectedFlags(new Set());
  };

  const handleRejectSelected = () => {
    selectedFlags.forEach((flagId) => {
      onReject?.(flagId);
    });
    setSelectedFlags(new Set());
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            {t('rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
            {t('pending')}
          </Badge>
        );
    }
  };

  const pendingFlags = flags.filter((f) => f.status === 'pending');
  const approvedFlags = flags.filter((f) => f.status === 'approved');
  const rejectedFlags = flags.filter((f) => f.status === 'rejected');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('complianceFlagsManagement')}
          </DialogTitle>
          <DialogDescription>{t('approveOrRejectFlags')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingFlags.length}</div>
                <div className="text-sm text-gray-600">{t('pending')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{approvedFlags.length}</div>
                <div className="text-sm text-gray-600">{t('approved')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{rejectedFlags.length}</div>
                <div className="text-sm text-gray-600">{t('rejected')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Flags */}
          {pendingFlags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {t('pendingFlags')} ({pendingFlags.length})
                </h3>
                {selectedFlags.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApproveSelected}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {t('approveSelected')} ({selectedFlags.size})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRejectSelected}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('rejectSelected')} ({selectedFlags.size})
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {pendingFlags.map((flag) => (
                  <Card
                    key={flag.id}
                    className={`cursor-pointer transition-colors ${
                      selectedFlags.has(flag.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleToggleFlag(flag.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFlags.has(flag.id)}
                          onChange={() => handleToggleFlag(flag.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(flag.severity)}
                            <Badge variant="outline" className={getSeverityBadgeColor(flag.severity)}>
                              {flag.category}
                            </Badge>
                            {flag.section && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                {t('section')} {flag.section}
                              </Badge>
                            )}
                            {getStatusBadge(flag.status)}
                          </div>
                          <p className="text-sm text-gray-900">{flag.description}</p>
                          {flag.recommendation && (
                            <p className="text-xs text-gray-600 italic">
                              {t('recommendation')}: {flag.recommendation}
                            </p>
                          )}
                          {flag.legalReference && (
                            <p className="text-xs text-gray-500">
                              {t('legalReference')}: {flag.legalReference}
                            </p>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApprove?.(flag.id);
                              }}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {t('approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReject?.(flag.id);
                              }}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              {t('reject')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Approved/Rejected Flags (Collapsed) */}
          {(approvedFlags.length > 0 || rejectedFlags.length > 0) && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">{t('history')}</h3>
              <div className="space-y-2">
                {[...approvedFlags, ...rejectedFlags].map((flag) => (
                  <Card key={flag.id} className="opacity-75">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(flag.severity)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getSeverityBadgeColor(flag.severity)}>
                              {flag.category}
                            </Badge>
                            {getStatusBadge(flag.status)}
                            {flag.reviewedBy && (
                              <span className="text-xs text-gray-500">
                                {t('by')} {flag.reviewedBy}
                                {flag.reviewedAt && (
                                  <> • {new Date(flag.reviewedAt).toLocaleDateString(t('language') === 'fr' ? 'fr-CA' : 'en-CA')}</>
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{flag.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {flags.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm">{t('noComplianceFlags')}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

