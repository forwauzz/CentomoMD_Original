import React, { useEffect, useState } from 'react';
import { Save, Clock, Merge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { CNESST_SECTIONS, getSectionTitle } from '@/lib/constants';

interface SectionFormProps {
  sectionId: string;
}

export const SectionForm: React.FC<SectionFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp, sections } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<'idle' | 'merging' | 'complete' | 'error'>('idle');

  const section = CNESST_SECTIONS.find(s => s.id === sectionId);
  const status = getSectionStatus(sectionId);
  const autosaveTimestamp = getAutosaveTimestamp(sectionId);

  // Load section data from case store when component mounts or sectionId changes
  useEffect(() => {
    const sectionData = sections.find(s => s.id === sectionId);
    if (sectionData && sectionData.data) {
      console.log(`📥 Loading data for ${sectionId}:`, sectionData.data);
      setFormData(sectionData.data);
    }
  }, [sectionId, sections]);

  // Watch for changes in section data (e.g., when saved from dictation interface)
  useEffect(() => {
    const sectionData = sections.find(s => s.id === sectionId);
    if (sectionData && sectionData.data) {
      // Only update if the data has actually changed to avoid unnecessary re-renders
      const hasChanges = Object.keys(sectionData.data).some(
        key => sectionData.data[key] !== formData[key]
      );
      if (hasChanges) {
        console.log(`🔄 Updating form data for ${sectionId}:`, sectionData.data);
        setFormData(sectionData.data);
      }
    }
  }, [sections, sectionId, formData]);

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

  const handleMergeSections = async () => {
    const mainContent = formData.mainContent || '';
    const patientVerbatim = formData.patientVerbatim || '';
    const radiologistVerbatim = formData.radiologistVerbatim || '';

    if (!mainContent && !patientVerbatim && !radiologistVerbatim) {
      console.warn('No content to merge');
      return;
    }

    setIsMerging(true);
    setMergeStatus('merging');

    try {
      // TODO: Implement AI formatting logic here
      // For now, we'll do a simple concatenation
      const mergedContent = [
        mainContent,
        patientVerbatim ? `\n\nPatient: ${patientVerbatim}` : '',
        radiologistVerbatim ? `\n\nRadiologist: ${radiologistVerbatim}` : ''
      ].filter(Boolean).join('');

      // Update the main content with merged result
      setFormData(prev => ({
        ...prev,
        mainContent: mergedContent
      }));

      setMergeStatus('complete');
      
      // Auto-save the merged content
      updateSection(sectionId, {
        ...formData,
        mainContent: mergedContent
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setMergeStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error merging sections:', error);
      setMergeStatus('error');
    } finally {
      setIsMerging(false);
    }
  };

  if (!section) {
    return (
      <div className="p-8 text-center text-gray-500">
        Section non trouvée
      </div>
    );
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
          {/* Enhanced Section 7 - Historique d'évolution */}
          {sectionId === 'section_7' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('historiqueEvolution')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Content */}
                <div>
                  <Label htmlFor="mainContent">{t('mainContent')}</Label>
                  <Textarea
                    id="mainContent"
                    value={formData.mainContent || ''}
                    onChange={(e) => handleInputChange('mainContent', e.target.value)}
                    placeholder={t('mainContentPlaceholder')}
                    rows={6}
                    className="resize-y"
                  />
                </div>

                {/* Patient Verbatim */}
                <div>
                  <Label htmlFor="patientVerbatim">{t('patientVerbatim')}</Label>
                  <Textarea
                    id="patientVerbatim"
                    value={formData.patientVerbatim || ''}
                    onChange={(e) => handleInputChange('patientVerbatim', e.target.value)}
                    placeholder={t('patientVerbatimPlaceholder')}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                {/* Radiologist Verbatim */}
                <div>
                  <Label htmlFor="radiologistVerbatim">{t('radiologistVerbatim')}</Label>
                  <Textarea
                    id="radiologistVerbatim"
                    value={formData.radiologistVerbatim || ''}
                    onChange={(e) => handleInputChange('radiologistVerbatim', e.target.value)}
                    placeholder={t('radiologistVerbatimPlaceholder')}
                    rows={4}
                    className="resize-y"
                  />
                </div>

                {/* Merge Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleMergeSections}
                    disabled={isMerging || mergeStatus === 'merging'}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Merge className="h-4 w-4" />
                    {isMerging ? t('mergingSections') : t('mergeAllSections')}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                {/* Merge Status */}
                {mergeStatus === 'complete' && (
                  <div className="text-center text-green-600 text-sm">
                    {t('mergeComplete')}
                  </div>
                )}
                {mergeStatus === 'error' && (
                  <div className="text-center text-red-600 text-sm">
                    Error during merge
                  </div>
                )}
              </CardContent>
            </Card>
          ) : sectionId === 'section_8' ? (
            /* Enhanced Section 8 - Single large text box */
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{getSectionTitle(section, language)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="section8Content">{t('sectionContent')}</Label>
                  <Textarea
                    id="section8Content"
                    value={formData.section8Content || ''}
                    onChange={(e) => handleInputChange('section8Content', e.target.value)}
                    placeholder={`${t('describeObservations')} ${getSectionTitle(section, language)}...`}
                    rows={12}
                    className="resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Default form for other sections */
            <>
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
            </>
          )}

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
