import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllAssignments, AssignedCase } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { ComplianceModal } from './ComplianceModal';

interface ComplianceFlag {
  id: string;
  caseId: string;
  caseName: string;
  type: 'missing_field' | 'incomplete_diagnosis' | 'missing_signature' | 'law25_consent' | 'pipeda_consent';
  severity: 'high' | 'medium' | 'low';
  message: string;
  section?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Mock compliance flags - in production, this would come from compliance service
const generateMockFlags = (assignments: AssignedCase[]): ComplianceFlag[] => {
  const flags: ComplianceFlag[] = [];
  
  // Generate flags for cases that are in_progress or completed
  assignments
    .filter((case_) => case_.status === 'in_progress' || case_.status === 'completed')
    .forEach((case_) => {
      // Randomly generate some flags for demo purposes
      if (Math.random() > 0.6) {
        flags.push({
          id: `flag-${case_.id}-1`,
          caseId: case_.id,
          caseName: case_.claimId || case_.fileName,
          type: 'missing_field',
          severity: 'high',
          message: 'Champ requis manquant: Date de blessure',
          section: 'Section 1',
        });
      }
      if (Math.random() > 0.7) {
        flags.push({
          id: `flag-${case_.id}-2`,
          caseId: case_.id,
          caseName: case_.claimId || case_.fileName,
          type: 'incomplete_diagnosis',
          severity: 'medium',
          message: 'Diagnostic incomplet dans Section 7',
          section: 'Section 7',
        });
      }
      if (Math.random() > 0.8) {
        flags.push({
          id: `flag-${case_.id}-3`,
          caseId: case_.id,
          caseName: case_.claimId || case_.fileName,
          type: 'missing_signature',
          severity: 'high',
          message: 'Signature du médecin manquante',
        });
      }
    });

  return flags;
};

export const ComplianceAlertsPanel: React.FC = () => {
  const { t } = useI18n();
  const [flags, setFlags] = useState<ComplianceFlag[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    const allAssignments = getAllAssignments();
    const mockFlags = generateMockFlags(allAssignments);
    setFlags(mockFlags);
  }, [refreshKey]);

  const flagsBySeverity = useMemo(() => {
    return {
      high: flags.filter((f) => f.severity === 'high'),
      medium: flags.filter((f) => f.severity === 'medium'),
      low: flags.filter((f) => f.severity === 'low'),
    };
  }, [flags]);

  const getSeverityColor = (severity: ComplianceFlag['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: ComplianceFlag['severity']) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: ComplianceFlag['type']) => {
    switch (type) {
      case 'missing_field':
        return t('missingField');
      case 'incomplete_diagnosis':
        return t('incompleteDiagnosis');
      case 'missing_signature':
        return t('missingSignature');
      case 'law25_consent':
        return t('law25Consent');
      case 'pipeda_consent':
        return t('pipedaConsent');
    }
  };

  // Convert flags to ComplianceModal format
  const modalFlags = flags.map((flag) => ({
    id: flag.id,
    caseId: flag.caseId,
    severity: flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'info',
    category: getTypeLabel(flag.type),
    description: flag.message,
    section: flag.section,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  }));

  const handleApproveFlag = (flagId: string) => {
    // In production, this would update the flag status via API
    setFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'approved' as const } : f))
    );
  };

  const handleRejectFlag = (flagId: string) => {
    // In production, this would update the flag status via API
    setFlags((prev) =>
      prev.map((f) => (f.id === flagId ? { ...f, status: 'rejected' as const } : f))
    );
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowModal(true)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('complianceAlerts')}</span>
          {flags.length > 0 && (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              {flags.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('casesRequiringAttention')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {flags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm">{t('noComplianceAlerts')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {flagsBySeverity.high.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-700 mb-2 uppercase">
                  {t('highPriority')} ({flagsBySeverity.high.length})
                </div>
                {flagsBySeverity.high.map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityColor(flag.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityIcon(flag.severity)}
                          <span className="text-xs font-medium">{getTypeLabel(flag.type)}</span>
                        </div>
                        <div className="text-sm font-medium mb-1">{flag.caseName}</div>
                        <div className="text-xs opacity-90">{flag.message}</div>
                        {flag.section && (
                          <div className="text-xs mt-1 opacity-75">Section: {flag.section}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flagsBySeverity.medium.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-yellow-700 mb-2 uppercase">
                  {t('mediumPriority')} ({flagsBySeverity.medium.length})
                </div>
                {flagsBySeverity.medium.map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityColor(flag.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityIcon(flag.severity)}
                          <span className="text-xs font-medium">{getTypeLabel(flag.type)}</span>
                        </div>
                        <div className="text-sm font-medium mb-1">{flag.caseName}</div>
                        <div className="text-xs opacity-90">{flag.message}</div>
                        {flag.section && (
                          <div className="text-xs mt-1 opacity-75">Section: {flag.section}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flagsBySeverity.low.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-blue-700 mb-2 uppercase">
                  {t('lowPriority')} ({flagsBySeverity.low.length})
                </div>
                {flagsBySeverity.low.map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-lg border mb-2 ${getSeverityColor(flag.severity)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityIcon(flag.severity)}
                          <span className="text-xs font-medium">{getTypeLabel(flag.type)}</span>
                        </div>
                        <div className="text-sm font-medium mb-1">{flag.caseName}</div>
                        <div className="text-xs opacity-90">{flag.message}</div>
                        {flag.section && (
                          <div className="text-xs mt-1 opacity-75">Section: {flag.section}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      </Card>

      <ComplianceModal
        open={showModal}
        onOpenChange={setShowModal}
        flags={modalFlags}
        onApprove={handleApproveFlag}
        onReject={handleRejectFlag}
      />
    </>
  );
};

