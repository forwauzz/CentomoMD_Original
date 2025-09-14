import React, { useEffect, useState } from 'react';
import { Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { EvaluationMandateForm } from './EvaluationMandateForm';

interface ReportFormProps {
  sectionId: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({ sectionId }) => {
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
              {t('sectionC')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('reportSection')}
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
          {/* Render Evaluation Mandate Form if selected */}
          {formData.selectedOption === 'evaluationMandate' && (
            <EvaluationMandateForm sectionId={`${sectionId}_evaluationMandate`} />
          )}
          
          {/* Render other content if no specific option is selected or if it's not evaluationMandate */}
          {formData.selectedOption !== 'evaluationMandate' && (
            <>
              {/* Evaluation Goal Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-center text-blue-800">
                    {t('evaluationGoal')}
                  </CardTitle>
                </CardHeader>
              </Card>

          {/* Radio Buttons Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('evaluationDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.selectedOption || ''}
                onValueChange={(value: string) => handleInputChange('selectedOption', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="evaluationMandate" id="evaluationMandate" />
                  <Label htmlFor="evaluationMandate" className="text-sm font-medium">
                    {t('evaluationMandate')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diagnosesAccepted" id="diagnosesAccepted" />
                  <Label htmlFor="diagnosesAccepted" className="text-sm font-medium">
                    {t('diagnosesAccepted')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interviewModality" id="interviewModality" />
                  <Label htmlFor="interviewModality" className="text-sm font-medium">
                    {t('interviewModality')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="identification" id="identification" />
                  <Label htmlFor="identification" className="text-sm font-medium">
                    {t('identification')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="antecedents" id="antecedents" />
                  <Label htmlFor="antecedents" className="text-sm font-medium">
                    {t('antecedents')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="currentMedication" id="currentMedication" />
                  <Label htmlFor="currentMedication" className="text-sm font-medium">
                    {t('currentMedication')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="history" id="history" />
                  <Label htmlFor="history" className="text-sm font-medium">
                    {t('historySection')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="questionnaireCurrentState" id="questionnaireCurrentState" />
                  <Label htmlFor="questionnaireCurrentState" className="text-sm font-medium">
                    {t('questionnaireCurrentState')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="physicalExam" id="physicalExam" />
                  <Label htmlFor="physicalExam" className="text-sm font-medium">
                    {t('physicalExam')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="factHistoryEvolution" id="factHistoryEvolution" />
                  <Label htmlFor="factHistoryEvolution" className="text-sm font-medium">
                    {t('factHistoryEvolution')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imagingAdditionalExams" id="imagingAdditionalExams" />
                  <Label htmlFor="imagingAdditionalExams" className="text-sm font-medium">
                    {t('imagingAdditionalExams')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discussionAnalysis" id="discussionAnalysis" />
                  <Label htmlFor="discussionAnalysis" className="text-sm font-medium">
                    {t('discussionAnalysis')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conclusions" id="conclusions" />
                  <Label htmlFor="conclusions" className="text-sm font-medium">
                    {t('conclusions')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="physicianSignature" id="physicianSignature" />
                  <Label htmlFor="physicianSignature" className="text-sm font-medium">
                    {t('physicianSignature')}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Additional Notes Text Field */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
