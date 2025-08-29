import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { TranscriptionState, Transcript, WebSocketMessage, AudioConfig } from '@/types';
import { convertToPCM, createAudioChunk, getErrorMessage } from '@/lib/utils';

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channelCount: 1,
  bitsPerSample: 16,
};

export const useTranscription = (sessionId?: string) => {
  const [state, setState] = useState<TranscriptionState>({
    isRecording: false,
    isConnected: false,
    currentTranscript: '',
    finalTranscripts: [],
    currentSection: 'section_7',
    mode: 'smart_dictation',
    sessionId,
    error: undefined,
    reconnectionAttempts: 0,
  });

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('Transcription hook received message:', message);
    
    switch (message.type) {
      case 'transcription_result':
        const transcript = message.data.transcript;
        console.log('Received transcript:', transcript);
        
        // Add to final transcripts
        const newTranscript: Transcript = {
          id: `transcript_${Date.now()}`,
          session_id: sessionId || '',
          section: state.currentSection,
          content: transcript,
          language: message.data.language_detected || 'fr-CA',
          is_final: true,
          confidence_score: message.data.confidence_score || 0.95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          finalTranscripts: [...prev.finalTranscripts, newTranscript],
        }));
        break;

      case 'transcription_started':
        console.log('Transcription started on server');
        break;

      case 'transcription_stopped':
        console.log('Transcription stopped on server');
        break;

      case 'connection_established':
        console.log('WebSocket connection established');
        break;

      case 'error':
        setState(prev => ({
          ...prev,
          error: message.payload?.message || 'Unknown error',
        }));
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [state.currentSection, sessionId]);

  const { isConnected, sendMessage, error: wsError, reconnect } = useWebSocket(handleWebSocketMessage);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update connection status
  useEffect(() => {
    setState(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      setState(prev => ({ ...prev, error: wsError }));
    }
  }, [wsError]);

  const updateState = useCallback((updates: Partial<TranscriptionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording...');
      
      // Start transcription on server
      const startMessage: WebSocketMessage = {
        type: 'start_transcription',
        payload: {
          sessionId,
          config: {
            identify_language: true,
            language_options: ['en-US', 'fr-CA'],
            preferred_language: 'fr-CA',
            media_sample_rate_hz: DEFAULT_AUDIO_CONFIG.sampleRate,
            media_encoding: 'pcm',
            show_speaker_labels: true,
            max_speaker_labels: 2,
          },
        },
        sessionId,
      };

      sendMessage(startMessage);

      // Update state
      updateState({
        isRecording: true,
        error: undefined,
        currentTranscript: '',
      });

      console.log('Recording started successfully');

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      updateState({
        error: errorMessage,
        isRecording: false,
      });
      throw error;
    }
  }, [sendMessage, sessionId, updateState]);

  const stopRecording = useCallback(async () => {
    try {
      console.log('Stopping recording...');

      // Stop transcription on server
      const stopMessage: WebSocketMessage = {
        type: 'stop_transcription',
        sessionId,
      };

      sendMessage(stopMessage);

      // Update state
      updateState({
        isRecording: false,
        currentTranscript: '',
      });

      console.log('Recording stopped successfully');

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      updateState({
        error: errorMessage,
        isRecording: false,
      });
      throw error;
    }
  }, [sendMessage, sessionId, updateState]);

  const sendVoiceCommand = useCallback((command: string) => {
    const message: WebSocketMessage = {
      type: 'voice_command',
      payload: {
        command,
        timestamp: Date.now(),
      },
      sessionId,
    };

    sendMessage(message);
  }, [sendMessage, sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isRecording) {
        stopRecording();
      }
    };
  }, [state.isRecording, stopRecording]);

  return {
    // State
    isRecording: state.isRecording,
    isConnected: state.isConnected,
    currentTranscript: state.currentTranscript,
    finalTranscripts: state.finalTranscripts,
    currentSection: state.currentSection,
    mode: state.mode,
    error: state.error,
    reconnectionAttempts: state.reconnectionAttempts,

    // Actions
    startRecording,
    stopRecording,
    sendVoiceCommand,
    updateState,
    reconnect,
  };
};
