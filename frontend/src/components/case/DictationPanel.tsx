import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, Info, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useCaseStore } from '@/stores/caseStore';
import { useFeatureFlags } from '@/lib/featureFlags';

interface DictationPanelProps {
  sectionTitle: string;
  caseId?: string;
  sectionId?: string;
}

export const DictationPanel: React.FC<DictationPanelProps> = ({ 
  sectionTitle, 
  caseId, 
  sectionId 
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { getCaseContext } = useCaseStore();
  const featureFlags = useFeatureFlags();
  
  const [caseContext, setCaseContext] = useState<any>(null);

  // Check if case management is enabled
  const isCaseManagementEnabled = featureFlags.caseManagement || false;

  useEffect(() => {
    if (isCaseManagementEnabled && caseId && sectionId) {
      const context = getCaseContext(caseId, sectionId);
      setCaseContext(context);
    }
  }, [isCaseManagementEnabled, caseId, sectionId, getCaseContext]);

  const handleGoToDictation = () => {
    if (isCaseManagementEnabled && caseId && sectionId) {
      // Navigate to dictation with case context
      navigate(`${ROUTES.DICTATION}?caseId=${caseId}&sectionId=${sectionId}`);
    } else {
      // Fallback to original behavior
      navigate(ROUTES.DICTATION);
    }
  };


  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-slate-700">
              {t('dictation')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {t('dictationInfo')}
            </p>
            
            {/* Case Context Information */}
            {isCaseManagementEnabled && caseContext && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <Link className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium mb-1">Case Linked:</p>
                    <p className="font-mono text-xs">{caseContext.caseId}</p>
                    <p className="mt-1">Section: {caseContext.sectionTitle}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">{t('currentSection')}:</p>
                  <p>{sectionTitle}</p>
                  {isCaseManagementEnabled && caseId && (
                    <p className="mt-1 text-green-600">
                      ✓ Auto-save to case enabled
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• {t('realTimeTranscription')}</p>
              <p>• {t('aiAccuracy')} 98.5%</p>
              <p>• {t('autosave')}</p>
              {isCaseManagementEnabled && (
                <p>• Case integration enabled</p>
              )}
            </div>
          </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleGoToDictation}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {t('goToDictation')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
      </Card>
    </div>
  );
};
