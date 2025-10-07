import React, { useEffect, useState } from 'react';
import { Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';
import { PhysicianInformationForm } from './PhysicianInformationForm';
import { CcReportForm } from './CcReportForm';

interface SectionFormProps {
  sectionId: string;
}

export const SectionForm: React.FC<SectionFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');

  const section = CNESST_SECTIONS.find(s => s.id === sectionId);
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

  if (!section) {
    return (
      <div className="p-8 text-center text-gray-500">
        Section non trouvée
      </div>
    );
  }

  // Render Physician Information form for section B
  if (sectionId === 'section_b') {
    return <PhysicianInformationForm sectionId={sectionId} />;
  }


  // Render CC Report form for section CC
  if (sectionId === 'section_cc') {
    return <CcReportForm sectionId={sectionId} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
                     <div>
             <h1 className="text-2xl font-bold text-slate-700">
               {getSectionTitle(section, language)}
             </h1>
            <p className="text-gray-500 mt-1">
              {section.audioRequired && (
                <span className="inline-flex items-center gap-1 text-orange-600 text-sm">
                  <Clock className="h-4 w-4" />
                  Dictée audio requise
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Sauvegardé à {lastSaved}
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
          {/* Basic Form Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('generalInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">{t('patientName')}</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName || ''}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder={t('enterPatientName')}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">{t('dateOfBirth')}</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">{t('telephone')}</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone || ''}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder={t('enterTelephone')}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalCardNumber">{t('medicalCardNumber')}</Label>
                  <Input
                    id="medicalCardNumber"
                    value={formData.medicalCardNumber || ''}
                    onChange={(e) => handleInputChange('medicalCardNumber', e.target.value)}
                    placeholder={t('enterMedicalCardNumber')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initialIncidentDate">{t('initialIncidentDate')}</Label>
                  <Input
                    id="initialIncidentDate"
                    type="date"
                    value={formData.initialIncidentDate || ''}
                    onChange={(e) => handleInputChange('initialIncidentDate', e.target.value)}
                    placeholder={t('enterInitialIncidentDate')}
                  />
                </div>
                <div>
                  <Label htmlFor="aggravationDate">{t('aggravationDate')}</Label>
                  <Input
                    id="aggravationDate"
                    type="date"
                    value={formData.aggravationDate || ''}
                    onChange={(e) => handleInputChange('aggravationDate', e.target.value)}
                    placeholder={t('enterAggravationDate')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">{t('address')}</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder={t('enterAddress')}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnosis">{t('mainDiagnosis')}</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis || ''}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  placeholder={t('describeMainDiagnosis')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section-specific content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('sectionContent')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="observations">{t('observationsAndNotes')}</Label>
                <Textarea
                  id="observations"
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder={`${t('describeObservations')} ${getSectionTitle(section, language)}...`}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('additionalNotes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.additionalNotes || ''}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                placeholder={t('additionalNotesPlaceholder')}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'completed' ? 'Terminé' :
                 status === 'in_progress' ? 'En cours' :
                 'Non commencé'}
              </span>
            </div>
            {autosaveTimestamp && (
              <div className="text-xs text-gray-500">
                Dernière sauvegarde: {new Date(autosaveTimestamp).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
