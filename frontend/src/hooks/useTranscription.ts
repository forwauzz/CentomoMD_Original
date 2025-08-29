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
  
  // Audio processing refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioChunkTimeRef = useRef<number>(0);
  const audioChunkBufferRef = useRef<number[]>([]);

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

  // Throttled audio chunk sending
  const sendAudioChunk = useCallback((audioData: number[]) => {
    const now = Date.now();
    const timeSinceLastChunk = now - lastAudioChunkTimeRef.current;
    
    // Only send audio chunks every 500ms to prevent overwhelming the connection
    if (timeSinceLastChunk >= 500) {
      // Combine buffered data with new data
      const combinedData = [...audioChunkBufferRef.current, ...audioData];
      audioChunkBufferRef.current = [];
      
      const message: WebSocketMessage = {
        type: 'audio_chunk',
        payload: {
          audioData: combinedData,
          timestamp: now,
          sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
          channelCount: DEFAULT_AUDIO_CONFIG.channelCount,
        },
        sessionId,
      };

      sendMessage(message);
      lastAudioChunkTimeRef.current = now;
    } else {
      // Buffer audio data for next send
      audioChunkBufferRef.current.push(...audioData);
    }
  }, [sendMessage, sessionId]);

  // Periodic flush of buffered audio data
  useEffect(() => {
    if (state.isRecording) {
      const flushInterval = setInterval(() => {
        if (audioChunkBufferRef.current.length > 0) {
          const now = Date.now();
          const message: WebSocketMessage = {
            type: 'audio_chunk',
            payload: {
              audioData: [...audioChunkBufferRef.current],
              timestamp: now,
              sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
              channelCount: DEFAULT_AUDIO_CONFIG.channelCount,
            },
            sessionId,
          };

          sendMessage(message);
          audioChunkBufferRef.current = [];
          lastAudioChunkTimeRef.current = now;
        }
      }, 1000); // Flush every second

      return () => clearInterval(flushInterval);
    }
  }, [state.isRecording, sendMessage, sessionId]);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting real audio recording...');
      
      // Reset audio chunk tracking
      lastAudioChunkTimeRef.current = 0;
      audioChunkBufferRef.current = [];
      
      // Request microphone access with specific audio constraints
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
      console.log('Microphone access granted');

      // Create audio context for processing
      const audioContext = new AudioContext({
        sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
      });
      audioContextRef.current = audioContext;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for real-time audio processing
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Process audio in real-time
      processor.onaudioprocess = (event) => {
        if (!state.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to PCM format
        const pcmData = convertToPCM(inputData);
        const audioChunk = createAudioChunk(pcmData);

        // Send audio chunk with throttling
        sendAudioChunk(Array.from(new Uint8Array(audioChunk)));
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

      console.log('Real audio recording started successfully');

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to start audio recording:', error);
      updateState({
        error: errorMessage,
        isRecording: false,
      });
      throw error;
    }
  }, [state.isRecording, sendMessage, sessionId, updateState, sendAudioChunk]);

  const stopRecording = useCallback(async () => {
    try {
      console.log('Stopping real audio recording...');

      // Flush any remaining buffered audio data
      if (audioChunkBufferRef.current.length > 0) {
        const now = Date.now();
        const message: WebSocketMessage = {
          type: 'audio_chunk',
          payload: {
            audioData: [...audioChunkBufferRef.current],
            timestamp: now,
            sampleRate: DEFAULT_AUDIO_CONFIG.sampleRate,
            channelCount: DEFAULT_AUDIO_CONFIG.channelCount,
          },
          sessionId,
        };

        sendMessage(message);
        audioChunkBufferRef.current = [];
      }

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

      // Clear any audio chunk intervals
      if (audioChunkIntervalRef.current) {
        clearInterval(audioChunkIntervalRef.current);
        audioChunkIntervalRef.current = null;
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

      console.log('Real audio recording stopped successfully');

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Failed to stop audio recording:', error);
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
