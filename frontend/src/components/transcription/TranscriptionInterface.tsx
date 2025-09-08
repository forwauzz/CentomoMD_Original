import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Save, FileText, Copy, Edit, Trash2, MessageSquare, Volume2, CheckCircle, BarChart3 } from 'lucide-react';
import { t } from '@/lib/utils';
import { TranscriptionMode } from '@/types';
import { useTranscription } from '@/hooks/useTranscription';
import { SectionSelector } from './SectionSelector';
import { ModeToggle } from './ModeToggle';
import { LanguageSelector } from './LanguageSelector';
import { TemplateDropdown, TemplateJSON } from './TemplateDropdown';
import { FormattingService, FormattingOptions } from '@/services/formattingService';
import { TemplateSelector } from './TemplateSelector';
import { useCaseStore } from '@/stores/caseStore';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useUIStore } from '@/stores/uiStore';

interface TranscriptionInterfaceProps {
  sessionId?: string;
  onSessionUpdate?: (sessionId: string) => void;
  language?: 'fr' | 'en';
}

export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  language = 'en'
}) => {
  const featureFlags = useFeatureFlags();
  const { language: uiLanguage, setLanguage: setUILanguage } = useUIStore();
  const [mode, setMode] = useState<TranscriptionMode>('smart_dictation');
  
  // Convert UI store language (fr/en) to dictation format (fr-CA/en-US)
  const selectedLanguage = uiLanguage === 'fr' ? 'fr-CA' : 'en-US';
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateJSON | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattingProgress, setFormattingProgress] = useState('');
  
  // Transcript analysis pipeline state
  const [capturedTranscripts, setCapturedTranscripts] = useState<{
    original: string;
    formatted: string;
    templateName: string;
  } | null>(null);
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false);

  // Function to capture transcripts and show analysis prompt
  const captureTranscriptsForAnalysis = useCallback((original: string, formatted: string, templateName: string) => {
    // Only capture if the feature flag is enabled
    if (!featureFlags.transcriptAnalysisPipeline) {
      return;
    }
    
    setCapturedTranscripts({
      original,
      formatted,
      templateName
    });
    setShowAnalysisPrompt(true);
  }, [featureFlags.transcriptAnalysisPipeline]);

  // Function to navigate to analysis page with captured data
  const navigateToAnalysis = useCallback(() => {
    if (capturedTranscripts) {
      // Store captured transcripts in sessionStorage for the analysis page
      sessionStorage.setItem('transcriptAnalysisData', JSON.stringify(capturedTranscripts));
      
      // Navigate to analysis page
      window.location.href = '/transcript-analysis';
    }
    setShowAnalysisPrompt(false);
    setCapturedTranscripts(null);
  }, [capturedTranscripts]);

  const handleLanguageChange = (newLanguage: string) => {
    console.log('TranscriptionInterface: language changed from', selectedLanguage, 'to', newLanguage);
    // Convert dictation format (fr-CA/en-US) to UI store format (fr/en)
    const uiLanguageFormat = newLanguage === 'fr-CA' ? 'fr' : 'en';
    setUILanguage(uiLanguageFormat);
    console.log('TranscriptionInterface: UI language updated to:', uiLanguageFormat);
  };

  // Debug: Monitor selectedLanguage changes
  useEffect(() => {
    console.log('TranscriptionInterface: selectedLanguage derived from UI store:', selectedLanguage, 'uiLanguage:', uiLanguage);
  }, [selectedLanguage, uiLanguage]);

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

  // Case store for saving to sections
  const { updateSection } = useCaseStore();

  // Clear edited content when starting a new transcription session
  useEffect(() => {
    if (isRecording && editedTranscript) {
      console.log('New transcription session started, clearing previous edited content');
      setEditedTranscript('');
      setIsEditing(false);
    }
  }, [isRecording, editedTranscript]);

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
    // Load current content (either previously edited or original paragraphs)
    const currentContent = editedTranscript || paragraphs.join('\n\n');
    setEditedTranscript(currentContent);
  }, [paragraphs, editedTranscript]);

  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    // Save the edited transcript temporarily in UI (zero retention - no backend persistence)
    console.log('Edited transcript saved temporarily in UI:', editedTranscript);
    // The edited content will remain in editedTranscript state for template processing
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

  // Save to section functionality
  const handleSaveToSection = useCallback(async () => {
    if (!activeSection) {
      console.error('No active section selected');
      return;
    }

    const transcriptToSave = editedTranscript || paragraphs.join('\n\n');
    if (!transcriptToSave.trim()) {
      console.error('No transcript content to save');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Save transcript to the active section
      updateSection(activeSection, {
        transcript: transcriptToSave,
        savedAt: new Date().toISOString(),
        mode: mode,
        language: selectedLanguage
      });

      setSaveSuccess(true);
      console.log(`Transcript saved to section: ${activeSection}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving transcript to section:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activeSection, editedTranscript, paragraphs, mode, selectedLanguage, updateSection]);

  // Template content injection with AI formatting
  const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
    console.log('Injecting template content:', template.title);
    console.log('Template ID:', template.id);
    console.log('Template category:', template.category);
    console.log('Full template object:', template);
    
    // Set loading state
    setIsFormatting(true);
    setFormattingProgress('Initializing formatting...');
    
    // Check if this is a Word-for-Word formatter template
    if (template.id === 'word-for-word-formatter') {
      console.log('Applying Word-for-Word post-processing to current transcript');
      setFormattingProgress('Processing Word-for-Word formatting...');
      
      // Get the current raw transcript (prioritize saved edited content, then current editing, then paragraphs)
      const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
      
      console.log('Template processing - editedTranscript:', editedTranscript ? 'exists' : 'none');
      console.log('Template processing - paragraphs length:', paragraphs.length);
      console.log('Template processing - currentTranscript length:', currentTranscript.length);
      console.log('Template processing - rawTranscript length:', rawTranscript.length);
      console.log('Template processing - rawTranscript preview:', rawTranscript.substring(0, 200) + '...');
      
      if (rawTranscript && rawTranscript.trim()) {
        setFormattingProgress('Loading Word-for-Word formatter...');
        
        // Import the Word-for-Word formatter
        const { formatWordForWordText } = await import('../../utils/wordForWordFormatter');
        
        setFormattingProgress('Applying formatting rules...');
        
        // Apply Word-for-Word formatting with default config
        console.log('Raw transcript before formatting:', rawTranscript);
        const formattedTranscript = formatWordForWordText(rawTranscript);
        console.log('Formatted transcript after formatting:', formattedTranscript);
        
        setFormattingProgress('Updating transcript...');
        
        // Update the transcript with formatted content
        console.log('Before update - isEditing:', isEditing);
        console.log('Before update - editedTranscript length:', editedTranscript?.length || 0);
        
        if (isEditing) {
          setEditedTranscript(formattedTranscript);
          console.log('Updated editedTranscript (was already editing)');
        } else {
          // For now, we'll update the edited transcript since we can't directly modify the hook's state
          setEditedTranscript(formattedTranscript);
          setIsEditing(true);
          console.log('Updated editedTranscript and set isEditing to true');
        }
        
        console.log('After update - formattedTranscript length:', formattedTranscript.length);
        console.log('Word-for-Word post-processing applied successfully');
        
        // Capture transcripts for analysis
        captureTranscriptsForAnalysis(rawTranscript, formattedTranscript, template.title);
        
        setIsFormatting(false);
        setFormattingProgress('');
        return;
      } else {
        console.warn('No transcript content to format');
        setIsFormatting(false);
        setFormattingProgress('');
        return;
      }
    }
    
    // Check if this is a Section 7 AI formatter template or template combination
    if (template.id === 'section7-ai-formatter' || template.category === 'template-combo') {
      console.log('Applying Section 7 AI formatting to current transcript');
      console.log('Section 7 AI - Template ID:', template.id);
      console.log('Section 7 AI - Template category:', template.category);
      setFormattingProgress('Preparing Section 7 AI formatting...');
      
      // Get the current raw transcript (prioritize saved edited content, then current editing, then paragraphs)
      const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
      
      console.log('Section 7 AI processing - rawTranscript length:', rawTranscript.length);
      console.log('Section 7 AI processing - rawTranscript preview:', rawTranscript.substring(0, 200) + '...');
      
      if (rawTranscript && rawTranscript.trim()) {
        try {
          setFormattingProgress('Checking authentication...');
          
          // Import apiFetch and auth utilities
          const { apiFetch } = await import('../../lib/api');
          const { supabase } = await import('../../lib/authClient');
          
          // Check if user is authenticated
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.warn('User not authenticated for Section 7 AI formatting');
            alert('Please log in to use Section 7 AI formatting. The feature requires authentication.');
            setIsFormatting(false);
            setFormattingProgress('');
            return;
          }
          
          console.log('User authenticated, proceeding with Section 7 AI formatting');
          setFormattingProgress('Sending to AI formatter...');
          
          // Prepare template combination options
          const templateComboOptions = template.meta?.aiFormatter || {};
          const templateConfig = template.meta?.templateConfig;
          
          // Get template combination name from template config
          const templateCombo = templateConfig?.config?.templateCombo || templateComboOptions.templateCombo || 'default';
          
          // Get feature flags from template config
          const verbatimSupport = templateConfig?.features?.verbatimSupport || templateComboOptions.verbatimSupport || false;
          const voiceCommandsSupport = templateConfig?.features?.voiceCommandsSupport || templateComboOptions.voiceCommandsSupport || false;
          
          console.log('Template combination options:', {
            templateCombo,
            verbatimSupport,
            voiceCommandsSupport,
            templateConfig: templateConfig?.id
          });
          
          // Call Mode2Formatter API for Section 7 using proper authentication
          const result = await apiFetch('/api/format/mode2', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transcript: rawTranscript,
              section: '7',
              language: selectedLanguage === 'fr-CA' ? 'fr' : 'en',
              templateCombo,
              verbatimSupport,
              voiceCommandsSupport
            })
          });
          
          console.log('Section 7 AI formatting successful');
          console.log('Formatted result:', result.formatted);
          console.log('Issues found:', result.issues);
          console.log('Confidence score:', result.confidence_score);
          
          setFormattingProgress('Processing AI response...');
          
          // Update the transcript with AI-formatted content
          if (isEditing) {
            setEditedTranscript(result.formatted);
          } else {
            setEditedTranscript(result.formatted);
            setIsEditing(true);
          }
          
          setFormattingProgress('Finalizing formatting...');
          
          // Show any issues to the user
          if (result.issues && result.issues.length > 0) {
            console.warn('Section 7 formatting issues:', result.issues);
            // TODO: Show issues in UI (could be a toast notification)
          }
          
          // Capture transcripts for analysis
          captureTranscriptsForAnalysis(rawTranscript, result.formatted, template.title);
          
          setIsFormatting(false);
          setFormattingProgress('');
          return;
        } catch (error) {
          console.error('Error applying Section 7 AI formatting:', error);
          // Fallback: show error but don't break the flow
          alert(`Section 7 AI formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsFormatting(false);
          setFormattingProgress('');
          return;
        }
      } else {
        console.warn('No transcript content to format with Section 7 AI');
        setIsFormatting(false);
        setFormattingProgress('');
        return;
      }
    }
    
    // Regular template processing for non-Word-for-Word templates
    console.log('Falling through to regular template processing');
    console.log('Regular processing - Template ID:', template.id);
    console.log('Regular processing - Template category:', template.category);
    try {
      setFormattingProgress('Processing template content...');
      
      // Apply AI formatting to template content
      const formattingOptions: FormattingOptions = {
        section: (activeSection?.replace('section_', '') || '7') as "7" | "8" | "11",
        language: template.language || 'fr',
        complexity: template.complexity || 'medium',
        formattingLevel: 'advanced',
        includeSuggestions: true
      };
      
      setFormattingProgress('Applying AI formatting...');
      
      const formattedResult = await FormattingService.formatTemplateContent(
        template.content, 
        formattingOptions
      );
      
      console.log('AI formatting applied:', formattedResult.changes);
      
      setFormattingProgress('Finalizing template...');
      
      // Use formatted content
      const formattedContent = `[Template: ${template.title}]\n\n${formattedResult.formatted}\n\n`;
      
      if (isEditing) {
        setEditedTranscript(prev => prev + formattedContent);
      } else {
        setTemplateContent(formattedContent);
      }
      
      // Show success message with formatting info
      console.log('Template content injected successfully with AI formatting');
      console.log('Compliance:', formattedResult.compliance);
      
      // Capture transcripts for analysis (for regular templates, we compare original vs formatted content)
      const originalContent = template.content;
      const finalContent = formattedResult.formatted;
      captureTranscriptsForAnalysis(originalContent, finalContent, template.title);
      
      setIsFormatting(false);
      setFormattingProgress('');
      
    } catch (error) {
      console.error('Error applying AI formatting:', error);
      setFormattingProgress('Using fallback formatting...');
      
      // Fallback to basic formatting
      const basicFormatted = FormattingService.applyBasicFormatting(
        template.content,
        {
          section: (activeSection?.replace('section_', '') || '7') as "7" | "8" | "11",
          language: template.language || 'fr'
        }
      );
      
      const formattedContent = `[Template: ${template.title}]\n\n${basicFormatted}\n\n`;
      
      if (isEditing) {
        setEditedTranscript(prev => prev + formattedContent);
      } else {
        setTemplateContent(formattedContent);
      }
      
      console.log('Template content injected with basic formatting (fallback)');
      setIsFormatting(false);
      setFormattingProgress('');
    }
  }, [isEditing, editedTranscript, currentTranscript]);

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
                  currentSection={activeSection || 'section_7'}
                  currentLanguage={selectedLanguage}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={(template) => {
                    console.log('Template selected:', template);
                    console.log('Selected template ID:', template.id);
                    console.log('Selected template category:', template.category);
                    setSelectedTemplate(template);
                    setTemplateContent(template.content);
                    
                    // Inject template content into the transcript
                    injectTemplateContent(template);
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
              {/* Template Content Display */}
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Template Selected: {selectedTemplate.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => injectTemplateContent(selectedTemplate)}
                        className="h-6 px-2 text-xs bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Format
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateContent('');
                        }}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-blue-700 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                    {templateContent}
                  </div>
                </div>
              )}

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
                ) : editedTranscript ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {editedTranscript}
                    </p>
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

              {/* Success Message */}
              {saveSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Transcript saved to {activeSection} successfully!
                  </span>
                </div>
              )}

              {/* Formatting Loading State */}
              {isFormatting && (
                <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      Applying template formatting...
                    </p>
                    {formattingProgress && (
                      <p className="text-xs text-blue-600 mt-1">
                        {formattingProgress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={isFormatting}
                >
                  <FileText className="h-4 w-4" />
                  <span>{isFormatting ? 'Formatting...' : 'Select Template'}</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Voice Command</span>
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveToSection}
                  disabled={isSaving || (!editedTranscript && paragraphs.length === 0)}
                >
                  {saveSuccess ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>
                    {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save to Section'}
                  </span>
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <TemplateSelector
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelect={(template) => {
            console.log('Template selected from modal:', template);
            setSelectedTemplate(template);
            injectTemplateContent(template);
            setShowTemplateModal(false);
          }}
          currentSection={activeSection || 'section_7'}
          currentLanguage={selectedLanguage}
          isFormatting={isFormatting}
        />
      )}

      {/* Analysis Prompt Modal */}
      {showAnalysisPrompt && capturedTranscripts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Review Template Analysis
                </h3>
                <p className="text-sm text-gray-500">
                  Template: {capturedTranscripts.templateName}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Would you like to analyze the quality of the AI formatting? This will help identify any potential issues, hallucinations, or improvements needed.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnalysisPrompt(false);
                  setCapturedTranscripts(null);
                }}
                className="flex-1"
              >
                Skip Analysis
              </Button>
              <Button
                onClick={navigateToAnalysis}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Review Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
