import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, FileText, Copy, Edit, Trash2, MessageSquare, Volume2, CheckCircle, BarChart3 } from 'lucide-react';
import { t } from '@/lib/utils';
import { TranscriptionMode } from '@/types';
import { useTranscription } from '@/hooks/useTranscription';
import { SectionSelector } from './SectionSelector';
import { ModeDropdown } from './ModeDropdown';
import { InputLanguageSelector } from './LanguageSelector';
import { OutputLanguageSelector } from './OutputLanguageSelector';
import { OrthopedicNarrative } from './OrthopedicNarrative';
import { TemplateDropdown, TemplateJSON } from './TemplateDropdown';
import { FormattingService, FormattingOptions } from '@/services/formattingService';
import { TemplateSelector } from './TemplateSelector';
import { SaveToSectionDropdown, SaveToSectionOption } from './SaveToSectionDropdown';
import { api, apiFetch } from '@/lib/api';
import { useCaseStore } from '@/stores/caseStore';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useUIStore } from '@/stores/uiStore';
import { useBackendConfig } from '@/hooks/useBackendConfig';
import { ClinicalEntities, UniversalCleanupResponse } from '@/types/clinical';
import { useTranscriptionContext, TranscriptionContextData } from '@/contexts/TranscriptionContext';
import { supabase } from '@/lib/authClient';
import { TemplateFormattingLoader } from '@/components/loading/TemplateFormattingLoader';

interface TranscriptionInterfaceProps {
  sessionId?: string;
  onSessionUpdate?: (sessionId: string) => void;
  language?: 'fr' | 'en';
  caseId?: string;
  sectionId?: string;
}

export const TranscriptionInterface: React.FC<TranscriptionInterfaceProps> = ({
  sessionId,
  language = 'en',
  caseId,
  sectionId
}) => {
  const featureFlags = useFeatureFlags();
  const { inputLanguage, outputLanguage, setInputLanguage, setOutputLanguage, addToast } = useUIStore();
  const { config: backendConfig } = useBackendConfig();
  const { setTranscriptionData } = useTranscriptionContext();
  const { createSession, commitSectionFromSession, linkDictationSession } = useCaseStore();
  
  // Parse URL parameters for case context
  const [urlCaseId, setUrlCaseId] = useState<string | undefined>(caseId);
  const [urlSectionId, setUrlSectionId] = useState<string | undefined>(sectionId);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCase = urlParams.get('caseId');
    const urlSection = urlParams.get('sectionId');
    
    if (urlCase) setUrlCaseId(urlCase);
    if (urlSection) setUrlSectionId(urlSection);
    
    console.log('🔍 Case context from URL:', { caseId: urlCase, sectionId: urlSection });
  }, []);
  
  // Use URL parameters if available, otherwise use props
  const effectiveCaseId = urlCaseId || caseId;
  const effectiveSectionId = urlSectionId || sectionId;
  
  // Template tracking and feedback
  const {
    trackTemplateApplication,
    submitFeedback,
    dismissFeedback,
    pendingFeedback,
    showFeedbackBanner,
  } = useTemplateTracking(sessionId, effectiveCaseId);
  
  const [mode, setMode] = useState<TranscriptionMode>('smart_dictation');
  
  // Derive dictation language from canonical state (no local state needed)
  const dictationLanguage = inputLanguage === 'fr' ? 'fr-CA' : 'en-US';
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
  const [aiStepStatus, setAiStepStatus] = useState<'success' | 'skipped' | 'error' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Race condition guard - prevent stale responses
  const latestOpRef = useRef<string | null>(null);
  
  // Clinical entities state (S6.4 - Caching for Reuse)
  const [, setClinicalEntities] = useState<ClinicalEntities | null>(null);
  
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

  // Function to check if Universal Cleanup is enabled
  const checkUniversalCleanupEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api('/api/config');
      const config = await response.json();
      return config.universalCleanupEnabled === true;
    } catch (error) {
      console.warn('Failed to fetch config for Universal Cleanup check:', error);
      return false;
    }
  }, []);

  // Function to handle Universal Cleanup formatting
  const handleUniversalCleanupFormatting = useCallback(async (
    rawTranscript: string,
    template: TemplateJSON
  ): Promise<UniversalCleanupResponse> => {
    // Guard: avoid calling API with empty transcript
    if (!rawTranscript || !rawTranscript.trim()) {
      throw new Error('No transcript content available');
    }
    // Generate operation ID to prevent stale responses
    const opId = crypto.randomUUID();
    latestOpRef.current = opId;
    console.log('[UNIVERSAL] Starting operation:', opId);
    
    setFormattingProgress('Preparing transcript...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
    
    // Step 1: Clean transcript and extract clinical entities
    setFormattingProgress('Analyzing transcript...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
    
    // Determine section from template metadata or fallback to template ID
    let section = '7'; // Default fallback
    if (template.meta?.templateConfig?.compatibleSections?.[0]) {
      section = template.meta.templateConfig.compatibleSections[0].replace('section_', '');
    } else if (template.id?.includes('section-8')) {
      section = '8';
    } else if (template.id?.includes('section-11')) {
      section = '11';
    }
    
    console.log(`[Universal Cleanup] Using section: ${section} for template: ${template.id}`);
    
    setFormattingProgress('Extracting clinical entities...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
    
    const result: UniversalCleanupResponse = await apiFetch('/api/format/mode2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: rawTranscript,
        section: section,
        language: inputLanguage,
        inputLanguage: inputLanguage,
        outputLanguage: outputLanguage,
        useUniversal: true,
        templateId: template.id
      })
    });
    
    
    
    // Check for stale response
    if (latestOpRef.current !== opId) {
      console.log('[UNIVERSAL] Operation cancelled due to race condition:', opId);
      throw new Error('Operation cancelled due to race condition');
    }
    
    setFormattingProgress('Applying formatting...');
    await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
    
    // Store clinical entities for reuse
    if (result.clinical_entities) {
      console.log('Clinical entities extracted via Universal Cleanup:', result.clinical_entities);
      setClinicalEntities(result.clinical_entities);
    }
    
    return result;
  }, [dictationLanguage]);

  const handleInputLanguageChange = useCallback((newLanguage: string) => {
    console.log('TranscriptionInterface: input language changed from', dictationLanguage, 'to', newLanguage);
    // Convert dictation format (fr-CA/en-US) to UI store format (fr/en)
    const canonicalLanguage = newLanguage === 'fr-CA' ? 'fr' : 'en';
    setInputLanguage(canonicalLanguage);
    console.log('TranscriptionInterface: UI input language updated to:', canonicalLanguage);
  }, [dictationLanguage, setInputLanguage]);

  const handleOutputLanguageChange = (newLanguage: 'fr' | 'en') => {
    console.log('TranscriptionInterface: output language changed from', outputLanguage, 'to', newLanguage);
    setOutputLanguage(newLanguage);
  };

  // Debug: Monitor language changes
  useEffect(() => {
    console.log('TranscriptionInterface: dictationLanguage derived from UI store:', dictationLanguage, 'inputLanguage:', inputLanguage, 'outputLanguage:', outputLanguage);
  }, [dictationLanguage, inputLanguage, outputLanguage]);

  const {
    isRecording,
    currentTranscript,
    paragraphs,
    segments,
    activeSection,
    startRecording,
    stopRecording,
    error,
    setActiveSection,
    mode3Narrative,
    mode3Progress,
    // cleanedConversation,
    orthopedicNarrative
  } = useTranscription(sessionId, dictationLanguage, mode);

  // Track previous context data to prevent unnecessary updates
  const prevContextDataRef = useRef<TranscriptionContextData | null>(null);

  // Update global transcription context when data changes
  useEffect(() => {
    const contextData = {
      currentTranscript: editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript),
      mode: mode,
      inputLanguage: inputLanguage, // Use input language for context
      outputLanguage: outputLanguage, // Use output language for context
      templateName: selectedTemplate?.title || '',
      diarization: featureFlags.speakerLabeling,
      customVocab: false, // TODO: Add custom vocab detection
      sessionId: sessionId,
      paragraphs: paragraphs,
      segments: segments,
      orthopedicNarrative: orthopedicNarrative,
    };
    
    // Only update if data actually changed to prevent loops
    if (JSON.stringify(prevContextDataRef.current) !== JSON.stringify(contextData)) {
      prevContextDataRef.current = contextData;
      setTranscriptionData(contextData);
    }
  }, [
    editedTranscript,
    paragraphs,
    currentTranscript,
    mode,
    inputLanguage,
    outputLanguage,
    selectedTemplate,
    sessionId,
    segments,
    orthopedicNarrative
  ]);

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
    // Get the current transcript content using the same logic as display
    const transcriptText = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
    
    if (!transcriptText || !transcriptText.trim()) {
      addToast({
        type: 'warning',
        title: 'Nothing to copy',
        message: 'No transcript content available to copy'
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopySuccess(true);
      addToast({
        type: 'success',
        title: 'Copied to clipboard',
        message: 'Transcript has been copied to your clipboard'
      });
      // Hide success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy transcript:', error);
      addToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Failed to copy transcript to clipboard'
      });
    }
  }, [editedTranscript, paragraphs, currentTranscript, addToast, setCopySuccess]);

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
      // Clear the transcript content
      setEditedTranscript('');
      setIsEditing(false);
      setSelectedTemplate(null);
      setTemplateContent('');
      console.log('Transcript deleted');
      addToast({
        type: 'success',
        title: 'Transcript deleted',
        message: 'The transcript has been successfully deleted'
      });
    }
  }, [addToast]);

  // Enhanced save to section functionality with dropdown
  const handleSaveToSection = useCallback(async (option: SaveToSectionOption | SaveToSectionOption[]) => {
    const transcriptToSave = editedTranscript || paragraphs.join('\n\n');
    if (!transcriptToSave.trim()) {
      console.error('No transcript content to save');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const options = Array.isArray(option) ? option : [option];
      
      // Ensure we have a case created first
      const { currentCase, createCase } = useCaseStore.getState();
      if (!currentCase) {
        console.log('🆕 Creating new case for save operation');
        await createCase();
      }
      
      const savePromises = options.map(async (opt) => {
        // Create session first
        const session = await createSession(opt.sectionId, transcriptToSave, {
          mode: mode,
          template: selectedTemplate?.id,
          language: dictationLanguage,
          inputLanguage: inputLanguage,
          outputLanguage: outputLanguage,
          savedAt: new Date().toISOString()
        });

        // Link to case if case context is available
        if (effectiveCaseId && effectiveSectionId && featureFlags.caseManagement) {
          try {
            await linkDictationSession(effectiveCaseId, session.id, effectiveSectionId, transcriptToSave);
            console.log('✅ Session linked to case:', { caseId: effectiveCaseId, sessionId: session.id, sectionId: effectiveSectionId });
          } catch (error) {
            console.error('❌ Failed to link session to case:', error);
          }
        }

        // Commit to section
        await commitSectionFromSession(opt.sectionId, session.id, transcriptToSave);

        // Also update local store for immediate UI feedback
        const sectionData: Record<string, any> = {
          savedAt: new Date().toISOString(),
          mode: mode,
          language: dictationLanguage,
          inputLanguage: inputLanguage,
          outputLanguage: outputLanguage,
          template: selectedTemplate?.id
        };
        
        // Set the specific text box field
        sectionData[opt.textBoxId] = transcriptToSave;
        updateSection(opt.sectionId, sectionData);

        return opt;
      });

      await Promise.all(savePromises);

      setSaveSuccess(true);
      const sectionNames = options.map(opt => opt.sectionId.replace('section_', 'Section ')).join(', ');
      console.log(`✅ Transcript saved to ${sectionNames}`);

      // Navigate to the form with the first saved section active
      const firstSection = options[0];
      if (firstSection) {
        console.log('🧭 Navigating to form with section:', firstSection.sectionId);
        // Use a small delay to ensure the save operation completes
        setTimeout(() => {
          window.location.href = `/case/new?section=${firstSection.sectionId}`;
        }, 500);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving transcript to section:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editedTranscript, paragraphs, mode, dictationLanguage, inputLanguage, outputLanguage, selectedTemplate, updateSection, createSession, commitSectionFromSession]);

  // Template content injection with AI formatting
  const injectTemplateContent = useCallback(async (template: TemplateJSON) => {
    console.log('Injecting template content:', template.title);
    console.log('Template ID:', template.id);
    console.log('Template category:', template.category);
    console.log('Full template object:', template);
    
    // Set loading state
    setIsFormatting(true);
    setFormattingProgress('Initializing formatting...');
    
    // Check if Universal Cleanup is enabled
    const universalCleanupEnabled = await checkUniversalCleanupEnabled();
    console.log('Universal Cleanup enabled:', universalCleanupEnabled);
    console.log('Template ID:', template.id);
    console.log('Template category:', template.category);
    
    // Get the current raw transcript (prioritize saved edited content, then current editing, then paragraphs)
    const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
    
    if (universalCleanupEnabled && rawTranscript && rawTranscript.trim()) {
      console.log('Using Universal Cleanup flow for template:', template.title);
      console.log('[UNIVERSAL] Raw transcript length:', rawTranscript.length);
      
      try {
        const result = await handleUniversalCleanupFormatting(rawTranscript, template);
        
        console.log('[UNIVERSAL] Result received:', {
          formatted: result.formatted?.substring(0, 100) + '...',
          formattedLength: result.formatted?.length,
          issues: result.issues
        });
        
        // Update the transcript with formatted content
        if (isEditing) {
          setEditedTranscript(result.formatted);
        } else {
          setEditedTranscript(result.formatted);
          setIsEditing(true);
        }
        
        setFormattingProgress('Universal Cleanup completed');
        setAiStepStatus('success');
        
        // Capture transcripts for analysis
        captureTranscriptsForAnalysis(rawTranscript, result.formatted, template.title);
        
        // Track template application
        if (template.id) {
          await trackTemplateApplication(template.id, {
            sectionId: effectiveSectionId || activeSection,
            modeId: mode,
          });
        }
        
        setIsFormatting(false);
        setFormattingProgress('');
        return;
      } catch (error) {
        console.error('Universal Cleanup formatting error:', error);
        setAiStepStatus('error');
        alert(`Universal Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsFormatting(false);
        setFormattingProgress('');
        return;
      }
    }
    
    // Check if this is a Word-for-Word formatter template (either basic or with AI)
    if (template.id === 'word-for-word-formatter' || template.id === 'word-for-word-with-ai') {
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
        let formattedTranscript = formatWordForWordText(rawTranscript);
        console.log('Formatted transcript after deterministic formatting:', formattedTranscript);
        
        // Check if this is the "Word-for-Word (with AI)" template
        if ((template.id as string) === 'word-for-word-with-ai' || template.title?.includes('with AI')) {
          setFormattingProgress('Applying AI formatting cleanup...');
          
          // Generate correlation ID for tracking
          const correlationId = `ww-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`[${correlationId}] Starting AI formatting request`, {
            inputLength: formattedTranscript.length,
            language: inputLanguage
          });
          
          try {
            // Determine API base URL
            const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
            const endpoint = `${apiBase}/format/word-for-word-ai`;
            
            // Get access token from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token || null;
            
            // Call the backend Word-for-Word (with AI) formatting endpoint
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-correlation-id': correlationId,
                ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
              },
              credentials: 'include',
              body: JSON.stringify({
                transcript: formattedTranscript,
                language: inputLanguage,
                inputLanguage: inputLanguage,
                outputLanguage: outputLanguage
              })
            });
            
            console.log(`[${correlationId}] AI formatting response:`, {
              status: response.status,
              ok: response.ok
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log(`[${correlationId}] AI formatting result:`, {
                success: result.success,
                outputLength: result.formatted?.length || 0,
                issues: result.issues || []
              });
              
              if (result.success && result.formatted) {
                formattedTranscript = result.formatted;
                setFormattingProgress('AI formatting applied successfully');
                setAiStepStatus('success');
              } else {
                console.warn(`[${correlationId}] AI formatting failed, using deterministic result:`, result.error);
                setFormattingProgress('AI formatting failed, using deterministic result');
                // Set AI step status for UI indication
                setAiStepStatus('skipped');
              }
            } else {
              console.warn(`[${correlationId}] AI formatting request failed:`, response.status);
              setFormattingProgress('AI formatting request failed, using deterministic result');
              setAiStepStatus('skipped');
            }
          } catch (error) {
            console.error(`[${correlationId}] AI formatting error:`, error);
            setFormattingProgress('AI formatting error, using deterministic result');
            setAiStepStatus('skipped');
          }
        }
        
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
        
        // Track template application
        if (template.id) {
          await trackTemplateApplication(template.id, {
            sectionId: effectiveSectionId || activeSection,
            modeId: mode,
          });
        }
        
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
    
    // Check if this is a clinical extraction template
    if (template.id === 'section7-clinical-extraction') {
      console.log('Applying Clinical Extraction formatting to current transcript');
      setFormattingProgress('Extracting clinical context...');
      
      // Get the current raw transcript
      const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
      
      if (rawTranscript && rawTranscript.trim()) {
        try {
          setFormattingProgress('Processing clinical extraction...');
          
          // Call Mode 2 formatter with clinical extraction template combination (auth-aware)
          const result = await apiFetch('/api/format/mode2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: rawTranscript,
              section: '7',
              language: inputLanguage,
              inputLanguage: inputLanguage,
              outputLanguage: outputLanguage,
              templateCombo: 'template-clinical-extraction',
              correlationId: `clinical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            })
          });
          
          setFormattingProgress('Clinical extraction completed');
          
          // Store clinical entities for reuse (S6.4 - Caching for Reuse)
          if (result.clinical_entities) {
            console.log('Clinical entities extracted:', result.clinical_entities);
            // Store in component state for potential reuse
            setClinicalEntities(result.clinical_entities);
          }
          
          setEditedTranscript(result.formatted);
          setAiStepStatus('success');
          
          // Track template application
          if (template.id) {
            await trackTemplateApplication(template.id, {
              sectionId: effectiveSectionId || activeSection,
              modeId: mode,
            });
          }
          
        } catch (error) {
          console.error('Clinical extraction error:', error);
          setAiStepStatus('error');
          alert('Clinical extraction failed. Please try again.');
        }
      }
      
      setIsFormatting(false);
      setFormattingProgress('');
      return;
    }
    
    // Check if this is a Section 7 or Section 8 AI formatter template or template combination
    if (template.id === 'section7-ai-formatter' || template.id === 'section8-ai-formatter' || template.category === 'template-combo') {
      console.log('Applying AI formatting to current transcript');
      console.log('Template ID:', template.id);
      console.log('Template category:', template.category);
      setFormattingProgress('Preparing AI formatting...');
      
      // Get the current raw transcript (prioritize saved edited content, then current editing, then paragraphs)
      const rawTranscript = editedTranscript || (paragraphs.length > 0 ? paragraphs.join('\n\n') : currentTranscript);
      
      console.log('AI processing - rawTranscript length:', rawTranscript.length);
      console.log('AI processing - rawTranscript preview:', rawTranscript.substring(0, 200) + '...');
      
      if (rawTranscript && rawTranscript.trim()) {
        try {
          setFormattingProgress('Checking authentication...');
          
          // Import auth utilities
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
          setFormattingProgress('Preparing AI formatting...');
          
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
          
          // Race condition guard
          const opId = crypto.randomUUID();
          latestOpRef.current = opId;
          console.log('[FORMAT] Starting operation', opId);
          
          // Determine section based on template ID
          let section = '7'; // Default to Section 7
          if (template.id === 'section8-ai-formatter') {
            section = '8';
          } else if (template.id === 'section11-ai-formatter') {
            section = '11';
          }
          
          console.log('Using section:', section, 'for template:', template.id);
          
          // Section-specific message
          if (section === '8') {
            setFormattingProgress('Formatting Section 8...');
          } else if (section === '7') {
            setFormattingProgress('Formatting Section 7...');
          } else {
            setFormattingProgress('Sending to AI formatter...');
          }
          await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
          
          // Call Mode2Formatter API (auth-aware)
          const result = await apiFetch('/api/format/mode2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: rawTranscript,
              section: section,
              language: inputLanguage,
              inputLanguage: inputLanguage,
              outputLanguage: outputLanguage,
              templateCombo,
              verbatimSupport,
              voiceCommandsSupport
            })
          });
          
          console.log('AI formatting successful');
          console.log('Formatted result:', result.formatted);
          console.log('Issues found:', result.issues);
          console.log('Confidence score:', result.confidence_score);
          
          // GPT Diagnostic Code - Check for common issues
          try {
            console.log('[FORMAT] raw result', result);

            const formatted =
              result?.formatted ??
              result?.text ??
              result?.data?.formatted ??
              '';

            console.log('[FORMAT] derived formatted length', formatted?.length);
            console.log('[FORMAT] issues', result?.issues);
            console.log('[FORMAT] path', result?.path || 'unknown');
            console.log('[FORMAT] shadowComparison exists?', !!result?.shadowComparison);
            
            if (result?.shadowComparison) {
              console.log('[FORMAT] shadow legacy formatted length', result.shadowComparison.legacyFormatted?.length);
              console.log('[FORMAT] shadow universal formatted length', result.shadowComparison.universalFormatted?.length);
              console.log('[FORMAT] shadow checksum match', result.shadowComparison.checksumMatch);
            }
          } catch (e) {
            console.error('[FORMAT] diagnostic error', e);
          }
          
          // Section-specific processing message
          if (section === '8') {
            setFormattingProgress('Processing Section 8 formatting...');
          } else if (section === '7') {
            setFormattingProgress('Processing Section 7 formatting...');
          } else {
            setFormattingProgress('Processing AI response...');
          }
          await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
          
          // Check for race condition
          if (latestOpRef.current !== opId) {
            console.log('[FORMAT] Operation cancelled due to race condition', opId);
            return;
          }
          
          // Update the transcript with AI-formatted content
          const formatted = result?.formatted ?? result?.text ?? result?.data?.formatted ?? '';
          console.log('[FORMAT] Setting edited transcript with length:', formatted.length);
          
          if (isEditing) {
            setEditedTranscript(formatted);
          } else {
            setEditedTranscript(formatted);
            setIsEditing(true);
          }
          
          // Verify state after next tick
          setTimeout(() => {
            console.log('[FORMAT] UI state now - editedTranscript length:', editedTranscript?.length || 0);
          }, 0);
          
          // Section-specific finalizing message
          if (section === '8') {
            setFormattingProgress('Finalizing Section 8 formatting...');
          } else if (section === '7') {
            setFormattingProgress('Finalizing Section 7 formatting...');
          } else {
            setFormattingProgress('Finalizing formatting...');
          }
          await new Promise(resolve => setTimeout(resolve, 50)); // Allow React to render
          
          // Show any issues to the user
          if (result.issues && result.issues.length > 0) {
            console.warn('AI formatting issues:', result.issues);
            // TODO: Show issues in UI (could be a toast notification)
          }
          
          // Capture transcripts for analysis
          captureTranscriptsForAnalysis(rawTranscript, result.formatted, template.title);
          
          // Track template application
          if (template.id) {
            await trackTemplateApplication(template.id, {
              sectionId: effectiveSectionId || activeSection,
              modeId: mode,
            });
          }
          
          setIsFormatting(false);
          setFormattingProgress('');
          return;
        } catch (error) {
          console.error('Error applying AI formatting:', error);
          // Fallback: show error but don't break the flow
          alert(`AI formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsFormatting(false);
          setFormattingProgress('');
          return;
        }
      } else {
        console.warn('No transcript content to format with AI');
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
      
      // Determine the correct section for formatting
      let formatSection: "7" | "8" | "11" | "history_evolution" = "7";
      
      // Check if this is the History of Evolution template
      if (template.id === 'history-evolution-ai-formatter') {
        formatSection = 'history_evolution';
      } else {
        formatSection = (activeSection?.replace('section_', '') || '7') as "7" | "8" | "11";
      }
      
      
      // Apply AI formatting to template content
      const formattingOptions: FormattingOptions = {
        section: formatSection,
        inputLanguage: inputLanguage, // Use current input language
        outputLanguage: outputLanguage, // Use current output language
        complexity: template.complexity || 'medium',
        formattingLevel: 'advanced',
        includeSuggestions: true
      };
      
      setFormattingProgress('Applying AI formatting...');
      
      // For AI formatters, we need to provide actual content to format
      let contentToFormat = template.content;
      
      // If this is the History of Evolution template and content is just description, provide sample content
      if (template.id === 'history-evolution-ai-formatter' && template.content.length < 200) {
        contentToFormat = `Le patient a subi un accident le 15 octobre 2023. Il a consulté le docteur Martin, le 16 octobre 2023. Le docteur a diagnostiqué une entorse du genou droit. Il a prescrit de la physiothérapie et un arrêt de travail. Le patient revoit le docteur Martin, le 30 octobre 2023. La condition s'est améliorée.`;
      }
      
      const formattedResult = await FormattingService.formatTemplateContent(
        contentToFormat, 
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
          inputLanguage: inputLanguage, // Use current input language
          outputLanguage: outputLanguage // Use current output language
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
  }, [isEditing, editedTranscript, currentTranscript, inputLanguage, outputLanguage]);

  // Debug: Check recording state
  console.log('TranscriptionInterface: isRecording =', isRecording, 'dictationLanguage =', dictationLanguage);

  // Determine if we have final output to show
  const hasFinalOutput = editedTranscript || paragraphs.length > 0;
  
  return (
    <div className="space-y-6 pb-16">
      {/* Template Formatting Loader Overlay */}
      {formattingProgress && (
        <TemplateFormattingLoader message={formattingProgress} />
      )}
      
      {/* Dynamic Layout based on output state */}
      <div className={`grid grid-cols-1 gap-6 ${hasFinalOutput ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
        {/* Left Column - Dictation Controls Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Dictation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Language Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Input Language</label>
                <InputLanguageSelector
                  language={dictationLanguage}
                  onLanguageChange={handleInputLanguageChange}
                  disabled={isRecording}
                />
              </div>

              {/* Output Language Selector - Only show if feature is enabled */}
              {featureFlags.outputLanguageSelection && backendConfig?.enableOutputLanguageSelection && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Output Language</label>
                  <OutputLanguageSelector
                    language={outputLanguage}
                    onLanguageChange={handleOutputLanguageChange}
                    disabled={isRecording}
                    showWarning={!backendConfig.allowNonFrenchOutput}
                  />
                  {!backendConfig.allowNonFrenchOutput && outputLanguage === 'en' && (
                    <p className="text-xs text-yellow-600">
                      ⚠️ English output may not be CNESST compliant
                    </p>
                  )}
                </div>
              )}

              {/* Legacy message when output language selection is disabled */}
              {(!featureFlags.outputLanguageSelection || !backendConfig?.enableOutputLanguageSelection) && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Output will always be in French (CNESST compliant)
                  </p>
                </div>
              )}

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
                  currentLanguage={dictationLanguage}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={(template) => {
                    console.log('Template selected:', template);
                    console.log('Selected template ID:', template.id);
                    console.log('Selected template category:', template.category);
                    setSelectedTemplate(template);
                    setTemplateContent(template.content);
                    setAiStepStatus(null); // Reset AI step status when selecting new template
                    
                    // Inject template content into the transcript
                    injectTemplateContent(template);
                  }}
                />
                {/* AI Step Status Chip */}
                {aiStepStatus && (
                  <div className="flex items-center gap-2">
                    {aiStepStatus === 'skipped' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        AI cleanup skipped
                      </span>
                    )}
                    {aiStepStatus === 'success' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        AI cleanup applied
                      </span>
                    )}
                    {aiStepStatus === 'error' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        AI cleanup failed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mode Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mode</label>
                <ModeDropdown
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

        {/* Right Column - Live and Final Transcript Cards */}
        <div className={hasFinalOutput ? 'lg:col-span-3 space-y-6' : 'lg:col-span-2 space-y-6'}>
          {/* Live Transcription Card - Minimized when final output exists */}
          <Card className={`bg-white border border-gray-200 shadow-sm transition-all duration-300 ${hasFinalOutput ? 'max-h-32 overflow-hidden' : 'max-h-[50vh]'} `}>
            <CardHeader className={hasFinalOutput ? 'pb-2' : ''}>
              <CardTitle className={`text-gray-800 flex items-center space-x-2 ${hasFinalOutput ? 'text-sm' : 'text-lg font-semibold'}`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Live Transcription</span>
                {hasFinalOutput && (
                  <span className="text-xs text-gray-500 ml-2">(Minimized - Final output available)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={hasFinalOutput ? 'space-y-2 py-2' : 'space-y-4'}>
              {/* Duration and Audio Level Indicators */}
              {isRecording && (
                <div className={hasFinalOutput ? 'space-y-1' : 'space-y-3'}>
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
              <div className={`bg-gray-50 rounded-md p-4 ${hasFinalOutput ? 'min-h-[60px] max-h-[60px] overflow-hidden' : 'min-h-[150px] md:min-h-[200px] max-h-[40vh] overflow-auto'}`}>
                {currentTranscript ? (
                  <p className={`text-gray-700 leading-relaxed ${hasFinalOutput ? 'text-xs' : 'text-sm'}`}>
                    {hasFinalOutput ? (
                      <span className="truncate block">
                        {currentTranscript.length > 100 ? `${currentTranscript.substring(0, 100)}...` : currentTranscript}
                      </span>
                    ) : (
                      currentTranscript
                    )}
                  </p>
                ) : (
                  <p className={`text-gray-500 italic ${hasFinalOutput ? 'text-xs' : 'text-sm'}`}>
                    {hasFinalOutput ? 'Live transcription...' : 'Live transcription will appear here when you start dictating...'}
                  </p>
                )}
              </div>

              {/* Mode 3 Pipeline Display - Hidden when minimized */}
              {mode === 'ambient' && !hasFinalOutput && (
                <div className="mt-3">
                  {/* Progress indicators */}
                  <div className="text-sm opacity-70 mb-2">
                    {mode3Progress === 'transcribing' && 'Transcribing…'}
                    {mode3Progress === 'processing' && 'Cleaning & building narrative…'}
                    {mode3Progress === 'ready' && 'Ready'}
                  </div>

                  {/* Narrative output */}
                  {mode3Narrative && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Processed Narrative:</h4>
                      <pre className="whitespace-pre-wrap rounded-lg border p-3 bg-white/50 text-sm text-gray-800 font-mono">
                        {mode3Narrative}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final Transcript Card - Enhanced when output exists */}
          <Card className={`bg-white border shadow-sm transition-all duration-300 ${hasFinalOutput ? 'border-green-200 shadow-lg' : 'border-gray-200'} ${isFormatting ? 'blur-sm opacity-60' : ''}`}>
            <CardHeader className={hasFinalOutput ? 'bg-green-50 border-b border-green-200' : ''}>
              <CardTitle className={`text-gray-800 flex items-center justify-between ${hasFinalOutput ? 'text-xl font-bold' : 'text-lg font-semibold'}`}>
                <div className="flex items-center space-x-2">
                  <FileText className={`${hasFinalOutput ? 'h-6 w-6 text-green-600' : 'h-5 w-5'}`} />
                  <span>Final Transcript</span>
                  {hasFinalOutput && (
                    <span className="text-sm text-green-600 font-normal">(Ready for Review)</span>
                  )}
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
              {/* Action Buttons - Moved to top for better accessibility */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
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
                <SaveToSectionDropdown
                  onSave={handleSaveToSection}
                  isSaving={isSaving}
                  disabled={!editedTranscript && paragraphs.length === 0}
                />
              </div>
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

              {/* Final Transcript Text Area - Enhanced when output exists */}
              <div className={`bg-gray-50 rounded-md p-4 transition-all duration-300 ${hasFinalOutput ? 'min-h-[300px] md:min-h-[400px]' : 'min-h-[200px]'}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedTranscript}
                      onChange={(e) => setEditedTranscript(e.target.value)}
                      className={`w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasFinalOutput ? 'h-64 md:h-80' : 'h-40 md:h-48'}`}
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
                    <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${hasFinalOutput ? 'text-base' : 'text-sm'}`}>
                      {editedTranscript}
                    </p>
                  </div>
                ) : paragraphs.length > 0 ? (
                  <div className="space-y-3">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className={`text-gray-700 leading-relaxed ${hasFinalOutput ? 'text-base' : 'text-sm'}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className={`text-gray-500 italic ${hasFinalOutput ? 'text-base' : 'text-sm'}`}>
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

              {/* Copy Success Message */}
              {copySuccess && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Copied to clipboard
                  </span>
                </div>
              )}

              {/* Loading indicator removed - now using full-screen overlay */}

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
          currentLanguage={dictationLanguage}
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

      {/* Orthopedic Narrative Section - Only show for ambient mode */}
      {mode === 'ambient' && featureFlags.speakerLabeling && (
        <div className="mt-6">
          <OrthopedicNarrative narrative={orthopedicNarrative} />
        </div>
      )}

      {/* Full-Screen Template Formatting Loader */}
      {isFormatting && (
        <TemplateFormattingLoader 
          key={formattingProgress || 'loading'} // Force re-render when message changes
          message={formattingProgress || 'Applying template formatting'}
        />
      )}

      {/* Template Feedback Banner */}
      {showFeedbackBanner && pendingFeedback && selectedTemplate && (
        <TemplateFeedbackBanner
          templateId={pendingFeedback.templateId}
          templateName={selectedTemplate.title}
          onRating={async (rating) => {
            await submitFeedback(
              pendingFeedback.templateId,
              rating,
              {
                appliedAt: pendingFeedback.scheduledAt,
              }
            );
          }}
          onDismiss={async () => {
            await dismissFeedback(
              pendingFeedback.templateId,
              pendingFeedback.scheduledAt
            );
          }}
        />
      )}

      {/* Note: Feedback button is now global and accessible from anywhere in the app */}
    </div>
  );
};
