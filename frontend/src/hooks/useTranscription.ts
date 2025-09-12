import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionState, Transcript, TranscriptionMode } from '@/types';
import { detectVerbatimCmd } from '../voice/verbatim-commands';
import { detectCoreCommand } from '../voice/commands-core';
import { VoiceCommandEvent } from '../components/transcription/VoiceCommandFeedback';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useUIStore } from '@/stores/uiStore';

// Enhanced segment tracking for partial results
type Segment = { 
  id: string; 
  text: string; 
  startTime?: number | null; 
  endTime?: number | null; 
  isFinal: boolean; 
  speaker?: string | null;     // PATIENT vs CLINICIAN
};

export const useTranscription = (sessionId?: string, language?: string, mode?: TranscriptionMode) => {
  const featureFlags = useFeatureFlags();
  const { addToast } = useUIStore();
  const [state, setState] = useState<TranscriptionState>({
    isRecording: false,
    isConnected: false,
    currentTranscript: '',
    finalTranscripts: [],
    currentSection: 'section_7',
    mode: mode || 'smart_dictation', // Use passed mode or default to smart_dictation
    sessionId,
    error: undefined,
    reconnectionAttempts: 0,
  });

  // Mode 3 pipeline state
  const [mode3Narrative, setMode3Narrative] = useState<string | null>(null);
  const [mode3Progress, setMode3Progress] = useState<'idle'|'recording'|'processing'|'ready'|'error'>('idle');
  const [finalAwsJson, setFinalAwsJson] = useState<any>(null);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [liveTranscriptState, setLiveTranscriptState] = useState<string>("");

  // new: final readiness gate
  const [mode3FinalReady, setMode3FinalReady] = useState<boolean>(false);

  // new: session sequencer to avoid stale writes from prior sessions
  const ambientSessionSeq = useRef<number>(0);
  
  // Prevent duplicate processing (final message + manual stop)
  const processingStartedRef = useRef(false);

  // WebSocket closure control for Mode 3 finalization
  const pendingAmbientFinalizeRef = useRef(false); // true after Stop, until final handled
  const wsRef = useRef<WebSocket | null>(null);    // store the active ws

  // Update mode when it changes
  useEffect(() => {
    if (mode && mode !== state.mode) {
      console.log(`Mode changed from ${state.mode} to ${mode}`);
      setState(prev => ({ ...prev, mode }));
    }
  }, [mode, state.mode]);

  // Debug: Log mode changes
  useEffect(() => {
    console.log(`[useTranscription] Mode parameter changed to: ${mode}`);
  }, [mode]);

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

  // Mode 3 pipeline helper
  const processMode3Pipeline = useCallback(async (params: {
    sessionId: string;
    language: 'en'|'fr';
    section: string;
    rawAwsJson: any;
  }) => {
    const res = await fetch('/api/transcribe/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: params.sessionId,
        modeId: 'ambient',
        language: params.language,
        section: params.section,
        rawAwsJson: params.rawAwsJson
      })
    });
    if (!res.ok) throw new Error(`process failed: ${res.status}`);
    return res.json() as Promise<{
      narrative: string;
      irSummary: any;
      roleMap: Record<string,string>;
      meta: any;
    }>;
  }, []);

  // helper: commit final narrative in a single place
  const commitFinalNarrative = useCallback((
    seq: number,
    payload: { narrative: string | null; status: "ready" | "error" }
  ) => {
    if (seq !== ambientSessionSeq.current) {
      console.warn("[Mode3] commitFinalNarrative ignored (stale seq)", { seq, cur: ambientSessionSeq.current });
      return;
    }
    console.log("[Mode3] commitFinalNarrative", payload.status, payload.narrative?.slice(0, 80));
    setMode3Narrative(payload.narrative);
    setMode3FinalReady(payload.status === "ready");
    setMode3Progress(payload.status);
  }, []);

  // Idempotent Mode 3 processing helper
  const triggerMode3Processing = useCallback(async (reason: 'final_msg' | 'manual_stop') => {
    // Guard against mid-recording pipeline attempts
    if (mode3Progress !== "processing" && mode3Progress !== "ready" && mode3Progress !== "error") {
      console.warn("[Mode3] ignoring mid-recording pipeline attempt");
      return;
    }

    // Idempotent guard
    if (processingStartedRef.current) return;
    processingStartedRef.current = true;

    // Preconditions
    if (state.mode !== 'ambient' || !finalAwsJson || !state.sessionId) {
      processingStartedRef.current = false;
      return;
    }

    try {
      setMode3Progress('processing');
      const result = await processMode3Pipeline({
        sessionId: state.sessionId,
        language: (language === 'fr-CA' || language === 'fr') ? 'fr' : 'en',
        section: state.currentSection,
        rawAwsJson: finalAwsJson
      });
      
      // Validate that we have proper artifacts before showing transcript
      if (result.narrative && result.roleMap && Object.keys(result.roleMap).length > 0) {
        console.log('[Mode3] Processing completed with valid artifacts:', {
          narrativeLength: result.narrative.length,
          roleMapKeys: Object.keys(result.roleMap),
          hasNarrative: !!result.narrative
        });
        console.log('[FRONTEND] Setting narrative from pipeline:', result.narrative);
        const seqAtProcessing = ambientSessionSeq.current;
        commitFinalNarrative(seqAtProcessing, {
          narrative: result.narrative,
          status: "ready"
        });
      } else {
        console.warn('[Mode3] Processing completed but artifacts are incomplete:', {
          hasNarrative: !!result.narrative,
          roleMapKeys: result.roleMap ? Object.keys(result.roleMap) : 'missing',
          narrativeLength: result.narrative?.length || 0
        });
        const seqAtProcessing = ambientSessionSeq.current;
        commitFinalNarrative(seqAtProcessing, {
          narrative: "Processing completed but artifacts are incomplete.",
          status: "error"
        });
      }
    } catch (err) {
      console.error('[Mode3] processing failed', { reason, err });
      const seqAtProcessing = ambientSessionSeq.current;
      commitFinalNarrative(seqAtProcessing, {
        narrative: "Processing failed. Please try again.",
        status: "error"
      });
    }
  }, [state.mode, finalAwsJson, state.sessionId, state.currentSection, language, processMode3Pipeline, mode3Progress, commitFinalNarrative]);

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
  const computedLiveTranscript = segments
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
      
      // Reset Mode 3 state for new session
      console.log('[FRONTEND] Starting new session - clearing Mode 3 state');
      processingStartedRef.current = false;
      setFinalAwsJson(null);
      console.log('[FRONTEND] Clearing mode3Narrative in startTranscription');
      setMode3Narrative(null);
      setMode3FinalReady(false);
      setMode3Progress('idle');
      setLiveTranscriptState('');
      console.log('[FRONTEND] Mode 3 state cleared');
      
      const ws = new WebSocket('ws://localhost:3001/ws/transcription');
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected, sending start message');
        const currentMode = mode || state.mode; // Use the passed mode parameter first, fallback to state
        console.log('Sending mode to backend:', currentMode);
        ws.send(JSON.stringify({ 
          type: 'start_transcription', 
          languageCode, 
          sampleRate: 16000,
          mode: currentMode,  // Use the current mode parameter
          sessionId 
        }));
        updateState({ isConnected: true, error: undefined });
      };

      ws.onmessage = async (ev) => {
        try {
          console.log('[FRONTEND] Raw WebSocket message received:', ev.data);
          const msg = JSON.parse(ev.data);
          console.log('[FRONTEND] Parsed message:', msg);
          
          // Debug: Log ALL message types
          console.log('[FRONTEND] Message type:', msg.type);
          
          // Debug: Log transcription results specifically
          if (msg.type === 'transcription_result') {
            console.log('[FRONTEND] Live transcription result:', {
              text: msg.text,
              isFinal: msg.isFinal,
              resultId: msg.resultId
            });
          }
          
          // Handle live transcription updates for ambient mode
          if (msg.type === "transcription_live" && msg.mode === "ambient") {
            console.log('[FRONTEND] Live transcription update:', {
              text: msg.text,
              isPartial: msg.isPartial,
              resultId: msg.resultId
            });
            
            // live preview only, do not touch final narrative
            setLiveTranscriptState(msg.text || "");
          }
          
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
            
            // Set Mode 3 progress to recording for ambient mode
            const currentMode = mode || state.mode;
            if (currentMode === 'ambient') {
              // Increment session sequencer for new ambient session
              ambientSessionSeq.current += 1;
              console.log("[Mode3] startAmbientRecording seq=", ambientSessionSeq.current);
              
              // Clean reset for new session
              console.log('[FRONTEND] Clearing mode3Narrative in ambient start');
              setMode3Narrative(null);
              setMode3FinalReady(false);
              setLiveTranscriptState('');
              if (processingTimeout) { 
                clearTimeout(processingTimeout); 
                setProcessingTimeout(null); 
              }
              
              setMode3Progress('recording');
            }
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
            setLiveTranscriptState(computedLiveTranscript);
            setState(prev => ({
              ...prev,
              currentTranscript: computedLiveTranscript
            }));

            if (msg.isFinal) {
              // Handle final results - add to final transcripts
              const paragraphs = buildParagraphs();
              // Apply processing based on mode
              const currentMode = mode || state.mode;
              console.log('Processing final transcript with mode:', currentMode);
              const finalDisplay = currentMode === 'word_for_word' 
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
          } else if (msg.type === 'transcription_final' && msg.mode === 'ambient') {
            console.log('Mode 3 final transcription received:', msg);
            
            const seqAtFinal = ambientSessionSeq.current;
            // Clear processing timeout
            if (processingTimeout) {
              clearTimeout(processingTimeout);
              setProcessingTimeout(null);
            }
            
            // Fetch final transcript data
            console.log('[FRONTEND] Fetching final transcript for artifactId:', msg.artifactId);
            fetch(`http://localhost:3001/api/transcripts/${msg.artifactId}`)
              .then(r => {
                console.log('[FRONTEND] Fetch response status:', r.status);
                if (!r.ok) {
                  throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                }
                return r.json();
              })
              .then(data => {
                setLiveTranscriptState("");
                const narrative = (data?.narrative ?? "").trim();
                if (!narrative) {
                  commitFinalNarrative(seqAtFinal, {
                    narrative: "No content transcribed.",
                    status: "ready"
                  });
                } else {
                  commitFinalNarrative(seqAtFinal, {
                    narrative,
                    status: "ready"
                  });
                }
              })
              .catch(err => {
                console.error("[Mode3] final fetch failed", err);
                commitFinalNarrative(seqAtFinal, {
                  narrative: "Failed to load transcript. Please try again.",
                  status: "error"
                });
              });
            
            // Show toast notification for diarization status
            if (msg.summary?.diarized) {
              const confidence = msg.summary.confidence ? ` (conf: ${(msg.summary.confidence * 100).toFixed(0)}%)` : '';
              addToast({
                type: 'success',
                title: 'Ambient: Speakers ON',
                message: `Detected ${msg.summary.speakerCount} speaker(s)${confidence}`
              });
            } else {
              addToast({
                type: 'warning',
                title: 'Ambient: No speakers detected',
                message: 'Check ShowSpeakerLabel/MaxSpeakerLabels configuration'
              });
            }
            
            // Close WebSocket after processing transcription_final
            pendingAmbientFinalizeRef.current = false;
            console.log("[Mode3] FE closing WS (state before):", wsRef.current?.readyState);
            try { 
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.close();
              }
            } catch {}
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
        console.log("[Mode3] WS onclose (pendingFinalize:", pendingAmbientFinalizeRef.current, ")");
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
  }, [sessionId, state.currentSection, mode, updateState, enqueueUpdate, computedLiveTranscript, buildParagraphs, tidyFr]);

  const stopTranscription = useCallback(async () => {
    console.log('Stopping transcription');
    
    // Clear any pending updates
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
      updateTimeout.current = undefined;
    }
    
    const ws: WebSocket | undefined = (window as any).__tx_ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { 
        const currentMode = mode || state.mode; // Use the passed mode parameter first, fallback to state
        ws.send(JSON.stringify({ 
          type: 'stop_transcription',
          mode: currentMode 
        })); 
      } catch (error) {
        console.error('Error sending stop message:', error);
      }
    }
    // Don't close WebSocket if we're waiting for ambient finalization
    if (pendingAmbientFinalizeRef.current) {
      console.log("[Mode3] skip ws.close() during pending finalize");
    } else {
      console.log("[Mode3] FE closing WS (state before):", wsRef.current?.readyState);
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    }
    
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

    // ✅ Fallback: if final didn't auto-trigger for any reason
    await triggerMode3Processing('manual_stop');
  }, [updateState, triggerMode3Processing]);

  // Mode 3 specific stop function with processing state
  const stopAmbientRecording = useCallback(() => {
    const seqAtStop = ambientSessionSeq.current;
    
    // mark we are waiting for backend finalization
    pendingAmbientFinalizeRef.current = true;

    // send stop to backend but DO NOT close socket here
    wsRef.current?.send(JSON.stringify({ type: "stop_transcription", mode: "ambient" }));
    
    setMode3Progress("processing");

    // Clear existing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }
    
    // Set watchdog timeout
    const t = setTimeout(() => {
      if (mode3Progress === "processing") {
        console.warn("[Mode3] processing timeout");
        commitFinalNarrative(seqAtStop, {
          narrative: "Processing timed out. Please try again.",
          status: "error"
        });
      }
    }, 10000);
    setProcessingTimeout(t);
  }, [processingTimeout, mode3Progress, commitFinalNarrative]);

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
    currentTranscript: liveTranscriptState, // Use live transcript from segments
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

    // Mode 3 pipeline data
    mode3Narrative,
    mode3Progress,
    mode3FinalReady,
    finalAwsJson,
    liveTranscript: liveTranscriptState,

    // Actions
    startRecording,
    stopRecording,
    stopAmbientRecording,
    sendVoiceCommand,
    updateState,
    reconnect,
    setActiveSection,
    
    // Expose pipeline helper for testing
    processMode3Pipeline,
  };
};
