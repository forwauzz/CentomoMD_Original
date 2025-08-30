import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Save, FileText, Copy, Edit, Trash2, MessageSquare, Volume2 } from 'lucide-react';
import { t } from '@/lib/utils';
import { TranscriptionMode } from '@/types';
import { useTranscription } from '@/hooks/useTranscription';
import { SectionSelector } from './SectionSelector';
import { ModeToggle } from './ModeToggle';
import { LanguageSelector } from './LanguageSelector';
import { TemplateDropdown } from './TemplateDropdown';

interface TranscriptionInterfaceProps {
  sessionId?: string;
  onSessionUpdate?: (sessionId: string) => void;
  language?: 'fr' | 'en';
}

export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  language = 'en'
}) => {
  const [mode, setMode] = useState<TranscriptionMode>('smart_dictation');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('fr-CA');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');

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
    currentTranscript,
    paragraphs,
    activeSection,
    startRecording,
    stopRecording,
    error,
    setActiveSection
  } = useTranscription(sessionId, selectedLanguage);

  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

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
      // Use the selected language for transcription
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
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [stopRecording]);

  const handleAutoSave = useCallback(() => {
    // Auto-save logic
    console.log('Auto-saving session...');
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy functionality
  const handleCopy = useCallback(async () => {
    const transcriptText = paragraphs.join('\n\n');
    try {
      await navigator.clipboard.writeText(transcriptText);
      console.log('Transcript copied to clipboard');
    } catch (error) {
      console.error('Failed to copy transcript:', error);
    }
  }, [paragraphs]);

  // Edit functionality
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedTranscript(paragraphs.join('\n\n'));
  }, [paragraphs]);

  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    // Here you would typically save the edited transcript back to your state/backend
    console.log('Edited transcript saved:', editedTranscript);
  }, [editedTranscript]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedTranscript('');
  }, []);

  // Delete functionality
  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this transcript?')) {
      // Here you would typically clear the transcript from your state/backend
      console.log('Transcript deleted');
    }
  }, []);

  // Debug: Check recording state
  console.log('TranscriptionInterface: isRecording =', isRecording, 'selectedLanguage =', selectedLanguage);

  return (
    <div className="space-y-6 pb-16">
      {/* Three Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Dictation Controls Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Dictation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Language</label>
                <LanguageSelector
                  language={selectedLanguage}
                  onLanguageChange={handleLanguageChange}
                  disabled={isRecording}
                />
              </div>

              {/* Section Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Section</label>
                <SectionSelector
                  currentSection={activeSection}
                  onSectionChange={setActiveSection}
                />
              </div>

              {/* Template Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Template</label>
                <TemplateDropdown
                  currentSection={activeSection.replace('section_', '') as "7" | "8" | "11"}
                  currentLanguage={selectedLanguage === 'fr-CA' ? 'fr' : 'en'}
                  onTemplateSelect={(template) => {
                    console.log('Template selected:', template);
                    // TODO: Implement template content injection
                  }}
                />
              </div>

              {/* Mode Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mode</label>
                <ModeToggle
                  currentMode={mode}
                  onModeChange={setMode}
                  language={language}
                />
              </div>

              {/* Recording Control Buttons */}
              <div className="space-y-2">
                {!isRecording ? (
                  <Button
                    onClick={handleStartRecording}
                    variant="medical"
                    size="medical"
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Dictating</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    variant="medical"
                    size="medical"
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700"
                  >
                    <MicOff className="h-5 w-5" />
                    <span>Stop Dictating</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live and Final Transcript Cards Side by Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Transcription Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Live Transcription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Duration and Audio Level Indicators */}
              {isRecording && (
                <div className="space-y-3">
                  {/* Duration Indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recording Duration</span>
                    <span className="font-mono font-medium text-blue-600">
                      {formatDuration(sessionDuration)}
                    </span>
                  </div>
                  
                  {/* Audio Level Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Audio Level</span>
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
                </div>
              )}

              {/* Live Transcript Content */}
              <div className="min-h-[150px] bg-gray-50 rounded-md p-4">
                {currentTranscript ? (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentTranscript}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Live transcription will appear here when you start dictating...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Final Transcript Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Final Transcript</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={handleCopy}
                    title="Copy transcript"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={handleEdit}
                    title="Edit transcript"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={handleDelete}
                    title="Delete transcript"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Final Transcript Text Area */}
              <div className="min-h-[200px] bg-gray-50 rounded-md p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Edit your transcript here..."
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : paragraphs.length > 0 ? (
                  <div className="space-y-3">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-sm text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Final transcript will appear here after you stop dictating...
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Select Template</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Voice Command</span>
                </Button>
                <Button variant="default" size="sm" className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700">
                  <Save className="h-4 w-4" />
                  <span>Save to Section</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
