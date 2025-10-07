import React, { useEffect, useState } from 'react';
import { Save, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';

interface CcReportFormProps {
  sectionId: string;
}

// Define subsection IDs
const SUBSECTION_IDS = {
  EVALUATION_DETAILS: 'evaluation_details',
  DIAGNOSES_ACCEPTED: 'diagnoses_accepted',
  INTERVIEW_MODALITY: 'interview_modality',
  IDENTIFICATION: 'identification',
  ANTECEDENTS: 'antecedents',
  WORKER_INFORMATION: 'worker_information',
  CURRENT_MEDICATION: 'current_medication',
  QUESTIONNAIRE_CURRENT_STATE: 'questionnaire_current_state',
  PHYSICAL_EXAM: 'physical_exam',
} as const;

export const CcReportForm: React.FC<CcReportFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [hasSessionData, setHasSessionData] = useState<boolean>(false);

  const status = getSectionStatus(sectionId);
  const autosaveTimestamp = getAutosaveTimestamp(sectionId);

  // Load data from sessionStorage on component mount
  useEffect(() => {
    const savedData = sessionStorage.getItem(`cReportForm_${sectionId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setHasSessionData(true);
        console.log('✅ Loaded C Report data from sessionStorage:', parsedData);
      } catch (error) {
        console.error('❌ Error loading C Report data from sessionStorage:', error);
        setHasSessionData(false);
      }
    } else {
      // Initialize with empty subsection structure
      const initialData = Object.values(SUBSECTION_IDS).reduce((acc, subsectionId) => {
        acc[subsectionId] = {};
        return acc;
      }, {} as Record<string, Record<string, any>>);
      setFormData(initialData);
      setHasSessionData(false);
    }
  }, [sectionId]);

  // Auto-save effect with sessionStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        // Save to case store
        updateSection(sectionId, formData);
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem(`cReportForm_${sectionId}`, JSON.stringify(formData));
          console.log('✅ Saved C Report data to sessionStorage:', formData);
        } catch (error) {
          console.error('❌ Error saving C Report data to sessionStorage:', error);
        }
        
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, sectionId, updateSection]);

  const handleInputChange = (subsectionId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [subsectionId]: {
        ...prev[subsectionId],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    // Save to case store
    updateSection(sectionId, formData);
    
    // Save to sessionStorage
    try {
      sessionStorage.setItem(`cReportForm_${sectionId}`, JSON.stringify(formData));
      console.log('✅ Manually saved C Report data to sessionStorage:', formData);
    } catch (error) {
      console.error('❌ Error manually saving C Report data to sessionStorage:', error);
    }
    
    setLastSaved(new Date().toLocaleTimeString());
  };

  // Function to clear sessionStorage data
  const clearSessionData = () => {
    try {
      sessionStorage.removeItem(`cReportForm_${sectionId}`);
      // Reset to empty subsection structure
      const emptyData = Object.values(SUBSECTION_IDS).reduce((acc, subsectionId) => {
        acc[subsectionId] = {};
        return acc;
      }, {} as Record<string, Record<string, any>>);
      setFormData(emptyData);
      setHasSessionData(false);
      console.log('✅ Cleared C Report data from sessionStorage');
    } catch (error) {
      console.error('❌ Error clearing C Report data from sessionStorage:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('ccReportSection')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('ccReportSection')}
              {hasSessionData && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📱 Session Data
                </span>
              )}
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
              onClick={clearSessionData}
              variant="outline"
              size="sm"
              className="mr-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
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
          {/* Evaluation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="evaluationDetails">{t('ccReportDetails')}</Label>
                 <Textarea
                   id="evaluationDetails"
                   value={formData[SUBSECTION_IDS.EVALUATION_DETAILS]?.evaluationDetails || ''}
                   onChange={(e) => handleInputChange(SUBSECTION_IDS.EVALUATION_DETAILS, 'evaluationDetails', e.target.value)}
                   placeholder={t('enterCcReportDetails')}
                   rows={8}
                   className="min-h-[200px]"
                 />
              </div>
            </CardContent>
          </Card>

          {/* Diagnoses Accepted by CNESST */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportDiagnosesAccepted')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="diagnosesAccepted">{t('ccReportDiagnosesAccepted')}</Label>
                 <Textarea
                   id="diagnosesAccepted"
                   value={formData[SUBSECTION_IDS.DIAGNOSES_ACCEPTED]?.diagnosesAccepted || ''}
                   onChange={(e) => handleInputChange(SUBSECTION_IDS.DIAGNOSES_ACCEPTED, 'diagnosesAccepted', e.target.value)}
                   placeholder={t('enterCcReportDiagnosesAccepted')}
                   rows={6}
                   className="min-h-[150px]"
                 />
              </div>
            </CardContent>
          </Card>

          {/* Interview Modality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportInterviewModality')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="interviewModality">{t('ccReportInterviewModality')}</Label>
                 <Textarea
                   id="interviewModality"
                   value={formData[SUBSECTION_IDS.INTERVIEW_MODALITY]?.interviewModality || ''}
                   onChange={(e) => handleInputChange(SUBSECTION_IDS.INTERVIEW_MODALITY, 'interviewModality', e.target.value)}
                   placeholder={t('enterCcReportInterviewModality')}
                   rows={4}
                   className="min-h-[100px]"
                 />
              </div>
            </CardContent>
          </Card>

          {/* Identification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportIdentification')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('ccReportName')}</Label>
                     <Input
                       id="name"
                       value={formData[SUBSECTION_IDS.IDENTIFICATION]?.name || ''}
                       onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'name', e.target.value)}
                       placeholder={t('enterCcReportName')}
                     />
                  </div>
                  <div>
                    <Label htmlFor="cnesstNumber">{t('ccReportCnesstNumber')}</Label>
                    <Input
                      id="cnesstNumber"
                      value={formData[SUBSECTION_IDS.IDENTIFICATION]?.cnesstNumber || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'cnesstNumber', e.target.value)}
                      placeholder={t('enterCcReportCnesstNumber')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dominance">{t('ccReportDominance')}</Label>
                    <Input
                      id="dominance"
                      value={formData[SUBSECTION_IDS.IDENTIFICATION]?.dominance || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'dominance', e.target.value)}
                      placeholder={t('enterCcReportDominance')}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="age">{t('ccReportAge')}</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData[SUBSECTION_IDS.IDENTIFICATION]?.age || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'age', e.target.value)}
                      placeholder={t('enterCcReportAge')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evaluationDate">{t('ccReportEvaluationDate')}</Label>
                    <Input
                      id="evaluationDate"
                      type="date"
                      value={formData[SUBSECTION_IDS.IDENTIFICATION]?.evaluationDate || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'evaluationDate', e.target.value)}
                      placeholder={t('enterCcReportEvaluationDate')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employment">{t('ccReportEmployment')}</Label>
                    <Input
                      id="employment"
                      value={formData[SUBSECTION_IDS.IDENTIFICATION]?.employment || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.IDENTIFICATION, 'employment', e.target.value)}
                      placeholder={t('enterCcReportEmployment')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Antecedents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportAntecedents')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="medicalHistory">{t('ccReportMedicalHistory')}</Label>
                    <Textarea
                      id="medicalHistory"
                      value={formData[SUBSECTION_IDS.ANTECEDENTS]?.medicalHistory || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.ANTECEDENTS, 'medicalHistory', e.target.value)}
                      placeholder={t('enterCcReportMedicalHistory')}
                      rows={4}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="familyHistory">{t('ccReportFamilyHistory')}</Label>
                    <Textarea
                      id="familyHistory"
                      value={formData[SUBSECTION_IDS.ANTECEDENTS]?.familyHistory || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.ANTECEDENTS, 'familyHistory', e.target.value)}
                      placeholder={t('enterCcReportFamilyHistory')}
                      rows={4}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workHistory">{t('ccReportWorkHistory')}</Label>
                    <Textarea
                      id="workHistory"
                      value={formData[SUBSECTION_IDS.ANTECEDENTS]?.workHistory || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.ANTECEDENTS, 'workHistory', e.target.value)}
                      placeholder={t('enterCcReportWorkHistory')}
                      rows={4}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="socialHistory">{t('ccReportSocialHistory')}</Label>
                    <Textarea
                      id="socialHistory"
                      value={formData[SUBSECTION_IDS.ANTECEDENTS]?.socialHistory || ''}
                      onChange={(e) => handleInputChange(SUBSECTION_IDS.ANTECEDENTS, 'socialHistory', e.target.value)}
                      placeholder={t('enterCcReportSocialHistory')}
                      rows={4}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* A. Worker Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('ccReportWorkerInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Information */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('generalInformation')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patientName">{t('ccReportPatientName')}</Label>
                       <Input
                         id="patientName"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.patientName || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'patientName', e.target.value)}
                         placeholder={t('enterCcReportPatientName')}
                       />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">{t('ccReportDateOfBirth')}</Label>
                       <Input
                         id="dateOfBirth"
                         type="date"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.dateOfBirth || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'dateOfBirth', e.target.value)}
                         placeholder={t('enterCcReportDateOfBirth')}
                       />
                    </div>
                    <div>
                      <Label htmlFor="telephone">{t('ccReportTelephone')}</Label>
                       <Input
                         id="telephone"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.telephone || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'telephone', e.target.value)}
                         placeholder={t('enterCcReportTelephone')}
                       />
                    </div>
                    <div>
                      <Label htmlFor="medicalCardNumber">{t('ccReportMedicalCardNumber')}</Label>
                       <Input
                         id="medicalCardNumber"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.medicalCardNumber || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'medicalCardNumber', e.target.value)}
                         placeholder={t('enterCcReportMedicalCardNumber')}
                       />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="initialIncidentDate">{t('ccReportInitialIncidentDate')}</Label>
                       <Input
                         id="initialIncidentDate"
                         type="date"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.initialIncidentDate || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'initialIncidentDate', e.target.value)}
                         placeholder={t('enterCcReportInitialIncidentDate')}
                       />
                    </div>
                    <div>
                      <Label htmlFor="aggravationDate">{t('ccReportAggravationDate')}</Label>
                       <Input
                         id="aggravationDate"
                         type="date"
                         value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.aggravationDate || ''}
                         onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'aggravationDate', e.target.value)}
                         placeholder={t('enterCcReportAggravationDate')}
                       />
                    </div>
                  </div>
                </div>

                {/* Full Width Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">{t('ccReportAddress')}</Label>
                     <Input
                       id="address"
                       value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.address || ''}
                       onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'address', e.target.value)}
                       placeholder={t('enterCcReportAddress')}
                     />
                  </div>
                  <div>
                    <Label htmlFor="mainDiagnosis">{t('ccReportMainDiagnosis')}</Label>
                     <Textarea
                       id="mainDiagnosis"
                       value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.mainDiagnosis || ''}
                       onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'mainDiagnosis', e.target.value)}
                       placeholder={t('enterCcReportMainDiagnosis')}
                       rows={4}
                       className="min-h-[100px]"
                     />
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('ccReportSectionContent')}</h3>
                <div>
                  <Label htmlFor="observationsNotes">{t('ccReportObservationsNotes')}</Label>
                   <Textarea
                     id="observationsNotes"
                     value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.observationsNotes || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'observationsNotes', e.target.value)}
                     placeholder={t('enterCcReportObservationsNotes')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('ccReportAdditionalNotes')}</h3>
                <div>
                  <Label htmlFor="additionalNotes">{t('ccReportAdditionalNotes')}</Label>
                   <Textarea
                     id="additionalNotes"
                     value={formData[SUBSECTION_IDS.WORKER_INFORMATION]?.additionalNotes || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.WORKER_INFORMATION, 'additionalNotes', e.target.value)}
                     placeholder={t('enterCcReportAdditionalNotes')}
                     rows={4}
                     className="min-h-[100px]"
                   />
                </div>
              </div>

              {/* Current Medication and Ongoing Therapeutic Measures */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('ccReportCurrentMedication')}</h3>
                
                {/* Medication Details */}
                <div>
                  <Label htmlFor="medicationDetails">{t('ccReportMedicationDetails')}</Label>
                   <Textarea
                     id="medicationDetails"
                     value={formData[SUBSECTION_IDS.CURRENT_MEDICATION]?.medicationDetails || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.CURRENT_MEDICATION, 'medicationDetails', e.target.value)}
                     placeholder={t('enterCcReportMedicationDetails')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Therapeutic Measures */}
                <div>
                  <Label htmlFor="therapeuticMeasures">{t('ccReportTherapeuticMeasures')}</Label>
                   <Textarea
                     id="therapeuticMeasures"
                     value={formData[SUBSECTION_IDS.CURRENT_MEDICATION]?.therapeuticMeasures || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.CURRENT_MEDICATION, 'therapeuticMeasures', e.target.value)}
                     placeholder={t('enterCcReportTherapeuticMeasures')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Additional Notes for Medication */}
                <div>
                  <Label htmlFor="additionalNotesMedication">{t('ccReportAdditionalNotesMedication')}</Label>
                   <Textarea
                     id="additionalNotesMedication"
                     value={formData[SUBSECTION_IDS.CURRENT_MEDICATION]?.additionalNotesMedication || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.CURRENT_MEDICATION, 'additionalNotesMedication', e.target.value)}
                     placeholder={t('enterCcReportAdditionalNotesMedication')}
                     rows={4}
                     className="min-h-[100px]"
                   />
                </div>
              </div>

              {/* Questionnaire and Current State */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('ccReportQuestionnaireCurrentState')}</h3>
                
                {/* Questionnaire */}
                <div>
                  <Label htmlFor="questionnaire">{t('ccReportQuestionnaire')}</Label>
                   <Textarea
                     id="questionnaire"
                     value={formData[SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE]?.questionnaire || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE, 'questionnaire', e.target.value)}
                     placeholder={t('enterCcReportQuestionnaire')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Current State */}
                <div>
                  <Label htmlFor="currentState">{t('ccReportCurrentState')}</Label>
                   <Textarea
                     id="currentState"
                     value={formData[SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE]?.currentState || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE, 'currentState', e.target.value)}
                     placeholder={t('enterCcReportCurrentState')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Additional Notes for Questionnaire */}
                <div>
                  <Label htmlFor="additionalNotesQuestionnaire">{t('ccReportAdditionalNotesQuestionnaire')}</Label>
                   <Textarea
                     id="additionalNotesQuestionnaire"
                     value={formData[SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE]?.additionalNotesQuestionnaire || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.QUESTIONNAIRE_CURRENT_STATE, 'additionalNotesQuestionnaire', e.target.value)}
                     placeholder={t('enterCcReportAdditionalNotesQuestionnaire')}
                     rows={4}
                     className="min-h-[100px]"
                   />
                </div>
              </div>

              {/* Physical Exam */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-gray-700">{t('ccReportPhysicalExam')}</h3>
                
                {/* Physical Exam Details */}
                <div>
                  <Label htmlFor="physicalExamDetails">{t('ccReportPhysicalExamDetails')}</Label>
                   <Textarea
                     id="physicalExamDetails"
                     value={formData[SUBSECTION_IDS.PHYSICAL_EXAM]?.physicalExamDetails || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.PHYSICAL_EXAM, 'physicalExamDetails', e.target.value)}
                     placeholder={t('enterCcReportPhysicalExamDetails')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Physical Exam Notes */}
                <div>
                  <Label htmlFor="physicalExamNotes">{t('ccReportPhysicalExamNotes')}</Label>
                   <Textarea
                     id="physicalExamNotes"
                     value={formData[SUBSECTION_IDS.PHYSICAL_EXAM]?.physicalExamNotes || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.PHYSICAL_EXAM, 'physicalExamNotes', e.target.value)}
                     placeholder={t('enterCcReportPhysicalExamNotes')}
                     rows={6}
                     className="min-h-[150px]"
                   />
                </div>

                {/* Additional Notes for Physical Exam */}
                <div>
                  <Label htmlFor="additionalNotesPhysicalExam">{t('ccReportAdditionalNotesPhysicalExam')}</Label>
                   <Textarea
                     id="additionalNotesPhysicalExam"
                     value={formData[SUBSECTION_IDS.PHYSICAL_EXAM]?.additionalNotesPhysicalExam || ''}
                     onChange={(e) => handleInputChange(SUBSECTION_IDS.PHYSICAL_EXAM, 'additionalNotesPhysicalExam', e.target.value)}
                     placeholder={t('enterCcReportAdditionalNotesPhysicalExam')}
                     rows={4}
                     className="min-h-[100px]"
                   />
                </div>
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
