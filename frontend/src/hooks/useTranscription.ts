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

  const { isConnected, sendMessage, error: wsError, reconnect } = useWebSocket();
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
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
          channelCount: DEFAULT_AUDIO_CONFIG.channelCount,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context for processing
      const audioContext = new AudioContext({
        sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
      });
      audioContextRef.current = audioContext;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for audio processing
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!state.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to PCM
        const pcmData = convertToPCM(inputData);
        const audioChunk = createAudioChunk(pcmData);

        // Send audio chunk via WebSocket
        const message: WebSocketMessage = {
          type: 'audio_chunk',
          payload: {
            audioData: Array.from(new Uint8Array(audioChunk)),
            timestamp: Date.now(),
          },
          sessionId,
        };

        sendMessage(message);
      };

      // Connect the audio nodes
      source.connect(processor);
      processor.connect(audioContext.destination);

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

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      updateState({
        error: errorMessage,
        isRecording: false,
      });
      throw error;
    }
  }, [state.isRecording, sendMessage, sessionId, updateState]);

  const stopRecording = useCallback(async () => {
    try {
      // Stop audio processing
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

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

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'transcription_result':
        if (message.payload.type === 'partial') {
          updateState({
            currentTranscript: message.payload.transcript,
          });
        } else if (message.payload.type === 'final') {
          const newTranscript: Transcript = {
            id: `transcript_${Date.now()}`,
            session_id: sessionId || '',
            section: state.currentSection,
            content: message.payload.transcript,
            language: message.payload.language || 'fr',
            is_final: true,
            confidence_score: message.payload.confidence,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          updateState({
            currentTranscript: '',
            finalTranscripts: [...state.finalTranscripts, newTranscript],
          });
        }
        break;

      case 'voice_command_detected':
        // Handle voice command detection
        console.log('Voice command detected:', message.payload);
        break;

      case 'error':
        updateState({
          error: message.payload.message,
        });
        break;

      case 'reconnection_attempt':
        updateState({
          reconnectionAttempts: message.payload.attempt,
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [state.currentSection, state.finalTranscripts, sessionId, updateState]);

  // Set up WebSocket message handler
  useEffect(() => {
    // This would be set up in the useWebSocket hook
    // For now, we'll handle it here
  }, [handleWebSocketMessage]);

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
