/**
 * Condensed Dictation Panel Component
 * Simplified dictation interface for Section 8
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Sparkles } from 'lucide-react';
import { useTranscription } from '@/hooks/useTranscription';
import { TemplateDropdown, TemplateJSON } from '@/components/transcription/TemplateDropdown';
import { RichTextEditor } from '@/components/case/RichTextEditor';
import { useUIStore } from '@/stores/uiStore';
import { useBackendConfig } from '@/hooks/useBackendConfig';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DictationPanelProps {
  onTranscriptReady: (transcript: string) => void;
  onFormattedReady: (formatted: string) => void;
  initialTranscript?: string;
}

export const DictationPanel: React.FC<DictationPanelProps> = ({
  onTranscriptReady,
  onFormattedReady,
  initialTranscript = ''
}) => {
  const addToast = useUIStore(state => state.addToast);
  const { config: backendConfig } = useBackendConfig();
  const [liveTranscript, setLiveTranscript] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    currentTranscript,
    startRecording,
    stopRecording,
    error
  } = useTranscription(undefined, 'fr-CA', 'smart_dictation');

  // Don't initialize with initial transcript - start blank for live transcription

  // Update live transcript when currentTranscript changes (from recording)
  useEffect(() => {
    if (currentTranscript && currentTranscript !== liveTranscript) {
      setLiveTranscript(currentTranscript);
      onTranscriptReady(currentTranscript);
    }
  }, [currentTranscript]);

  // Scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  const handleStartStop = () => {
    if (isRecording) {
      stopRecording();
      if (currentTranscript) {
        setLiveTranscript(currentTranscript);
        onTranscriptReady(currentTranscript);
      }
    } else {
      startRecording();
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !liveTranscript.trim()) {
      addToast({
        type: 'warning',
        title: 'Données manquantes',
        message: 'Veuillez sélectionner un template et avoir un transcript.'
      });
      return;
    }

    setIsFormatting(true);
    try {
      // Use the same API endpoint as TranscriptionInterface
      const result = await apiFetch('/api/format/mode2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: liveTranscript,
          section: '8',
          language: 'fr',
          inputLanguage: 'fr',
          outputLanguage: 'fr',
          useUniversal: true,
          templateRef: selectedTemplate.id,
          templateId: selectedTemplate.id,
          templateCombo: selectedTemplate.meta?.templateConfig?.config?.templateCombo || undefined
        })
      });

      // Extract formatted text from response
      const formatted = result.formatted || result.content || liveTranscript;
      setFormattedText(formatted);
      onFormattedReady(formatted);
      
      addToast({
        type: 'success',
        title: 'Template appliqué',
        message: 'Le transcript a été formaté avec succès.'
      });
    } catch (error) {
      console.error('Template application error:', error);
      addToast({
        type: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Impossible d\'appliquer le template.'
      });
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mic className="h-4 w-4" />
          <span>Dictée</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleStartStop}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              isRecording
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#009639] hover:bg-[#007a2e] text-white"
            )}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" />
                <span>Arrêter</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Démarrer</span>
              </>
            )}
          </Button>
        </div>

        {/* Live Transcript / Formatted Text Display */}
        <div className="flex-1 min-h-0 flex flex-col">
          <label className="text-xs font-medium text-gray-700 mb-1">
            {formattedText ? 'Texte formaté' : 'Transcript en direct'}
          </label>
          {formattedText ? (
            <div className="flex-1 min-h-0">
              <RichTextEditor
                value={formattedText}
                onChange={(newValue) => {
                  setFormattedText(newValue);
                  onFormattedReady(newValue);
                }}
                placeholder="Le texte formaté apparaîtra ici..."
                className="h-full"
              />
            </div>
          ) : (
            <div
              ref={transcriptRef}
              className={cn(
                "flex-1 p-3 border border-gray-300 rounded-md bg-gray-50",
                "overflow-y-auto text-sm leading-relaxed",
                "min-h-[200px]"
              )}
            >
              {liveTranscript ? (
                <p className="whitespace-pre-wrap text-gray-800">{liveTranscript}</p>
              ) : (
                <p className="text-gray-400 italic">
                  {isRecording ? 'Parlez maintenant...' : 'Le transcript apparaîtra ici lors de l\'enregistrement...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Template Selection - Only show when recording is stopped and transcript exists */}
        {!isRecording && liveTranscript && (
          <div className="space-y-2 flex-shrink-0">
            <label className="text-xs font-medium text-gray-700">
              Sélectionner un template
            </label>
            <TemplateDropdown
              currentSection="8"
              currentLanguage="fr-CA"
              onTemplateSelect={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          </div>
        )}

        {/* Apply Template Button - Only show when template is selected and transcript exists */}
        {!isRecording && selectedTemplate && liveTranscript && !formattedText && (
          <Button
            onClick={handleApplyTemplate}
            disabled={isFormatting || !liveTranscript.trim()}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isFormatting ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Formatage en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Appliquer le template</span>
              </>
            )}
          </Button>
        )}

        {/* Clear formatted text button - allow user to re-apply template */}
        {formattedText && (
          <Button
            variant="outline"
            onClick={() => {
              setFormattedText('');
              setSelectedTemplate(null);
            }}
            className="w-full flex items-center gap-2"
          >
            <span>Effacer et réappliquer le template</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
