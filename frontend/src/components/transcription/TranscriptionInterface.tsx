import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Play, Pause, Save, Download, Volume2 } from 'lucide-react';
import { cn, formatDuration, t } from '@/lib/utils';
import { TranscriptionState, CNESSTSection, TranscriptionMode } from '@/types';
import { useTranscription } from '@/hooks/useTranscription';
import { useWebSocket } from '@/hooks/useWebSocket';
import { VoiceCommandPanel } from './VoiceCommandPanel';
import { VoiceCommandFeedback } from './VoiceCommandFeedback';
import { VoiceCommandTraining } from './VoiceCommandTraining';
import { SectionSelector } from './SectionSelector';
import { ModeToggle } from './ModeToggle';
import { LanguageSelector } from './LanguageSelector';

interface TranscriptionInterfaceProps {
  sessionId?: string;
  onSessionUpdate?: (sessionId: string) => void;
  language?: 'fr' | 'en';
}

export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  onSessionUpdate,
  language = 'fr'
}) => {
  const [currentSection, setCurrentSection] = useState<CNESSTSection>('section_7');
  const [mode, setMode] = useState<TranscriptionMode>('smart_dictation');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr-CA');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const handleLanguageChange = (newLanguage: string) => {
    console.log('TranscriptionInterface: language changed from', selectedLanguage, 'to', newLanguage);
    setSelectedLanguage(newLanguage);
    console.log('TranscriptionInterface: selectedLanguage state updated to:', newLanguage);
  };

  // Debug: Monitor selectedLanguage changes
  useEffect(() => {
    console.log('TranscriptionInterface: selectedLanguage state changed to:', selectedLanguage);
  }, [selectedLanguage]);

  const {
    isRecording,
    isConnected,
    currentTranscript,
    finalTranscripts,
    segments,
    paragraphs,
    activeSection,
    buffers,
    voiceCommands,
    isListening,
    startRecording,
    stopRecording,
    sendVoiceCommand,
    error,
    reconnectionAttempts,
    setActiveSection
  } = useTranscription(sessionId);

  const { sendMessage } = useWebSocket();

  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);
  const audioLevelRef = useRef<number>(0);

  // Session timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      if (!sessionTimerRef.current) {
        startTimeRef.current = Date.now();
        sessionTimerRef.current = setInterval(() => {
          setSessionDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      }
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = undefined;
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  // Audio level visualization
  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        // Simulate audio level based on recording state
        const baseLevel = Math.random() * 30 + 10; // 10-40 range
        const newLevel = Math.min(100, baseLevel + Math.random() * 20);
        setAudioLevel(newLevel);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isRecording, isPaused]);

  // Auto-save every 5 minutes
  useEffect(() => {
    if (isRecording && sessionDuration > 0 && sessionDuration % 300 === 0) {
      handleAutoSave();
    }
  }, [sessionDuration, isRecording]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setSessionDuration(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording();
      setIsPaused(false);
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = undefined;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [stopRecording]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      sendVoiceCommand('reprendre transcription');
    } else {
      setIsPaused(true);
      sendVoiceCommand('pause transcription');
    }
  }, [isPaused, sendVoiceCommand]);

  const handleAutoSave = useCallback(() => {
    // Auto-save logic
    console.log('Auto-saving session...');
  }, []);

  const handleExport = useCallback(() => {
    // Export logic
    console.log('Exporting session...');
  }, []);

  const getConnectionStatus = () => {
    if (!isConnected) return { status: 'disconnected', color: 'destructive' as const };
    if (reconnectionAttempts > 0) return { status: 'reconnecting', color: 'warning' as const };
    return { status: 'connected', color: 'success' as const };
  };

  const connectionStatus = getConnectionStatus();

  // Debug: Check recording state
  console.log('TranscriptionInterface: isRecording =', isRecording, 'selectedLanguage =', selectedLanguage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t('newSession', language)}</h1>
          <p className="text-muted-foreground">
            {t('sessionDuration', language)}: {formatDuration(sessionDuration)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={connectionStatus.color}>
            {t(connectionStatus.status, language)}
          </Badge>
          {reconnectionAttempts > 0 && (
            <Badge variant="warning">
              {t('reconnecting', language)} ({reconnectionAttempts})
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('transcription', language)}</span>
            <div className="flex items-center space-x-2">
              <LanguageSelector
                language={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                disabled={false} // Temporarily force enabled for testing
              />
              <SectionSelector
                currentSection={activeSection}
                onSectionChange={setActiveSection}
                language={language}
              />
              <ModeToggle
                currentMode={mode}
                onModeChange={setMode}
                language={language}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                variant="medical"
                size="medical"
                className="flex items-center space-x-2"
              >
                <Mic className="h-5 w-5" />
                <span>{t('startRecording', language)}</span>
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStopRecording}
                  variant="medicalDanger"
                  size="medical"
                  className="flex items-center space-x-2"
                >
                  <Square className="h-5 w-5" />
                  <span>{t('stopRecording', language)}</span>
                </Button>
                <Button
                  onClick={handlePauseResume}
                  variant="outline"
                  size="medical"
                  className="flex items-center space-x-2"
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  <span>{isPaused ? t('resume', language) : t('pause', language)}</span>
                </Button>
              </>
            )}
          </div>

          {/* Audio Level Visualization */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-green-500" />
                  <span>{t('audioLevel', language)}</span>
                </div>
                <span className="text-green-600 font-medium">{Math.round(audioLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('recording', language)}</span>
                <span>{formatDuration(sessionDuration)}</span>
              </div>
              <Progress value={(sessionDuration / 3600) * 100} className="h-2" />
            </div>
          )}

                     {/* Voice Commands & Training Toggle */}
           <div className="flex justify-center space-x-2">
             <Button
               variant="outline"
               onClick={() => setShowVoiceCommands(!showVoiceCommands)}
               className="flex items-center space-x-2"
             >
               <span>{t('voiceCommands', language)}</span>
             </Button>
             <Button
               variant="outline"
               onClick={() => setShowTraining(!showTraining)}
               className="flex items-center space-x-2"
             >
               <span>{language === 'fr' ? 'Entraînement' : 'Training'}</span>
             </Button>
           </div>
        </CardContent>
      </Card>

             {/* Voice Commands Panel */}
       {showVoiceCommands && (
         <VoiceCommandPanel
           onCommand={sendVoiceCommand}
           language={language}
         />
       )}

               {/* Voice Command Feedback */}
        <VoiceCommandFeedback
          commands={voiceCommands}
          isListening={isListening}
          language={language}
        />

        {/* Voice Command Training */}
        {showTraining && (
          <VoiceCommandTraining
            language={language}
            onCommandPractice={sendVoiceCommand}
            onAccessibilityToggle={(enabled) => {
              console.log('Accessibility toggled:', enabled);
              // TODO: Implement accessibility features
            }}
          />
        )}

      {/* Transcription Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t(activeSection, language)}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSave}
                className="flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>{t('save', language)}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>{t('export', language)}</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Transcript - Live Partial Results */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('currentTranscript', language)}
              </label>
              <Textarea
                value={currentTranscript}
                readOnly
                placeholder={t('transcriptionPlaceholder', language)}
                className="min-h-[200px] font-mono text-sm"
                autoResize
                maxHeight="400px"
              />
            </div>

            {/* Final Transcripts - Enhanced Paragraph Display */}
            {paragraphs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('finalTranscripts', language)}
                </label>
                
                {/* Section Header with Language Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{t(activeSection, language)}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {selectedLanguage === 'fr-CA' ? 'FR-CA' : 'EN-US'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const text = paragraphs.join('\n\n');
                        navigator.clipboard.writeText(text);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <span className="text-xs">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      className="flex items-center space-x-1"
                    >
                      <span className="text-xs">Export</span>
                    </Button>
                  </div>
                </div>
                
                {/* Paragraphs Display with Auto-scroll */}
                <div 
                  id="finalTranscripts" 
                  className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar"
                  ref={(el) => {
                    if (el && paragraphs.length > 0) {
                      // Auto-scroll to bottom when new paragraphs are added
                      setTimeout(() => {
                        el.scrollTop = el.scrollHeight;
                      }, 100);
                    }
                  }}
                >
                  {paragraphs.map((paragraph, index) => (
                    <p key={index} className="leading-7 text-sm">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <span className="text-sm font-medium">{t('error', language)}:</span>
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
