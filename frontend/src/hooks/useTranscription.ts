import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionState, Transcript } from '@/types';

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

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback((updates: Partial<TranscriptionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Start transcription with direct WebSocket connection
  const startTranscription = useCallback(async (languageCode: 'fr-CA' | 'en-US') => {
    try {
      console.log('Starting transcription with language:', languageCode);
      
      const ws = new WebSocket('ws://localhost:3001/ws/transcription');
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected, sending start message');
        ws.send(JSON.stringify({ 
          type: 'start_transcription', 
          languageCode, 
          sampleRate: 16000,
          sessionId 
        }));
        updateState({ isConnected: true, error: undefined });
      };

      ws.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          console.log('Received message:', msg);
          
          if (msg.type === 'stream_ready') {
            console.log('Stream ready, starting audio capture');
            // Only start mic after backend is ready
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                channelCount: 1,
                noiseSuppression: false,
                echoCancellation: false,
                autoGainControl: false,
              },
            });
            streamRef.current = stream;
            
            const source = audioContext.createMediaStreamSource(stream);
            const proc = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = proc;
            
            source.connect(proc);
            proc.connect(audioContext.destination);

            let framesSent = 0;
            proc.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const ch = e.inputBuffer.getChannelData(0); // Float32 [-1..1]
              const pcm = new Int16Array(ch.length);      // 16-bit little-endian
              for (let i = 0; i < ch.length; i++) {
                const s = Math.max(-1, Math.min(1, ch[i]));
                pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              ws.send(pcm.buffer);                        // 🔑 send BINARY, not JSON
              if (++framesSent % 25 === 0) console.log('framesSent', framesSent);
            };
            
            updateState({ isRecording: true });
          } else if (msg.type === 'transcription_result') {
            const { text, isFinal } = msg;
            console.log('Transcription result:', { text, isFinal });
            
                         if (isFinal) {
               // Handle final results - add to final transcripts
               const newTranscript: Transcript = {
                 id: `transcript_${Date.now()}`,
                 session_id: sessionId || '',
                 section: state.currentSection,
                 content: text,
                 language: msg.language_detected || 'fr-CA',
                 is_final: true,
                 confidence_score: msg.confidence_score || 0.95,
                 created_at: new Date().toISOString(),
                 updated_at: new Date().toISOString(),
               };

               setState(prev => ({
                 ...prev,
                 finalTranscripts: [...prev.finalTranscripts, newTranscript],
                 currentTranscript: '', // Clear current transcript for next partial result
               }));
             } else {
               // Handle partial results - update current transcript
               setState(prev => ({
                 ...prev,
                 currentTranscript: text,
               }));
             }
          } else if (msg.type === 'transcription_error') {
            console.error('Transcribe error:', msg.error);
            updateState({ error: msg.error });
          } else if (msg.type === 'connection_established') {
            console.log('WebSocket connection established');
            updateState({ isConnected: true });
          }
        } catch (error) {
          // ignore non-JSON messages (binary data)
          console.log('Received non-JSON message (likely binary data)');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateState({ error: 'WebSocket connection error' });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        updateState({ isConnected: false, isRecording: false });
      };

      // expose ws for stop button
      (window as any).__tx_ws = ws;

    } catch (error) {
      console.error('Failed to start transcription:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start transcription',
        isRecording: false 
      });
    }
  }, [sessionId, state.currentSection, updateState]);

  const stopTranscription = useCallback(() => {
    console.log('Stopping transcription');
    
    const ws: WebSocket | undefined = (window as any).__tx_ws;
    try { 
      ws?.send(JSON.stringify({ type: 'stop_transcription' })); 
    } catch (error) {
      console.error('Error sending stop message:', error);
    }
    ws?.close();
    
    // Clean up audio resources
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    updateState({ isRecording: false });
  }, [updateState]);

  // Legacy compatibility - map to new functions
  const startRecording = useCallback(async () => {
    await startTranscription('fr-CA');
  }, [startTranscription]);

  const stopRecording = useCallback(() => {
    stopTranscription();
  }, [stopTranscription]);

  const sendVoiceCommand = useCallback((command: string) => {
    const ws: WebSocket | undefined = (window as any).__tx_ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'voice_command', 
        command,
        timestamp: Date.now(),
        sessionId 
      }));
    }
  }, [sessionId]);

  const reconnect = useCallback(() => {
    if (state.isRecording) {
      stopTranscription();
    }
    // Reconnection logic can be added here if needed
    updateState({ reconnectionAttempts: state.reconnectionAttempts + 1 });
  }, [state.isRecording, state.reconnectionAttempts, stopTranscription, updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isRecording) {
        stopTranscription();
      }
    };
  }, [state.isRecording, stopTranscription]);

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
