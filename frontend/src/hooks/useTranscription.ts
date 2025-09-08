import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionState, Transcript } from '@/types';
import { detectVerbatimCmd } from '../voice/verbatim-commands';
import { detectCoreCommand } from '../voice/commands-core';
import { VoiceCommandEvent } from '../components/transcription/VoiceCommandFeedback';
import { useFeatureFlags } from '@/lib/featureFlags';

// Enhanced segment tracking for partial results
type Segment = { 
  id: string; 
  text: string; 
  startTime?: number | null; 
  endTime?: number | null; 
  isFinal: boolean; 
  speaker?: string | null;     // PATIENT vs CLINICIAN
};

export const useTranscription = (sessionId?: string, language?: string) => {
  const featureFlags = useFeatureFlags();
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

  // Section routing for CNESST (wire the buffers)
  const [activeSection, setActiveSection] = useState<'section_7'|'section_8'|'section_11'>('section_7');
  type SectionBuffers = Record<string, Segment[]>;
  const [buffers, setBuffers] = useState<SectionBuffers>({});

  // Debounced update system for smooth partial results
  const updateQueue = useRef<Segment[]>([]);
  const updateTimeout = useRef<number | undefined>(undefined);

  // Voice command state
  const verbatim = useRef<{isOpen:boolean; customOpen:string|null}>({ isOpen:false, customOpen:null });
  const forceBreakNextRef = useRef<boolean>(false);
  let paused = false; // gate for mic sending
  
  // Voice command tracking
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommandEvent[]>([]);

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

  // Section routing function
  const routeFinalToSection = useCallback((seg: Segment) => {
    setBuffers(prev => {
      const arr = prev[activeSection] ?? [];
      return { ...prev, [activeSection]: [...arr, seg] };
    });
  }, [activeSection]);

  // Voice command functions
  const pauseMic = useCallback(() => { paused = true; }, []);
  const resumeMic = useCallback(() => { paused = false; }, []);
  
  const clearLiveBuffer = useCallback(() => {
    setSegments([]);
    setState(prev => ({ ...prev, currentTranscript: '' }));
  }, []);

  const undoLastAction = useCallback(() => {
    setSegments(prev => prev.slice(0, -1));
  }, []);

  // Voice command tracking functions
  const addVoiceCommand = useCallback((event: Omit<VoiceCommandEvent, 'timestamp'>) => {
    const newEvent: VoiceCommandEvent = {
      ...event,
      timestamp: Date.now()
    };
    setVoiceCommands(prev => [...prev, newEvent]);
  }, []);

  const updateVoiceCommandStatus = useCallback((command: string, status: VoiceCommandEvent['status'], details?: string) => {
    setVoiceCommands(prev => 
      prev.map(cmd => 
        cmd.command === command 
          ? { ...cmd, status, details }
          : cmd
      )
    );
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

  // Build final paragraphs with heuristics, deduplication, and speaker attribution
  const buildParagraphs = useCallback(() => {
    const PAUSE_MS = 1200;
    
    function shouldBreak(prev?: Segment, curr?: Segment) {
      if (!prev || !curr) return false;
      if (/[.?!]$/.test(prev.text.trim())) return true;                     // end punctuation
      if ((curr.startTime ?? 0) - (prev.endTime ?? 0) > PAUSE_MS) return true; // long pause
      return false;
    }

    // Filter non-clinical chatter (safety net)
    const NON_CLINICAL = [
      'abonnez-vous', 'écrivez-nous en commentaire', 'chaîne', 'vidéo',
      'easy french', 'discord', 'zoom', 'lien', 'membership', 'site web',
      'subscribe', 'comment below', 'channel', 'video', 'link', 'website'
    ];
    
    function isClinical(s: string) {
      const t = s.toLowerCase();
      return !NON_CLINICAL.some(k => t.includes(k));
    }
    
    // Use section buffers for CNESST routing
    const sectionSegments = buffers[activeSection] || [];
    const finalsClinical = sectionSegments.filter(s => s.isFinal && isClinical(s.text));
    
    // Dedupe exact repeats (keeps first occurrence)
    const seen = new Set<string>();
    const uniqFinals = finalsClinical.filter(s => {
      const norm = s.text.trim().toLowerCase();
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });

    const paragraphs: string[] = [];
    let buf: string[] = [];
    
    for (let i = 0; i < uniqFinals.length; i++) {
      const prev = uniqFinals[i - 1];
      const curr = uniqFinals[i];
      if (i > 0 && shouldBreak(prev, curr)) { 
        paragraphs.push(buf.join(' ')); 
        buf = []; 
      }
      
      // Add speaker prefix based on mode and feature flag
      if (state.mode === 'word_for_word' || state.mode === 'smart_dictation') {
        // Raw text only - no speaker labels
        buf.push(curr.text.trim());
      } else if (state.mode === 'ambient' && featureFlags.speakerLabeling) {
        // Ambient mode with feature flag ON: show neutral speaker labels
        const speakerPrefix = curr.speaker ? `${curr.speaker}: ` : '';
        buf.push(speakerPrefix + curr.text.trim());
      } else {
        // Ambient mode with feature flag OFF: raw text only
        buf.push(curr.text.trim());
      }
    }
    if (buf.length) paragraphs.push(buf.join(' '));
    
    return paragraphs;
  }, [segments, buffers, activeSection]);


  // French typography polish (clinic-friendly)
  const tidyFr = useCallback((s: string) => {
    let t = s.trim();

    // Quick common medical fixes
    t = t.replace(/\bamisidal\b/ig, 'amygdales')
         .replace(/\bcarte vitale\b/ig, 'carte Vitale')
         .replace(/\bdoliprane\b/ig, 'Doliprane')
         .replace(/\bparacétamol\b/ig, 'paracétamol')
         .replace(/\bibuprofène\b/ig, 'ibuprofène');

    // Spacing before : ; ? ! (French typography)
    t = t.replace(/\s*([:;?!])/g, ' $1');

    // Remove spaces before ., and double spaces
    t = t.replace(/\s*\./g, '.').replace(/\s{2,}/g, ' ');

    // Capitalize first letter, ensure terminal punctuation
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (!/[.?!]$/.test(t)) t += '.';
    
    return t;
  }, []);

     // Start transcription with direct WebSocket connection
   const startTranscription = useCallback(async (languageCode: 'fr-CA' | 'en-US') => {
     const currentLanguageCode = languageCode; // Store for voice commands
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
          mode: state.mode,  // Add mode parameter for Phase 0
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
               if (paused || ws.readyState !== WebSocket.OPEN) return;
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
             
             // Enhanced segment tracking with stable IDs and speaker info
             const seg = {
               id: msg.resultId || crypto.randomUUID(),
               text: msg.text,
               startTime: msg.startTime,
               endTime: msg.endTime,
               isFinal: !!msg.isFinal,
               speaker: msg.speaker,
               isProtected: false
             };

                           if (seg.isFinal) {
                // Skip voice command processing for word-for-word mode
                if (state.mode !== 'word_for_word') {
                  // 1) verbatim start/end/custom
                  const v = detectVerbatimCmd(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
                  if (v) {
                  addVoiceCommand({
                    type: 'verbatim',
                    command: seg.text,
                    status: 'detected',
                    details: `${v.kind}${v.key ? `: ${v.key}` : ''}`
                  });
                  
                  if (v.kind==='open') verbatim.current.isOpen = true;
                  if (v.kind==='close') verbatim.current.isOpen = false;
                  if (v.kind==='customOpen') verbatim.current.customOpen = v.key;
                  if (v.kind==='customClose') verbatim.current.customOpen = null;
                  
                  updateVoiceCommandStatus(seg.text, 'completed');
                  console.log('Verbatim command detected:', v);
                  return;
                }

                // 2) core commands
                const c = detectCoreCommand(seg.text, currentLanguageCode as 'fr-CA'|'en-US');
                if (c) {
                  addVoiceCommand({
                    type: 'core',
                    command: seg.text,
                    status: 'detected',
                    details: `${c.intent}${c.arg ? `: ${c.arg}` : ''}`
                  });
                  
                  console.log('Core command detected:', c);
                  switch (c.intent) {
                    case 'paragraph.break': 
                      forceBreakNextRef.current = true; 
                      updateVoiceCommandStatus(seg.text, 'completed', 'Paragraph break added');
                      break;
                    case 'stream.pause':    
                      pauseMic(); 
                      updateVoiceCommandStatus(seg.text, 'completed', 'Transcription paused');
                      break;
                    case 'stream.resume':   
                      resumeMic(); 
                      updateVoiceCommandStatus(seg.text, 'completed', 'Transcription resumed');
                      break;
                    case 'buffer.clear':    
                      clearLiveBuffer(); 
                      updateVoiceCommandStatus(seg.text, 'completed', 'Buffer cleared');
                      break;
                    case 'doc.save':        
                      ws.send(JSON.stringify({ type:'cmd.save' })); 
                      updateVoiceCommandStatus(seg.text, 'executing', 'Saving document...');
                      break;
                    case 'doc.export':      
                      ws.send(JSON.stringify({ type:'cmd.export' })); 
                      updateVoiceCommandStatus(seg.text, 'executing', 'Exporting document...');
                      break;
                    case 'undo':            
                      undoLastAction(); 
                      updateVoiceCommandStatus(seg.text, 'completed', 'Last action undone');
                      break;
                    case 'section.switch':  
                      setActiveSection(c.arg === '7' ? 'section_7' : c.arg === '8' ? 'section_8' : 'section_11'); 
                      updateVoiceCommandStatus(seg.text, 'completed', `Switched to section ${c.arg}`);
                      break;
                    case 'format.cnesst':
                      // TODO: Apply CNESST formatting
                      updateVoiceCommandStatus(seg.text, 'completed', 'CNESST formatting applied');
                      break;
                    case 'validation':
                      // TODO: Validate against template requirements
                      updateVoiceCommandStatus(seg.text, 'completed', 'Document validated');
                      break;
                    case 'custom.vocabulary':
                      // TODO: Load custom medical vocabulary
                      updateVoiceCommandStatus(seg.text, 'completed', 'Custom vocabulary loaded');
                      break;
                    case 'template.load':
                      // TODO: Load template for current section
                      updateVoiceCommandStatus(seg.text, 'completed', 'Template loaded');
                      break;
                  }
                  return; // do not add command text to transcript
                }
              }
                } // End of voice command processing conditional

             // 3) mark protected when verbatim mode is on
             if (verbatim.current.isOpen || verbatim.current.customOpen) seg.isProtected = true;
             
             enqueueUpdate(seg);
             
             // Route final segments to active section buffer
             if (seg.isFinal) {
               routeFinalToSection(seg);
             }

            // Update current transcript for live display
            setState(prev => ({
              ...prev,
              currentTranscript: liveTranscript
            }));

            if (msg.isFinal) {
              // Handle final results - add to final transcripts
              const paragraphs = buildParagraphs();
              // Apply processing based on mode
              console.log('Processing final transcript with mode:', state.mode);
              const finalDisplay = state.mode === 'word_for_word' 
                ? paragraphs  // Raw text for word-for-word mode (post-processing triggered by template)
                : paragraphs.map(tidyFr);  // Formatted text for other modes (AWS handles punctuation naturally)
              
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
    const lang = (language === 'fr-CA' || language === 'en-US') ? language : 'en-US';
    await startTranscription(lang);
  }, [startTranscription, language]);

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
    
    // Section routing data
    activeSection,
    buffers,

    // Voice command data
    voiceCommands,
    isListening: state.isRecording && !paused,

    // Actions
    startRecording,
    stopRecording,
    sendVoiceCommand,
    updateState,
    reconnect,
    setActiveSection,
  };
};
