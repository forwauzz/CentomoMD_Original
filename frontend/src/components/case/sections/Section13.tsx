/**
 * Section 13: Vérification légale
 * Legal verification of case data for workers compensation compliance
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { verifyLegalCompliance, type LegalVerificationResponse } from '@/services/legalVerification';
import { cn } from '@/lib/utils';

interface Section13Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
  caseData?: any;
}

export const Section13: React.FC<Section13Props> = ({ data, onUpdate, onSave, caseData }) => {
  const addToast = useUIStore(state => state.addToast);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<LegalVerificationResponse | null>(
    data.verificationResult || null
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!caseData) {
      addToast({
        type: 'error',
        title: 'Données manquantes',
        message: 'Impossible de vérifier: données du cas non disponibles.'
      });
      return;
    }

    setIsVerifying(true);
    setLoading(true);

    try {
      addToast({
        type: 'info',
        title: 'Vérification en cours',
        message: 'Analyse de la conformité légale en cours...'
      });

      const result = await verifyLegalCompliance({
        caseData,
        sections: caseData.sections || {}
      });

      setVerificationResult(result);
      onUpdate({ 
        verificationResult: result,
        verifiedAt: new Date().toISOString()
      });
      onSave();

      addToast({
        type: result.compliant ? 'success' : 'warning',
        title: result.compliant ? 'Conforme' : 'Révision nécessaire',
        message: result.summary || (result.compliant 
          ? 'Le dossier est conforme aux exigences légales.' 
          : 'Des problèmes de conformité ont été détectés.')
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      addToast({
        type: 'error',
        title: 'Erreur de vérification',
        message: errorMessage
      });
    } finally {
      setLoading(false);
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'needs_review':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'needs_review':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'non_compliant':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Conforme';
      case 'needs_review':
        return 'Révision nécessaire';
      case 'non_compliant':
        return 'Non conforme';
      default:
        return 'Non vérifié';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#009639]" />
              <span>Section 13: Vérification légale</span>
            </div>
            <Button
              onClick={handleVerify}
              disabled={loading || isVerifying}
              className="flex items-center gap-2 bg-[#009639] hover:bg-[#007a2e] text-white"
            >
              {loading || isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Vérifier la conformité</span>
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!verificationResult ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Vérification légale non effectuée
              </p>
              <p className="text-sm text-gray-500">
                Cliquez sur "Vérifier la conformité" pour analyser le dossier selon les exigences légales de la CNESST.
              </p>
            </div>
          ) : (
            <>
              {/* Overall Status */}
              <div className={cn(
                "p-4 rounded-lg border-2 flex items-center gap-3",
                getStatusColor(verificationResult.overallStatus)
              )}>
                {getStatusIcon(verificationResult.overallStatus)}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    Statut: {getStatusLabel(verificationResult.overallStatus)}
                  </h3>
                  {verificationResult.summary && (
                    <p className="text-sm mt-1">
                      {verificationResult.summary}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVerify}
                  disabled={loading || isVerifying}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", (loading || isVerifying) && "animate-spin")} />
                  <span>Revérifier</span>
                </Button>
              </div>

              {/* Summary */}
              {verificationResult.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Résumé de la vérification
                  </h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {verificationResult.summary}
                  </p>
                </div>
              )}

              {/* Issues List */}
              {verificationResult.issues && verificationResult.issues.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span>Points à vérifier ({verificationResult.issues.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {verificationResult.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          getSeverityColor(issue.severity)
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900">
                                  {issue.category}
                                </span>
                                {issue.section && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (Section {issue.section})
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">
                              {issue.description}
                            </p>
                            {issue.recommendation && (
                              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  Recommandation:
                                </p>
                                <p className="text-sm text-gray-800">
                                  {issue.recommendation}
                                </p>
                              </div>
                            )}
                            {issue.legalReference && (
                              <p className="text-xs text-gray-500 italic mt-1">
                                Référence: {issue.legalReference}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Issues */}
              {verificationResult.issues && verificationResult.issues.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-800">
                    Aucun problème de conformité détecté
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Le dossier respecte toutes les exigences légales.
                  </p>
                </div>
              )}

              {/* Verification Metadata */}
              {verificationResult.verifiedAt && (
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                  Vérifié le {new Date(verificationResult.verifiedAt).toLocaleString('fr-CA')}
                  {verificationResult.verifiedBy && ` par ${verificationResult.verifiedBy}`}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

