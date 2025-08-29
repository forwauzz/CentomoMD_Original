import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionState, Transcript } from '@/types';

// Enhanced segment tracking for partial results
type Segment = { 
  id: string; 
  text: string; 
  startTime?: number | null; 
  endTime?: number | null; 
  isFinal: boolean; 
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

  // Enhanced segment tracking
  const [segments, setSegments] = useState<Segment[]>([]);
  const segIndex = useRef<Map<string, number>>(new Map());

  // Debounced update system for smooth partial results
  const updateQueue = useRef<Segment[]>([]);
  const updateTimeout = useRef<number | undefined>(undefined);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback((updates: Partial<TranscriptionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Enhanced segment upsert with debouncing
  const upsertSegment = useCallback((s: Segment) => {
    setSegments(prev => {
      const next = [...prev];
      const i = segIndex.current.get(s.id);
      if (i == null) { 
        segIndex.current.set(s.id, next.length); 
        next.push(s); 
      } else { 
        next[i] = { ...next[i], ...s }; 
      }
      return next;
    });
  }, []);

  // Debounced update system to avoid flicker
  const enqueueUpdate = useCallback((s: Segment) => {
    updateQueue.current.push(s);
    if (updateTimeout.current) return;
    
    updateTimeout.current = window.setTimeout(() => {
      const batch = updateQueue.current; 
      updateQueue.current = [];
      batch.forEach(upsertSegment);
      updateTimeout.current = undefined;
    }, 80); // ~12 fps for smooth updates
  }, [upsertSegment]);

  // Build live partial transcript from non-final segments
  const liveTranscript = segments
    .filter(s => !s.isFinal)
    .map(s => s.text)
    .join(' ');

  // Build final paragraphs with heuristics
  const buildParagraphs = useCallback(() => {
    const PAUSE_MS = 1200;
    
    function shouldBreak(prev?: Segment, curr?: Segment) {
      if (!prev || !curr) return false;
      if (/[.?!]$/.test(prev.text.trim())) return true;                     // end punctuation
      if ((curr.startTime ?? 0) - (prev.endTime ?? 0) > PAUSE_MS) return true; // long pause
      return false;
    }

    const finals = segments.filter(s => s.isFinal);
    const paragraphs: string[] = [];
    let buf: string[] = [];
    
    for (let i = 0; i < finals.length; i++) {
      const prev = finals[i - 1];
      const curr = finals[i];
      if (i > 0 && shouldBreak(prev, curr)) { 
        paragraphs.push(buf.join(' ')); 
        buf = []; 
      }
      buf.push(curr.text.trim());
    }
    if (buf.length) paragraphs.push(buf.join(' '));
    
    return paragraphs;
  }, [segments]);

  // French typography polish
  const tidyFr = useCallback((s: string) => {
    const cap = s.charAt(0).toUpperCase() + s.slice(1);
    const fixed = cap.replace(/\s+([,.?!;:])/g, '$1'); // remove space before punctuation
    return /[.?!]$/.test(fixed) ? fixed : fixed + '.';
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
            console.log('Transcription result:', msg);
            
            // Enhanced segment tracking with stable IDs
            enqueueUpdate({
              id: msg.resultId || crypto.randomUUID(),
              text: msg.text,
              startTime: msg.startTime,
              endTime: msg.endTime,
              isFinal: !!msg.isFinal
            });

            // Update current transcript for live display
            setState(prev => ({
              ...prev,
              currentTranscript: liveTranscript
            }));

            if (msg.isFinal) {
              // Handle final results - add to final transcripts
              const paragraphs = buildParagraphs();
              const finalDisplay = paragraphs.map(tidyFr);
              
              // Create final transcript entry
              const newTranscript: Transcript = {
                id: `transcript_${Date.now()}`,
                session_id: sessionId || '',
                section: state.currentSection,
                content: finalDisplay.join('\n\n'),
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
  }, [sessionId, state.currentSection, updateState, enqueueUpdate, liveTranscript, buildParagraphs, tidyFr]);

  const stopTranscription = useCallback(() => {
    console.log('Stopping transcription');
    
    // Clear any pending updates
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = undefined;
    }
    
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
      // Clear any pending updates
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, [state.isRecording, stopTranscription]);

  return {
    // State
    isRecording: state.isRecording,
    isConnected: state.isConnected,
    currentTranscript: liveTranscript, // Use live transcript from segments
    finalTranscripts: state.finalTranscripts,
    currentSection: state.currentSection,
    mode: state.mode,
    error: state.error,
    reconnectionAttempts: state.reconnectionAttempts,
    
    // Enhanced segment data
    segments,
    paragraphs: buildParagraphs(),

    // Actions
    startRecording,
    stopRecording,
    sendVoiceCommand,
    updateState,
    reconnect,
  };
};
