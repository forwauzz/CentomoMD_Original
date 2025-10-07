import React, { useEffect, useState } from 'react';
import { Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';

interface AntecedentsFormProps {
  sectionId: string;
}

export const AntecedentsForm: React.FC<AntecedentsFormProps> = ({ sectionId }) => {
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
              {t('antecedentsHeader')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('antecedentsSection')}
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
          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('medical')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medical">{t('medical')}</Label>
                <Textarea
                  id="medical"
                  value={formData.medical || ''}
                  onChange={(e) => handleInputChange('medical', e.target.value)}
                  placeholder={t('enterMedical')}
                  rows={4}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Site and Around Lesion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('siteAndAroundLesion')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteAndAroundLesion">{t('siteAndAroundLesion')}</Label>
                <Textarea
                  id="siteAndAroundLesion"
                  value={formData.siteAndAroundLesion || ''}
                  onChange={(e) => handleInputChange('siteAndAroundLesion', e.target.value)}
                  placeholder={t('enterSiteAndAroundLesion')}
                  rows={4}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('allergies')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="allergies">{t('allergies')}</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies || ''}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  placeholder={t('enterAllergies')}
                  rows={3}
                  className="min-h-[75px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Substance Use - Tobacco, Cannabis, Alcohol */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === 'fr' ? 'Consommation de substances' : 'Substance Use'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tobacco">{t('tobacco')}</Label>
                  <Textarea
                    id="tobacco"
                    value={formData.tobacco || ''}
                    onChange={(e) => handleInputChange('tobacco', e.target.value)}
                    placeholder={t('enterTobacco')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
                <div>
                  <Label htmlFor="cannabis">{t('cannabis')}</Label>
                  <Textarea
                    id="cannabis"
                    value={formData.cannabis || ''}
                    onChange={(e) => handleInputChange('cannabis', e.target.value)}
                    placeholder={t('enterCannabis')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
                <div>
                  <Label htmlFor="alcohol">{t('alcohol')}</Label>
                  <Textarea
                    id="alcohol"
                    value={formData.alcohol || ''}
                    onChange={(e) => handleInputChange('alcohol', e.target.value)}
                    placeholder={t('enterAlcohol')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accidents Subsection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('accidentsSubsection')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cnesst">{t('cnesst')}</Label>
                  <Textarea
                    id="cnesst"
                    value={formData.cnesst || ''}
                    onChange={(e) => handleInputChange('cnesst', e.target.value)}
                    placeholder={t('enterCnesst')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
                <div>
                  <Label htmlFor="saaq">{t('saaq')}</Label>
                  <Textarea
                    id="saaq"
                    value={formData.saaq || ''}
                    onChange={(e) => handleInputChange('saaq', e.target.value)}
                    placeholder={t('enterSaaq')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
                <div>
                  <Label htmlFor="others">{t('others')}</Label>
                  <Textarea
                    id="others"
                    value={formData.others || ''}
                    onChange={(e) => handleInputChange('others', e.target.value)}
                    placeholder={t('enterOthers')}
                    rows={3}
                    className="min-h-[75px]"
                  />
                </div>
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
