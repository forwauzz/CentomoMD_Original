import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2, FileCheck } from 'lucide-react';
import { verifyLegalCompliance, type LegalVerificationResponse, type LegalIssue } from '@/services/legalVerification';
import { useI18n } from '@/lib/i18n';
import { useUIStore } from '@/stores/uiStore';

interface ComplianceValidatorProps {
  caseData: any;
  onValidationComplete?: (result: LegalVerificationResponse) => void;
  showButton?: boolean;
  compact?: boolean;
}

export const ComplianceValidator: React.FC<ComplianceValidatorProps> = ({
  caseData,
  onValidationComplete,
  showButton = true,
  compact = false,
}) => {
  const { t } = useI18n();
  const addToast = useUIStore(state => state.addToast);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<LegalVerificationResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleValidate = async () => {
    if (!caseData) {
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Données manquantes' : 'Missing data',
        message: t('language') === 'fr'
          ? 'Impossible de vérifier: données du cas non disponibles.'
          : 'Unable to validate: case data not available.',
      });
      return;
    }

    setLoading(true);
    setShowModal(true);

    try {
      addToast({
        type: 'info',
        title: t('language') === 'fr' ? 'Vérification en cours' : 'Validation in progress',
        message: t('language') === 'fr'
          ? 'Analyse de la conformité légale en cours...'
          : 'Analyzing legal compliance...',
      });

      const result = await verifyLegalCompliance({
        caseData,
        sections: caseData.sections || {},
      });

      setValidationResult(result);
      onValidationComplete?.(result);

      const title = result.compliant
        ? (t('language') === 'fr' ? 'Conforme' : 'Compliant')
        : (t('language') === 'fr' ? 'Révision nécessaire' : 'Review needed');
      
      const defaultMessage = result.compliant
        ? (t('language') === 'fr'
          ? 'Le dossier est conforme aux exigences légales.'
          : 'The case is compliant with legal requirements.')
        : (t('language') === 'fr'
          ? 'Des problèmes de conformité ont été détectés.'
          : 'Compliance issues have been detected.');

      addToast({
        type: result.compliant ? 'success' : 'warning',
        title,
        message: result.summary || defaultMessage,
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (t('language') === 'fr' ? 'Une erreur est survenue' : 'An error occurred');
      addToast({
        type: 'error',
        title: t('language') === 'fr' ? 'Erreur de vérification' : 'Validation error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'needs_review':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
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

  const isCompliant = validationResult?.compliant ?? false;
  const canGenerateReport = isCompliant;

  if (compact) {
    return (
      <>
        {showButton && (
          <Button
            onClick={handleValidate}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('language') === 'fr' ? 'Vérification...' : 'Validating...'}
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                {t('validate')}
              </>
            )}
          </Button>
        )}

        {validationResult && (
          <Badge
            variant="outline"
            className={`${getSeverityBadgeColor(validationResult.overallStatus === 'compliant' ? 'info' : validationResult.overallStatus === 'non_compliant' ? 'error' : 'warning')} ml-2`}
          >
            {getStatusIcon(validationResult.overallStatus)}
            <span className="ml-1">
              {validationResult.compliant
                ? (t('language') === 'fr' ? 'Conforme' : 'Compliant')
                : (t('language') === 'fr' ? 'Révision nécessaire' : 'Review needed')}
            </span>
          </Badge>
        )}

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {validationResult && getStatusIcon(validationResult.overallStatus)}
                {t('language') === 'fr' ? 'Résultats de validation' : 'Validation Results'}
              </DialogTitle>
              <DialogDescription>
                {validationResult?.summary || (t('language') === 'fr'
                  ? 'Vérification de la conformité légale du dossier'
                  : 'Legal compliance verification for the case')}
              </DialogDescription>
            </DialogHeader>
            {validationResult && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{validationResult.summary}</p>
                </div>

                {/* Issues */}
                {validationResult.issues.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">
                      {t('language') === 'fr' ? 'Problèmes détectés' : 'Issues Detected'} ({validationResult.issues.length})
                    </h4>
                    {validationResult.issues.map((issue, index) => (
                      <Card key={index} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getSeverityBadgeColor(issue.severity)}>
                                  {issue.category}
                                </Badge>
                                {issue.section && (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                    {t('language') === 'fr' ? 'Section' : 'Section'} {issue.section}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900">{issue.description}</p>
                              {issue.recommendation && (
                                <p className="text-xs text-gray-600 italic">
                                  {t('language') === 'fr' ? 'Recommandation' : 'Recommendation'}: {issue.recommendation}
                                </p>
                              )}
                              {issue.legalReference && (
                                <p className="text-xs text-gray-500">
                                  {t('language') === 'fr' ? 'Référence légale' : 'Legal reference'}: {issue.legalReference}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-900">
                      {t('language') === 'fr'
                        ? 'Tous les contrôles sont passés'
                        : 'All checks passed'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {showButton && (
        <Button
          onClick={handleValidate}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('language') === 'fr' ? 'Vérification...' : 'Validating...'}
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              {t('validate')}
            </>
          )}
        </Button>
      )}

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {getStatusIcon(validationResult.overallStatus)}
              <span>{t('language') === 'fr' ? 'Résultats de validation' : 'Validation Results'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700">{validationResult.summary}</p>
            {validationResult.issues.length > 0 && (
              <div className="space-y-2">
                {validationResult.issues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    {getSeverityIcon(issue.severity)}
                    <span className="text-gray-600">{issue.description}</span>
                  </div>
                ))}
                {validationResult.issues.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowModal(true)}
                    className="text-xs"
                  >
                    {t('viewMoreIssues').replace('{count}', String(validationResult.issues.length - 3))}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult && getStatusIcon(validationResult.overallStatus)}
              {t('language') === 'fr' ? 'Résultats de validation' : 'Validation Results'}
            </DialogTitle>
            <DialogDescription>
              {validationResult?.summary || (t('language') === 'fr'
                ? 'Vérification de la conformité légale du dossier'
                : 'Legal compliance verification for the case')}
            </DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{validationResult.summary}</p>
              </div>

              {validationResult.issues.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">
                    {t('language') === 'fr' ? 'Problèmes détectés' : 'Issues Detected'} ({validationResult.issues.length})
                  </h4>
                  {validationResult.issues.map((issue, index) => (
                    <Card key={index} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getSeverityBadgeColor(issue.severity)}>
                                {issue.category}
                              </Badge>
                              {issue.section && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                  {t('language') === 'fr' ? 'Section' : 'Section'} {issue.section}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-900">{issue.description}</p>
                            {issue.recommendation && (
                              <p className="text-xs text-gray-600 italic">
                                {t('language') === 'fr' ? 'Recommandation' : 'Recommendation'}: {issue.recommendation}
                              </p>
                            )}
                            {issue.legalReference && (
                              <p className="text-xs text-gray-500">
                                {t('language') === 'fr' ? 'Référence légale' : 'Legal reference'}: {issue.legalReference}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">
                    {t('language') === 'fr'
                      ? 'Tous les contrôles sont passés'
                      : 'All checks passed'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export helper to check if report can be generated
export const canGenerateReport = (validationResult: LegalVerificationResponse | null): boolean => {
  return validationResult?.compliant ?? false;
};

