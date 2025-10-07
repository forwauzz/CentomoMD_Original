import React, { useEffect, useState } from 'react';
import { Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';

interface DiagnosesAcceptedFormProps {
  sectionId: string;
}

export const DiagnosesAcceptedForm: React.FC<DiagnosesAcceptedFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');

  const status = getSectionStatus(sectionId);
  const autosaveTimestamp = getAutosaveTimestamp(sectionId);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        updateSection(sectionId, formData);
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, sectionId, updateSection]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateSection(sectionId, formData);
    setLastSaved(new Date().toLocaleTimeString());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('diagnosesAcceptedHeader')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('diagnosesAcceptedSection')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {language === 'fr' ? `Sauvegardé à ${lastSaved}` : `Saved at ${lastSaved}`}
              </div>
            )}
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Diagnoses Details Text Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('diagnosesDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="diagnosesDetails">{t('diagnosesDetails')}</Label>
                <Textarea
                  id="diagnosesDetails"
                  value={formData.diagnosesDetails || ''}
                  onChange={(e) => handleInputChange('diagnosesDetails', e.target.value)}
                  placeholder={t('enterDiagnosesDetails')}
                  rows={12}
                  className="min-h-[300px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('additionalNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="additionalNotes">{t('additionalNotes')}</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes || ''}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder={t('additionalNotesPlaceholder')}
                  rows={4}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {language === 'fr' ? 'Statut:' : 'Status:'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'completed' ? (language === 'fr' ? 'Terminé' : 'Completed') :
                 status === 'in_progress' ? (language === 'fr' ? 'En cours' : 'In Progress') :
                 (language === 'fr' ? 'Non commencé' : 'Not Started')}
              </span>
            </div>
            {autosaveTimestamp && (
              <div className="text-xs text-gray-500">
                {language === 'fr' ? 'Dernière sauvegarde:' : 'Last saved:'} {new Date(autosaveTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
