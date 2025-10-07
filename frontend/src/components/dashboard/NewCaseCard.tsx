import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { ROUTES } from '@/lib/constants';
import { useCaseSwitching } from '@/hooks/useCaseSwitching';
import { CaseSwitchConfirmation } from '@/components/case/CaseSwitchConfirmation';
import { useUserStore } from '@/stores/userStore';

export const NewCaseCard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useUserStore();
  
  const {
    showConfirmation,
    currentCaseId,
    startNewCase,
    handleConfirmSwitch,
    handleCancelSwitch,
    isProcessing
  } = useCaseSwitching();

  const handleNewCase = () => {
    startNewCase();
  };

  const handleConfirmAndNavigate = async () => {
    await handleConfirmSwitch();
    // Navigate to new case page after case is created
    navigate(ROUTES.NEW_CASE);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-700">
            {t('startNewCase')}
          </CardTitle>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm">
          {t('newCaseDescription')}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileText className="h-3 w-3" />
          <span>{t('sectionsAvailable')}</span>
        </div>
        <Button 
          onClick={handleNewCase}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isProcessing ? 'Starting...' : t('newCase')}
        </Button>
      </CardContent>

      <CaseSwitchConfirmation
        isOpen={showConfirmation}
        onConfirm={handleConfirmAndNavigate}
        onCancel={handleCancelSwitch}
        currentCaseId={currentCaseId}
        locale={profile?.locale || 'en-CA'}
      />
    </Card>
  );
};
