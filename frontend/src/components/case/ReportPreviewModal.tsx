import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { FileText, Download, X } from 'lucide-react';

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: {
    id: string;
    patientName: string;
    claimId: string;
    sections: Record<string, any>;
  };
  onExportPDF: () => void;
  onExportDOCX: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  open,
  onOpenChange,
  caseData,
  onExportPDF,
  onExportDOCX,
}) => {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('language') === 'fr' ? 'Aperçu du rapport' : 'Report Preview'}
          </DialogTitle>
          <DialogDescription>
            {t('language') === 'fr'
              ? `Aperçu du rapport pour le cas ${caseData.claimId}`
              : `Preview of report for case ${caseData.claimId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mock Report Preview */}
          <div className="border rounded-lg p-6 bg-white">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {t('language') === 'fr' ? 'Rapport CNESST' : 'CNESST Report'}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('language') === 'fr' ? 'Cas' : 'Case'}: {caseData.claimId}
                </p>
                <p className="text-sm text-gray-600">
                  {t('language') === 'fr' ? 'Patient' : 'Patient'}: {caseData.patientName}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">
                  {t('language') === 'fr' ? 'Sections complétées' : 'Completed Sections'}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {Object.keys(caseData.sections).map((sectionKey) => (
                    <li key={sectionKey}>
                      {t('language') === 'fr' ? 'Section' : 'Section'} {sectionKey}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 italic">
                  {t('language') === 'fr'
                    ? 'Ceci est un aperçu. Le rapport final contiendra toutes les sections complétées avec le formatage approprié.'
                    : 'This is a preview. The final report will contain all completed sections with proper formatting.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="outline" onClick={onExportDOCX} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('language') === 'fr' ? 'Exporter DOCX' : 'Export DOCX'}
          </Button>
          <Button onClick={onExportPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('language') === 'fr' ? 'Exporter PDF' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

