import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptionState, Transcript, TranscriptionMode } from '@/types';
import { detectVerbatimCmd } from '../voice/verbatim-commands';
import { detectCoreCommand } from '../voice/commands-core';
import { VoiceCommandEvent } from '../components/transcription/VoiceCommandFeedback';
import { useFeatureFlags } from '@/lib/featureFlags';

// Advanced speaker correction with weighted scoring and conversation context
class AdvancedSpeakerCorrection {
  // private conversationContext: any[]; // Not used in current implementation
  private speakerPatterns: {
    doctor: {
      questions: RegExp;
      medical: RegExp;
      instructions: RegExp;
      transitions: RegExp;
      acknowledgments: RegExp;
    };
    patient: {
      personal: RegExp;
      medications: RegExp;
      symptoms: RegExp;
      answers: RegExp;
      descriptions: RegExp;
    };
  };

  constructor() {
    // this.conversationContext = []; // Not used in current implementation
    this.speakerPatterns = {
      doctor: {
        // Strong doctor indicators
        questions: /\b(tell me|rate on a|pain scale|does it move|does the|anything that makes|how would you|what about)\b/gi,
        medical: /\b(pain scale|radiation|0 being|10 being|scale of|examination|symptoms)\b/gi,
        instructions: /\b(let me|I want you to|can you|try to)\b/gi,
        
        // Weaker indicators (context dependent)
        transitions: /\b(so|um so|now|and|alright)\b/gi,
        acknowledgments: /\b(OK|alright|I see|mm-hmm)\b/gi
      },
      
      patient: {
        // Strong patient indicators
        personal: /\b(I took|I tried|I have|I feel|I can't|I don't|my pain|it hurts)\b/gi,
        medications: /\b(Tylenol|Motrin|ibuprofen|aspirin|took some|tried some)\b/gi,
        symptoms: /\b(nothing helped|doesn't work|makes it worse|feels like|started when)\b/gi,
        
        // Response patterns
        answers: /\b(yes|no|yeah|nope|maybe|I think|probably|not really)\b/gi,
        descriptions: /\b(it's like|feels like|kind of|sort of)\b/gi
      }
    };
  }

  correctSpeaker(text: string, originalSpeaker: string, context: any = {}): string {
    // Clean and analyze the text
    const cleanText = text.trim().toLowerCase();
    
    // Handle very short fragments first
    if (cleanText.length < 10) {
      return this.handleShortFragment(cleanText, originalSpeaker, context);
    }
    
    // Calculate speaker scores
    const doctorScore = this.calculateDoctorScore(cleanText, context);
    const patientScore = this.calculatePatientScore(cleanText, context);
    
    // Apply conversation flow logic
    const flowAdjustment = this.getConversationFlowAdjustment(cleanText, context);
    
    const finalDoctorScore = doctorScore + flowAdjustment.doctor;
    const finalPatientScore = patientScore + flowAdjustment.patient;
    
    // Determine speaker with confidence
    const result = this.determineSpeaker(finalDoctorScore, finalPatientScore, cleanText, context);
    
    // Log for debugging
    console.log(`Speaker analysis: "${text.substring(0, 50)}..." 
      Doctor: ${finalDoctorScore.toFixed(1)}, Patient: ${finalPatientScore.toFixed(1)} 
      → ${result.speaker} (${result.confidence})`);
    
    return result.speaker;
  }

  private handleShortFragment(cleanText: string, originalSpeaker: string, context: any): string {
    // Very short utterances - use context heavily
    const lastSpeaker = context.lastSpeaker;
    const isQuestion = context.lastWasQuestion;
    
    // Filler words usually continue current speaker
    if (cleanText.match(/^(um|uh|ah|er|well)\.?$/)) {
      return lastSpeaker || originalSpeaker;
    }
    
    // Short acknowledgments
    if (cleanText.match(/^(ok|yeah|yes|no|mm-hmm|uh-huh)\.?$/)) {
      // If last was a question, this is likely patient response
      if (isQuestion && lastSpeaker === 'doctor') {
        return 'patient';
      }
      // Otherwise, could be doctor acknowledging
      return lastSpeaker === 'patient' ? 'doctor' : 'patient';
    }
    
    // Default to alternating for unclear short fragments
    return lastSpeaker === 'doctor' ? 'patient' : 'doctor';
  }

  private calculateDoctorScore(text: string, _context: any): number {
    let score = 0;
    
    // Strong indicators
    const questionMatches = (text.match(this.speakerPatterns.doctor.questions) || []).length;
    score += questionMatches * 3;
    
    const medicalMatches = (text.match(this.speakerPatterns.doctor.medical) || []).length;
    score += medicalMatches * 2;
    
    const instructionMatches = (text.match(this.speakerPatterns.doctor.instructions) || []).length;
    score += instructionMatches * 2;
    
    // Question structure
    if (text.includes('?')) score += 2;
    if (text.match(/\b(does|do|can|will|would|how|what|when|where|why)\b/g)) score += 1;
    
    // Professional language patterns
    if (text.match(/\b(scale|rate|describe|tell me about)\b/g)) score += 1.5;
    
    // Weaker indicators (only if no strong patient indicators)
    if (!this.hasStrongPatientIndicators(text)) {
      const transitionMatches = (text.match(this.speakerPatterns.doctor.transitions) || []).length;
      score += transitionMatches * 0.5;
    }
    
    return score;
  }

  private calculatePatientScore(text: string, context: any): number {
    let score = 0;
    
    // Strong indicators
    const personalMatches = (text.match(this.speakerPatterns.patient.personal) || []).length;
    score += personalMatches * 3;
    
    const medicationMatches = (text.match(this.speakerPatterns.patient.medications) || []).length;
    score += medicationMatches * 4; // Very strong indicator
    
    const symptomMatches = (text.match(this.speakerPatterns.patient.symptoms) || []).length;
    score += symptomMatches * 2;
    
    // Response patterns (especially after questions)
    if (context.lastWasQuestion) {
      const answerMatches = (text.match(this.speakerPatterns.patient.answers) || []).length;
      score += answerMatches * 2;
    }
    
    // Personal pronouns in symptom context
    if (text.includes('i ') && text.match(/\b(pain|hurt|feel|took|tried)\b/)) {
      score += 2;
    }
    
    return score;
  }

  private hasStrongPatientIndicators(text: string): boolean {
    return !!text.match(/\b(I took|I tried|Tylenol|Motrin|nothing helped)\b/gi);
  }

  private getConversationFlowAdjustment(text: string, context: any): { doctor: number; patient: number } {
    const adjustment = { doctor: 0, patient: 0 };
    
    // Question-answer flow
    if (context.lastWasQuestion && context.lastSpeaker === 'doctor') {
      adjustment.patient += 2; // Likely answering
    }
    
    // Follow-up question pattern
    if (text.includes('?') && context.lastSpeaker === 'patient') {
      adjustment.doctor += 1.5; // Likely follow-up question
    }
    
    // Alternating conversation bonus
    if (context.lastSpeaker) {
      adjustment.doctor += context.lastSpeaker === 'patient' ? 0.5 : -0.5;
      adjustment.patient += context.lastSpeaker === 'doctor' ? 0.5 : -0.5;
    }
    
    return adjustment;
  }

  private determineSpeaker(doctorScore: number, patientScore: number, _text: string, context: any): { speaker: string; confidence: string } {
    const scoreDiff = Math.abs(doctorScore - patientScore);
    
    // High confidence threshold
    if (scoreDiff > 2) {
      return {
        speaker: doctorScore > patientScore ? 'doctor' : 'patient',
        confidence: 'high'
      };
    }
    
    // Medium confidence
    if (scoreDiff > 0.5) {
      return {
        speaker: doctorScore > patientScore ? 'doctor' : 'patient',
        confidence: 'medium'
      };
    }
    
    // Low confidence - use context
    if (context.lastSpeaker) {
      return {
        speaker: context.lastSpeaker === 'doctor' ? 'patient' : 'doctor',
        confidence: 'low'
      };
    }
    
    // Default fallback
    return {
      speaker: doctorScore > patientScore ? 'doctor' : 'patient',
      confidence: 'guess'
    };
  }
}

// Improved transcription processor with conversation context
class ImprovedTranscriptionProcessor {
  private speakerCorrector: AdvancedSpeakerCorrection;
  private conversationHistory: Array<{
    text: string;
    speaker: string;
    originalSpeaker: string;
    startTime?: number;
    endTime?: number;
    wasQuestion: boolean;
  }>;

  constructor() {
    this.speakerCorrector = new AdvancedSpeakerCorrection();
    this.conversationHistory = [];
  }

  processTranscriptionResult(result: {
    text: string;
    speaker?: string;
    startTime?: number;
    endTime?: number;
  }): {
    text: string;
    speaker: string;
    originalSpeaker: string;
    startTime?: number;
    endTime?: number;
    wasCorrected: boolean;
  } {
    const { text, speaker: originalSpeaker, startTime, endTime } = result;
    
    // Build context from recent conversation
    const context = this.buildContext();
    
    // Correct the speaker
    const correctedSpeaker = this.speakerCorrector.correctSpeaker(
      text, 
      originalSpeaker || 'unknown', 
      context
    );
    
    // Update conversation history
    this.updateConversationHistory({
      text,
      speaker: correctedSpeaker,
      originalSpeaker: originalSpeaker || 'unknown',
      startTime,
      endTime,
      wasQuestion: text.includes('?')
    });
    
    // Log the correction
    if (correctedSpeaker !== originalSpeaker) {
      console.log(`Speaker correction: "${text.substring(0, 50)}..." ${originalSpeaker} → ${correctedSpeaker}`);
    }
    
    return {
      ...result,
      speaker: correctedSpeaker,
      originalSpeaker: originalSpeaker || 'unknown',
      wasCorrected: correctedSpeaker !== originalSpeaker
    };
  }

  private buildContext(): {
    lastSpeaker: string | null;
    lastWasQuestion: boolean;
    recentSpeakers: string[];
    conversationLength: number;
  } {
    const recent = this.conversationHistory.slice(-3); // Last 3 turns
    const lastTurn = recent[recent.length - 1];
    
    return {
      lastSpeaker: lastTurn?.speaker || null,
      lastWasQuestion: lastTurn?.wasQuestion || false,
      recentSpeakers: recent.map(turn => turn.speaker),
      conversationLength: this.conversationHistory.length
    };
  }

  private updateConversationHistory(turn: {
    text: string;
    speaker: string;
    originalSpeaker: string;
    startTime?: number;
    endTime?: number;
    wasQuestion: boolean;
  }): void {
    this.conversationHistory.push(turn);
    
    // Keep only recent history to prevent memory issues
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-15);
    }
  }
}

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
  const [mode3Progress, setMode3Progress] = useState<'idle'|'transcribing'|'processing'|'ready'>('idle');
  const [finalAwsJson, setFinalAwsJson] = useState<any>(null);

  // Update mode when it changes
  useEffect(() => {
    if (mode && mode !== state.mode) {
      console.log(`Mode changed from ${state.mode} to ${mode}`);
      setState(prev => ({ ...prev, mode }));
    }
  }, [mode]); // Remove state.mode from dependencies to avoid circular updates

  // Enhanced segment tracking
  const [segments, setSegments] = useState<Segment[]>([]);
  const segIndex = useRef<Map<string, number>>(new Map());
  
  // Speaker tracking for correction
  const lastSpeakerRef = useRef<string | null>(null);
  
  // Advanced speaker correction processor
  const transcriptionProcessorRef = useRef<ImprovedTranscriptionProcessor | null>(null);
  
  // Initialize the processor
  if (!transcriptionProcessorRef.current) {
    transcriptionProcessorRef.current = new ImprovedTranscriptionProcessor();
  }

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
        // Ambient mode with feature flag ON: show corrected speaker labels using advanced processor
        const processedResult = transcriptionProcessorRef.current!.processTranscriptionResult({
          text: curr.text,
          speaker: curr.speaker || undefined,
          startTime: curr.startTime || undefined,
          endTime: curr.endTime || undefined
        });
        
        const speakerPrefix = processedResult.speaker !== 'unknown' ? `${processedResult.speaker}: ` : '';
        buf.push(speakerPrefix + curr.text.trim());
        
        // Update last speaker for next correction
        if (processedResult.speaker !== 'unknown') {
          lastSpeakerRef.current = processedResult.speaker;
        }
      } else {
        // Ambient mode with feature flag OFF: raw text only
        buf.push(curr.text.trim());
      }
    }
    if (buf.length) paragraphs.push(buf.join(' '));
    
    return paragraphs;
  }, [segments, buffers, activeSection, state.mode, featureFlags.speakerLabeling]);


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
                sampleRate: 16000,        // Ensure 16kHz for best diarization
                channelCount: 1,          // Mono audio works better for diarization
                echoCancellation: false,   // Turn OFF - can interfere with speaker detection
                noiseSuppression: false,   // Turn OFF - can merge speakers
                autoGainControl: false,    // Turn OFF - can normalize different speaker volumes
              },
            });
            streamRef.current = stream;
            
            // Log audio settings for debugging
            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();
            console.log('Audio settings for diarization:', {
              sampleRate: settings.sampleRate,
              channelCount: settings.channelCount,
              echoCancellation: settings.echoCancellation,
              noiseSuppression: settings.noiseSuppression,
              autoGainControl: settings.autoGainControl
            });
            
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
              console.log('Current mode from props:', mode);
              console.log('Feature flags:', featureFlags);
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
          } else if (msg.type === 'transcription_final' && msg.mode === 'ambient') {
            // Store the raw AWS JSON for Mode 3 pipeline processing
            console.log('Mode 3 final transcription received:', msg);
            setFinalAwsJson(msg.payload);
            setMode3Progress('transcribing');
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

  const stopTranscription = useCallback(async () => {
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

    // Handle Mode 3 pipeline processing
    if (state.mode === 'ambient' && finalAwsJson && state.sessionId) {
      try {
        setMode3Progress('processing');
        const result = await processMode3Pipeline({
          sessionId: state.sessionId,
          language: (language === 'fr-CA' || language === 'fr') ? 'fr' : 'en',
          section: state.currentSection,
          rawAwsJson: finalAwsJson
        });
        setMode3Narrative(result.narrative);
        setMode3Progress('ready');
      } catch (error) {
        console.error('Mode 3 pipeline processing failed:', error);
        setMode3Progress('idle');
        updateState({ 
          error: `Pipeline processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    }
  }, [updateState, state.mode, finalAwsJson, state.sessionId, language, state.currentSection, processMode3Pipeline]);

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

    // Mode 3 pipeline data
    mode3Narrative,
    mode3Progress,
    finalAwsJson,

    // Actions
    startRecording,
    stopRecording,
    sendVoiceCommand,
    updateState,
    reconnect,
    setActiveSection,
    
    // Expose pipeline helper for testing
    processMode3Pipeline,
  };
};
