import React, { useEffect, useState } from 'react';
import { Save, Clock, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { useCaseStore } from '@/stores/caseStore';
import { TranscriptionInterface } from '@/components/transcription/TranscriptionInterface';

interface ConclusionsFormProps {
  sectionId: string;
}

export const ConclusionsForm: React.FC<ConclusionsFormProps> = ({ sectionId }) => {
  const { t, language } = useI18n();
  const { updateSection, getSectionStatus, getAutosaveTimestamp } = useCaseStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isDictating, setIsDictating] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

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

  const handleSessionUpdate = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  const handleTranscriptionUpdate = (transcript: string) => {
    // Update the conclusions details with the transcribed text
    handleInputChange('conclusionsDetails', transcript);
  };

  const toggleDictation = () => {
    setIsDictating(!isDictating);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('conclusionsHeader')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('conclusionsSection')}
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
              onClick={toggleDictation}
              variant={isDictating ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isDictating ? (
                <>
                  <MicOff className="h-4 w-4" />
                  {t('exitDictationMode')}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  {t('enterDictationMode')}
                </>
              )}
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
          {/* Conclusions Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('conclusionsDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="conclusionsDetails">{t('conclusionsDetails')}</Label>
                <Textarea
                  id="conclusionsDetails"
                  value={formData.conclusionsDetails || ''}
                  onChange={(e) => handleInputChange('conclusionsDetails', e.target.value)}
                  placeholder={t('enterConclusionsDetails')}
                  rows={12}
                  className="min-h-[300px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dictation Interface - Only show when dictating */}
          {isDictating && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  {language === 'fr' ? 'Interface de dictée' : 'Dictation Interface'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TranscriptionInterface
                  onSessionUpdate={handleSessionUpdate}
                  onTranscriptionUpdate={handleTranscriptionUpdate}
                  sessionId={sessionId}
                />
              </CardContent>
            </Card>
          )}

          {/* Conclusions Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('conclusionsNotes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="conclusionsNotes">{t('conclusionsNotes')}</Label>
                <Textarea
                  id="conclusionsNotes"
                  value={formData.conclusionsNotes || ''}
                  onChange={(e) => handleInputChange('conclusionsNotes', e.target.value)}
                  placeholder={t('enterConclusionsNotes')}
                  rows={6}
                  className="min-h-[150px]"
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
