import { Button } from '@/components/ui/button';
import { Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComplianceValidator } from '@/components/case/ComplianceValidator';
import { useI18n } from '@/lib/i18n';

interface CaseEditorFooterProps {
  currentSection: number;
  onSectionChange: (section: number) => void;
  onCancel: () => void;
  onSaveAndExit: () => void;
  onSaveAndContinue: () => void;
  hasUnsavedChanges: boolean;
  caseData?: any;
  validationResult?: any;
  onValidationComplete?: (result: any) => void;
}

export const CaseEditorFooter: React.FC<CaseEditorFooterProps> = ({
  currentSection,
  onSectionChange,
  onCancel,
  onSaveAndExit,
  onSaveAndContinue,
  hasUnsavedChanges,
  caseData,
  validationResult,
  onValidationComplete,
}) => {
  const { t } = useI18n();
  const canGoPrevious = currentSection > 1;
  const canGoNext = currentSection < 13;

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            <span>Cancel & Exit</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => canGoPrevious && onSectionChange(currentSection - 1)}
            disabled={!canGoPrevious}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600">
              {t('language') === 'fr' ? 'Modifications non sauvegardées' : 'Unsaved changes'}
            </span>
          )}
          {caseData && (
            <ComplianceValidator
              caseData={caseData}
              onValidationComplete={onValidationComplete}
              showButton={true}
              compact={true}
            />
          )}
          <Button
            variant="outline"
            onClick={onSaveAndExit}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{t('language') === 'fr' ? 'Enregistrer et quitter' : 'Save & Exit'}</span>
          </Button>
          <Button
            onClick={onSaveAndContinue}
            className="flex items-center gap-2 bg-[#009639] hover:bg-[#007a2e] text-white"
          >
            <Save className="h-4 w-4" />
            <span>{t('language') === 'fr' ? 'Enregistrer et continuer' : 'Save & Continue'}</span>
            {canGoNext && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </footer>
  );
};

