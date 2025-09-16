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
      // Orthopedic-specific patterns
      orthopedic: RegExp;
      examination: RegExp;
      assessment: RegExp;
    };
    patient: {
      personal: RegExp;
      medications: RegExp;
      symptoms: RegExp;
      answers: RegExp;
      descriptions: RegExp;
      // Orthopedic-specific patterns
      orthopedic: RegExp;
      pain: RegExp;
      injury: RegExp;
    };
  };
  
  // Orthopedic context patterns by phase
  private phasePatterns: {
    [key: string]: {
      doctor: RegExp[];
      patient: RegExp[];
      weights: { doctor: number; patient: number };
    };
  };

  constructor() {
    // this.conversationContext = []; // Not used in current implementation
    
    // Initialize phase-specific patterns
    this.phasePatterns = {
      greeting: {
        doctor: [
          /\b(I'll be your orthopedic surgeon|I'm Dr\.|let me just wash my hands|nice to meet you)\b/gi
        ],
        patient: [
          /\b(hi|hello|nice to meet you|thank you)\b/gi
        ],
        weights: { doctor: 3, patient: 1 }
      },
      chief_complaint: {
        doctor: [
          /\b(what brings you in|why you're here|tell me about|what's the problem)\b/gi
        ],
        patient: [
          /\b(I hurt my|I injured my|my \w+ hurts|I have pain|I can't move)\b/gi
        ],
        weights: { doctor: 2, patient: 3 }
      },
      history: {
        doctor: [
          /\b(when did this start|how did this happen|what were you doing|any previous injuries|how long)\b/gi
        ],
        patient: [
          /\b(it started|about \d+ days ago|I was \w+|I heard a pop|I fell)\b/gi
        ],
        weights: { doctor: 2, patient: 3 }
      },
      examination: {
        doctor: [
          /\b(let me take a look|I'm going to examine|does this hurt|can you move|push against my hand)\b/gi
        ],
        patient: [
          /\b(ow|ouch|that hurts|yes, right there|that's the spot|I can feel)\b/gi
        ],
        weights: { doctor: 3, patient: 2 }
      },
      assessment: {
        doctor: [
          /\b(what I think is going on|it looks like you have|I'd like to get an X-ray|we need to rule out)\b/gi
        ],
        patient: [
          /\b(what does that mean|is it serious|will I need surgery|how long will it take)\b/gi
        ],
        weights: { doctor: 3, patient: 1 }
      },
      plan: {
        doctor: [
          /\b(I'm going to prescribe|let's start with|follow up with me|any questions|does that make sense)\b/gi
        ],
        patient: [
          /\b(thank you|that sounds good|when should I come back|what should I do)\b/gi
        ],
        weights: { doctor: 2, patient: 2 }
      }
    };
    
    this.speakerPatterns = {
      doctor: {
        // Strong doctor indicators
        questions: /\b(tell me|rate on a|pain scale|does it move|does the|anything that makes|how would you|what about)\b/gi,
        medical: /\b(pain scale|radiation|0 being|10 being|scale of|examination|symptoms)\b/gi,
        instructions: /\b(let me|I want you to|can you|try to)\b/gi,
        
        // Weaker indicators (context dependent)
        transitions: /\b(so|um so|now|and|alright)\b/gi,
        acknowledgments: /\b(OK|alright|I see|mm-hmm)\b/gi,
        
        // Orthopedic-specific patterns
        orthopedic: /\b(I'll be your orthopedic surgeon|I'm Dr\.|let me just wash my hands|Can you tell me what brings you in|tell me about this pain|when did this start|how did this happen|what were you doing when|on a scale of 1 to 10|rate your pain|does it hurt when you|can you move|any numbness|have you tried|any previous injuries|let me take a look|I'm going to examine|push against my hand|does this hurt|I can feel|there's some swelling|what I think is going on|it looks like you have|I'd like to get an X-ray|we need to rule out|I'm going to prescribe|let's start with conservative treatment|follow up with me|any questions for me|does that make sense)\b/gi,
        examination: /\b(let me take a look|I'm going to examine|can you raise your arm|push against my hand|does this hurt|I can feel|there's some swelling|tenderness|stiffness)\b/gi,
        assessment: /\b(what I think is going on|it looks like you have|I'd like to get an X-ray|we need to rule out|I'm going to prescribe|let's start with conservative treatment|follow up with me)\b/gi
      },
      
      patient: {
        // Strong patient indicators
        personal: /\b(I took|I tried|I have|I feel|I can't|I don't|my pain|it hurts)\b/gi,
        medications: /\b(Tylenol|Motrin|ibuprofen|aspirin|took some|tried some)\b/gi,
        symptoms: /\b(nothing helped|doesn't work|makes it worse|feels like|started when)\b/gi,
        
        // Response patterns
        answers: /\b(yes|no|yeah|nope|maybe|I think|probably|not really)\b/gi,
        descriptions: /\b(it's like|feels like|kind of|sort of)\b/gi,
        
        // Orthopedic-specific patterns
        orthopedic: /\b(I hurt my|I injured my|I twisted my|I fell on my|my back hurts|my neck is killing me|my shoulder is in pain|I have pain in my|I can't move|it's been hurting for|the pain is sharp|it feels like|it's a \d+ out of 10|it's really bad|nothing helps|it's worse when I|I was playing|I fell down|I heard a pop|it happened when I|I can't work|I haven't been able to|it's affecting my|I tried ice|I've been taking|I saw another doctor|I had physical therapy|ow|ouch|that hurts|yes, right there|that's the spot|I can feel tingling|it's tender there)\b/gi,
        pain: /\b(the pain is sharp|dull|aching|throbbing|burning|shooting|it's a \d+ out of 10|it's really bad|terrible|excruciating|unbearable|nothing helps|it's worse when I|it hurts more when)\b/gi,
        injury: /\b(I hurt my|I injured my|I twisted my|I fell on my|I was playing|I fell down|I heard a pop|it happened when I|I was doing)\b/gi
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
    
    // Apply orthopedic context scoring
    const orthopedicAdjustment = this.getOrthopedicContextAdjustment(cleanText, context);
    
    // Apply conversation flow logic
    const flowAdjustment = this.getConversationFlowAdjustment(cleanText, context);
    
    const finalDoctorScore = doctorScore + flowAdjustment.doctor + orthopedicAdjustment.doctor;
    const finalPatientScore = patientScore + flowAdjustment.patient + orthopedicAdjustment.patient;
    
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
    
    // Orthopedic-specific indicators (high confidence)
    const orthopedicMatches = (text.match(this.speakerPatterns.doctor.orthopedic) || []).length;
    score += orthopedicMatches * 4; // Very strong indicator
    
    const examinationMatches = (text.match(this.speakerPatterns.doctor.examination) || []).length;
    score += examinationMatches * 3;
    
    const assessmentMatches = (text.match(this.speakerPatterns.doctor.assessment) || []).length;
    score += assessmentMatches * 3;
    
    // Question structure
    if (text.includes('?')) score += 2;
    if (text.match(/\b(does|do|can|will|would|how|what|when|where|why)\b/g)) score += 1;
    
    // Professional language patterns
    if (text.match(/\b(scale|rate|describe|tell me about)\b/g)) score += 1.5;
    
    // Orthopedic-specific question patterns
    if (text.match(/\b(on a scale of|rate your pain|does it hurt when|can you move|any numbness|have you tried|any previous injuries)\b/gi)) score += 2.5;
    
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
    
    // Orthopedic-specific indicators (high confidence)
    const orthopedicMatches = (text.match(this.speakerPatterns.patient.orthopedic) || []).length;
    score += orthopedicMatches * 4; // Very strong indicator
    
    const painMatches = (text.match(this.speakerPatterns.patient.pain) || []).length;
    score += painMatches * 3;
    
    const injuryMatches = (text.match(this.speakerPatterns.patient.injury) || []).length;
    score += injuryMatches * 3;
    
    // Response patterns (especially after questions)
    if (context.lastWasQuestion) {
      const answerMatches = (text.match(this.speakerPatterns.patient.answers) || []).length;
      score += answerMatches * 2;
    }
    
    // Personal pronouns in symptom context
    if (text.includes('i ') && text.match(/\b(pain|hurt|feel|took|tried)\b/)) {
      score += 2;
    }
    
    // Orthopedic-specific pain responses
    if (text.match(/\b(ow|ouch|that hurts|yes, right there|that's the spot)\b/gi)) {
      score += 3;
    }
    
    // Body part mentions with pain context
    if (text.match(/\b(back|neck|shoulder|arm|knee|ankle|hip|wrist|elbow)\b/gi) && text.match(/\b(hurts|pain|ache|sore|tender)\b/gi)) {
      score += 2;
    }
    
    return score;
  }

  private hasStrongPatientIndicators(text: string): boolean {
    return !!text.match(/\b(I took|I tried|Tylenol|Motrin|nothing helped|I hurt my|I injured my|my back hurts|my neck is killing me|the pain is sharp|it's a \d+ out of 10|ow|ouch|that hurts)\b/gi);
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

  private getOrthopedicContextAdjustment(text: string, context: any): { doctor: number; patient: number } {
    const adjustment = { doctor: 0, patient: 0 };
    
    // Get orthopedic context from the context object
    const orthopedicContext = context.orthopedicContext;
    if (!orthopedicContext) {
      return adjustment;
    }
    
    const currentPhase = orthopedicContext.currentPhase;
    const bodyParts = orthopedicContext.bodyParts || [];
    const painLevel = orthopedicContext.painLevel;
    const injuryMechanism = orthopedicContext.injuryMechanism;
    
    // Phase-specific adjustments
    if (this.phasePatterns[currentPhase]) {
      const phasePattern = this.phasePatterns[currentPhase];
      
      // Check doctor patterns for current phase
      for (const pattern of phasePattern.doctor) {
        if (pattern.test(text)) {
          adjustment.doctor += phasePattern.weights.doctor;
          console.log(`Phase-based doctor pattern match: ${currentPhase} (+${phasePattern.weights.doctor})`);
        }
      }
      
      // Check patient patterns for current phase
      for (const pattern of phasePattern.patient) {
        if (pattern.test(text)) {
          adjustment.patient += phasePattern.weights.patient;
          console.log(`Phase-based patient pattern match: ${currentPhase} (+${phasePattern.weights.patient})`);
        }
      }
    }
    
    // Body part context adjustments
    if (bodyParts.length > 0) {
      // If text mentions body parts that are already in context, likely patient
      const mentionedBodyParts = bodyParts.filter((part: string) => text.includes(part));
      if (mentionedBodyParts.length > 0) {
        adjustment.patient += 1;
        console.log(`Body part context match: ${mentionedBodyParts.join(', ')} (+1 patient)`);
      }
    }
    
    // Pain level context adjustments
    if (painLevel !== null) {
      // If text mentions pain scale or pain descriptors, likely patient
      if (text.match(/\b(\d+)\s*out\s*of\s*(\d+|ten)\b/i) || 
          text.match(/\b(really bad|terrible|excruciating|moderate|mild|slight)\b/i)) {
        adjustment.patient += 1.5;
        console.log(`Pain level context match: ${painLevel} (+1.5 patient)`);
      }
    }
    
    // Injury mechanism context adjustments
    if (injuryMechanism) {
      // If text mentions the same injury mechanism, likely patient
      if (text.includes(injuryMechanism)) {
        adjustment.patient += 1;
        console.log(`Injury mechanism context match: ${injuryMechanism} (+1 patient)`);
      }
    }
    
    return adjustment;
  }

  private determineSpeaker(doctorScore: number, patientScore: number, _text: string, context: any): { speaker: string; confidence: string } {
    const scoreDiff = Math.abs(doctorScore - patientScore);
    
    // High confidence threshold - lowered for better sensitivity
    if (scoreDiff >= 1.5) {
      return {
        speaker: doctorScore > patientScore ? 'doctor' : 'patient',
        confidence: 'high'
      };
    }
    
    // Medium confidence
    if (scoreDiff >= 0.5) {
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

// Advanced conversation flow cleaner for post-processing
class ConversationFlowCleaner {
  private fragmentPatterns: {
    continuePatterns: RegExp;
    newThoughtPatterns: RegExp;
    interruptionPatterns: RegExp;
    medicalContinuation: RegExp;
    // Orthopedic-specific fragment patterns
    orthopedicFragments: RegExp;
    bodyPartFragments: RegExp;
    painFragments: RegExp;
  };
  private conversationRules: {
    minSegmentLength: number;
    maxMergeTimeGap: number;
    speakerSwitchThreshold: number;
  };

  constructor() {
    this.fragmentPatterns = {
      // Incomplete sentence endings that should continue
      continuePatterns: /\b(and|but|so|because|um|uh|I|it's|the|a|an|my|your|that|this|when|where|if)$/i,
      
      // Sentence starters that indicate new thoughts
      newThoughtPatterns: /^(so|now|um|uh|well|OK|alright|what|how|do you|can you|I think|I feel)/i,
      
      // Mid-sentence interruption indicators
      interruptionPatterns: /\b(um|uh|er|ah)\s*$/i,
      
      // Incomplete medical phrases
      medicalContinuation: /\b(brain|head|pain|started|having|seizures|tumor|neighbor|last year)$/i,
      
      // Orthopedic-specific fragment patterns
      orthopedicFragments: /\b(and|but|so|because|um|uh|I|it's|the|my|your|that|this|when|where|if|back|neck|shoulder|knee|ankle|arm|hip|wrist|elbow|pain|hurt|ache|sore|tender)$/i,
      bodyPartFragments: /\b(back|neck|shoulder|knee|ankle|arm|hip|wrist|elbow|leg|foot|hand|finger|thumb)$/i,
      painFragments: /\b(pain|hurt|ache|sore|tender|sharp|dull|throbbing|burning|shooting)$/i
    };
    
    this.conversationRules = {
      // Minimum viable segment length
      minSegmentLength: 8,
      
      // Maximum time gap for merging (seconds)
      maxMergeTimeGap: 3,
      
      // Speaker switch confidence threshold
      speakerSwitchThreshold: 0.7
    };
  }

  cleanConversationFlow(segments: Array<{
    text: string;
    speaker: string;
    startTime?: number;
    endTime?: number;
    originalSpeaker?: string;
  }>): Array<{
    id: number;
    speaker: string;
    text: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    wordCount: number;
    confidence: string;
    metadata: {
      segmentCount: number;
      wasMerged: boolean;
      originalSpeakers: string[];
    };
  }> {
    // Step 1: Merge obvious fragments
    const mergedSegments = this.mergeFragmentedSegments(segments);
    
    // Step 2: Fix mid-sentence speaker switches
    const fixedSwitches = this.fixMidSentenceSwitches(mergedSegments);
    
    // Step 3: Clean up conversation turns
    const cleanedTurns = this.createCleanConversationTurns(fixedSwitches);
    
    // Step 4: Final formatting and validation
    const finalConversation = this.finalizeConversation(cleanedTurns);
    
    return finalConversation;
  }

  private mergeFragmentedSegments(segments: Array<{
    text: string;
    speaker: string;
    startTime?: number;
    endTime?: number;
    originalSpeaker?: string;
  }>): Array<{
    text: string;
    speaker: string;
    startTime?: number;
    endTime?: number;
    originalSpeaker?: string;
    confidence: string;
    originalSegments?: Array<any>;
  }> {
    const merged: Array<{
      text: string;
      speaker: string;
      startTime?: number;
      endTime?: number;
      originalSpeaker?: string;
      confidence: string;
      originalSegments?: Array<any>;
    }> = [];
    let currentSegment: any = null;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (!currentSegment) {
        currentSegment = { ...segment, confidence: 'original' };
        continue;
      }
      
      const shouldMerge = this.shouldMergeWithPrevious(currentSegment, segment, segments, i);
      
      if (shouldMerge) {
        // Merge segments
        currentSegment = this.mergeSegments(currentSegment, segment);
      } else {
        // Finalize current and start new
        merged.push(this.finalizeSegment(currentSegment));
        currentSegment = { ...segment, confidence: 'original' };
      }
    }
    
    if (currentSegment) {
      merged.push(this.finalizeSegment(currentSegment));
    }
    
    return merged;
  }

  private shouldMergeWithPrevious(current: any, next: any, _allSegments: any[], _index: number): boolean {
    // Same speaker check
    if (current.speaker !== next.speaker) {
      return false;
    }
    
    // Time gap check
    const timeGap = (next.startTime || 0) - (current.endTime || 0);
    if (timeGap > this.conversationRules.maxMergeTimeGap) {
      return false;
    }
    
    // Fragment pattern checks
    const currentText = current.text.trim();
    const nextText = next.text.trim();
    
    // Current segment ends incompletely
    if (this.fragmentPatterns.continuePatterns.test(currentText)) {
      return true;
    }
    
    // Current ends with interruption filler
    if (this.fragmentPatterns.interruptionPatterns.test(currentText)) {
      return true;
    }
    
    // Medical phrase continuation
    if (this.fragmentPatterns.medicalContinuation.test(currentText)) {
      return true;
    }
    
    // Orthopedic-specific fragment patterns
    if (this.fragmentPatterns.orthopedicFragments.test(currentText)) {
      return true;
    }
    
    // Body part fragments (common in orthopedic conversations)
    if (this.fragmentPatterns.bodyPartFragments.test(currentText)) {
      return true;
    }
    
    // Pain fragments (common in orthopedic conversations)
    if (this.fragmentPatterns.painFragments.test(currentText)) {
      return true;
    }
    
    // Very short segments are likely fragments
    if (currentText.length < this.conversationRules.minSegmentLength || 
        nextText.length < this.conversationRules.minSegmentLength) {
      return true;
    }
    
    // Next segment doesn't start a new thought
    if (!this.fragmentPatterns.newThoughtPatterns.test(nextText) && 
        !nextText.match(/^[A-Z]/)) {
      return true;
    }
    
    return false;
  }

  private mergeSegments(segment1: any, segment2: any): any {
    return {
      ...segment1,
      text: this.smartTextMerge(segment1.text, segment2.text),
      endTime: segment2.endTime,
      confidence: 'merged',
      originalSegments: [
        ...(segment1.originalSegments || [segment1]),
        ...(segment2.originalSegments || [segment2])
      ]
    };
  }

  private smartTextMerge(text1: string, text2: string): string {
    const clean1 = text1.trim();
    const clean2 = text2.trim();
    
    // Remove redundant conjunctions at merge point
    let merged = clean1;
    
    // Add appropriate spacing
    if (!clean1.endsWith(' ') && !clean2.startsWith(' ')) {
      merged += ' ';
    }
    
    merged += clean2;
    
    // Clean up double spaces and punctuation
    return merged
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\.\s*\./g, '.')
      .trim();
  }

  private fixMidSentenceSwitches(segments: any[]): any[] {
    const fixed: any[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Check for obvious mid-sentence switches
      const switchPoints = this.findSpeakerSwitchPoints(segment.text);
      
      if (switchPoints.length > 0) {
        // Split segment at switch points
        const splitSegments = this.splitSegmentAtSwitches(segment, switchPoints);
        fixed.push(...splitSegments);
      } else {
        fixed.push(segment);
      }
    }
    
    return fixed;
  }

  private findSpeakerSwitchPoints(text: string): Array<{
    position: number;
    confidence: number;
    type: string;
  }> {
    const switchPoints: Array<{
      position: number;
      confidence: number;
      type: string;
    }> = [];
    
    // Look for patterns that indicate speaker changes
    const patterns = [
      // Question followed by response pattern
      /(\?)\s+(I|Yeah|Yes|No|Well|Um)/gi,
      
      // Statement followed by question
      /(\.|!)\s+(What|How|Do you|Can you|So)/gi,
      
      // Medical professional interjections
      /(OK|Alright|I see)\.\s+(So|Now|What|How)/gi
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        switchPoints.push({
          position: match.index + match[1].length,
          confidence: 0.8,
          type: 'pattern_match'
        });
      }
    });
    
    return switchPoints;
  }

  private splitSegmentAtSwitches(segment: any, switchPoints: Array<{
    position: number;
    confidence: number;
    type: string;
  }>): any[] {
    if (switchPoints.length === 0) return [segment];
    
    const splits: any[] = [];
    let lastPosition = 0;
    let currentSpeaker = segment.speaker;
    
    switchPoints.forEach((switchPoint, _index) => {
      // Create segment for text before switch
      const beforeText = segment.text.substring(lastPosition, switchPoint.position).trim();
      if (beforeText.length > 0) {
        splits.push({
          ...segment,
          text: beforeText,
          speaker: currentSpeaker,
          confidence: 'split_before'
        });
      }
      
      // Switch speaker for next segment
      currentSpeaker = currentSpeaker === 'doctor' ? 'patient' : 'doctor';
      lastPosition = switchPoint.position;
    });
    
    // Add remaining text
    const remainingText = segment.text.substring(lastPosition).trim();
    if (remainingText.length > 0) {
      splits.push({
        ...segment,
        text: remainingText,
        speaker: currentSpeaker,
        confidence: 'split_after'
      });
    }
    
    return splits;
  }

  private createCleanConversationTurns(segments: any[]): any[] {
    const turns: any[] = [];
    let currentTurn: any = null;
    
    for (const segment of segments) {
      if (!currentTurn || currentTurn.speaker !== segment.speaker) {
        // Start new turn
        if (currentTurn) {
          turns.push(this.finalizeTurn(currentTurn));
        }
        
        currentTurn = {
          speaker: segment.speaker,
          text: segment.text,
          startTime: segment.startTime,
          endTime: segment.endTime,
          segments: [segment],
          confidence: segment.confidence
        };
      } else {
        // Continue current turn
        currentTurn.text = this.smartTextMerge(currentTurn.text, segment.text);
        currentTurn.endTime = segment.endTime;
        currentTurn.segments.push(segment);
        
        // Update confidence based on segments
        if (segment.confidence === 'high' && currentTurn.confidence !== 'high') {
          currentTurn.confidence = 'medium';
        }
      }
    }
    
    if (currentTurn) {
      turns.push(this.finalizeTurn(currentTurn));
    }
    
    return turns;
  }

  private finalizeTurn(turn: any): any {
    return {
      ...turn,
      text: this.cleanFinalText(turn.text),
      duration: (turn.endTime || 0) - (turn.startTime || 0),
      wordCount: turn.text.split(/\s+/).length
    };
  }

  private cleanFinalText(text: string): string {
    return text
      // Fix punctuation spacing
      .replace(/\s*([,.!?;:])\s*/g, '$1 ')
      .replace(/\s+([,.!?;:])/g, '$1')
      
      // Clean up filler words at boundaries
      .replace(/^(um|uh|er|ah)\s+/gi, '')
      .replace(/\s+(um|uh|er|ah)$/gi, '')
      
      // Fix capitalization after punctuation
      .replace(/([.!?])\s+([a-z])/g, (_match, punct, letter) => 
        punct + ' ' + letter.toUpperCase())
      
      // Clean multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  private finalizeConversation(turns: any[]): Array<{
    id: number;
    speaker: string;
    text: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    wordCount: number;
    confidence: string;
    metadata: {
      segmentCount: number;
      wasMerged: boolean;
      originalSpeakers: string[];
    };
  }> {
    return turns
      .filter(turn => turn.text.length > 2) // Remove empty turns
      .map((turn, index) => ({
        id: index,
        speaker: turn.speaker === 'doctor' ? 'Provider' : 'Patient',
        text: turn.text,
        startTime: turn.startTime,
        endTime: turn.endTime,
        duration: turn.duration,
        wordCount: turn.wordCount,
        confidence: turn.confidence,
        metadata: {
          segmentCount: turn.segments.length,
          wasMerged: turn.segments.length > 1,
          originalSpeakers: Array.from(new Set(turn.segments.map((s: any) => s.originalSpeaker || s.speaker)))
        }
      }));
  }

  private finalizeSegment(segment: any): any {
    return {
      ...segment,
      text: segment.text.trim()
    };
  }
}

// Enhanced transcription processor with conversation flow cleaning
class EnhancedTranscriptionProcessor {
  private speakerCorrector: AdvancedSpeakerCorrection;
  private flowCleaner: ConversationFlowCleaner;
  private conversationHistory: Array<{
    text: string;
    speaker: string;
    originalSpeaker: string;
    startTime?: number;
    endTime?: number;
    wasQuestion: boolean;
  }>;
  private rawSegments: Array<{
    text: string;
    speaker: string;
    startTime?: number;
    endTime?: number;
    originalSpeaker?: string;
  }>;
  
  // Orthopedic context tracking
  private orthopedicContext: {
    currentPhase: 'greeting' | 'chief_complaint' | 'history' | 'examination' | 'assessment' | 'plan';
    bodyParts: string[];
    painLevel: number | null;
    injuryMechanism: string | null;
    conversationFlow: Array<{
      phase: string;
      timestamp: number;
      trigger: string;
    }>;
  };

  constructor() {
    this.speakerCorrector = new AdvancedSpeakerCorrection();
    this.flowCleaner = new ConversationFlowCleaner();
    this.conversationHistory = [];
    this.rawSegments = [];
    
    // Initialize orthopedic context
    this.orthopedicContext = {
      currentPhase: 'greeting',
      bodyParts: [],
      painLevel: null,
      injuryMechanism: null,
      conversationFlow: []
    };
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
    orthopedicContext?: any;
  } {
    const { text, speaker: originalSpeaker, startTime, endTime } = result;
    
    // Update orthopedic context before speaker correction
    this.updateOrthopedicContext(text, startTime);
    
    // Build context from recent conversation (including orthopedic context)
    const context = this.buildContext();
    
    // Correct the speaker
    const correctedSpeaker = this.speakerCorrector.correctSpeaker(
      text, 
      originalSpeaker || 'unknown', 
      context
    );
    
    // Add to raw segments for flow cleaning
    this.rawSegments.push({
      text,
      speaker: correctedSpeaker,
      startTime,
      endTime,
      originalSpeaker: originalSpeaker || 'unknown'
    });
    
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
      wasCorrected: correctedSpeaker !== originalSpeaker,
      orthopedicContext: { ...this.orthopedicContext }
    };
  }

  getCleanedConversation(): Array<{
    id: number;
    speaker: string;
    text: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    wordCount: number;
    confidence: string;
    metadata: {
      segmentCount: number;
      wasMerged: boolean;
      originalSpeakers: string[];
    };
  }> {
    return this.flowCleaner.cleanConversationFlow(this.rawSegments);
  }

  private buildContext(): {
    lastSpeaker: string | null;
    lastWasQuestion: boolean;
    recentSpeakers: string[];
    conversationLength: number;
    orthopedicContext: any;
  } {
    const recent = this.conversationHistory.slice(-3); // Last 3 turns
    const lastTurn = recent[recent.length - 1];
    
    return {
      lastSpeaker: lastTurn?.speaker || null,
      lastWasQuestion: lastTurn?.wasQuestion || false,
      recentSpeakers: recent.map(turn => turn.speaker),
      conversationLength: this.conversationHistory.length,
      orthopedicContext: this.getOrthopedicContext()
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

  // Orthopedic context tracking methods
  private updateOrthopedicContext(text: string, startTime?: number): void {
    const cleanText = text.toLowerCase();
    const timestamp = startTime || Date.now();
    
    // Update conversation phase
    this.updateConversationPhase(cleanText, timestamp);
    
    // Extract body parts
    this.extractBodyParts(cleanText);
    
    // Extract pain level
    this.extractPainLevel(cleanText);
    
    // Extract injury mechanism
    this.extractInjuryMechanism(cleanText);
  }

  private updateConversationPhase(text: string, timestamp: number): void {
    const previousPhase = this.orthopedicContext.currentPhase;
    let newPhase = previousPhase;
    
    // Phase transition patterns
    if (text.includes('orthopedic surgeon') || text.includes('i\'ll be your doctor')) {
      newPhase = 'greeting';
    } else if (text.includes('what brings you in') || text.includes('why you\'re here') || text.includes('tell me about')) {
      newPhase = 'chief_complaint';
    } else if (text.includes('when did this start') || text.includes('how did this happen') || text.includes('what were you doing')) {
      newPhase = 'history';
    } else if (text.includes('let me take a look') || text.includes('examine') || text.includes('does this hurt')) {
      newPhase = 'examination';
    } else if (text.includes('what i think is going on') || text.includes('looks like you have') || text.includes('diagnosis')) {
      newPhase = 'assessment';
    } else if (text.includes('i\'d like to get') || text.includes('prescribe') || text.includes('follow up')) {
      newPhase = 'plan';
    }
    
    // Update phase if changed
    if (newPhase !== previousPhase) {
      this.orthopedicContext.currentPhase = newPhase;
      this.orthopedicContext.conversationFlow.push({
        phase: newPhase,
        timestamp,
        trigger: text.substring(0, 50)
      });
      
      console.log(`Orthopedic phase transition: ${previousPhase} → ${newPhase}`);
    }
  }

  private extractBodyParts(text: string): void {
    const bodyPartPatterns = [
      /\b(back|spine|neck|cervical|lumbar|thoracic)\b/gi,
      /\b(shoulder|rotator cuff|clavicle|scapula)\b/gi,
      /\b(arm|elbow|forearm|wrist|hand|finger|thumb)\b/gi,
      /\b(hip|pelvis|groin|thigh|femur)\b/gi,
      /\b(knee|kneecap|patella|meniscus|acl|mcl|pcl|lcl)\b/gi,
      /\b(leg|shin|calf|tibia|fibula)\b/gi,
      /\b(ankle|foot|toe|heel|arch|achilles)\b/gi
    ];
    
    bodyPartPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const bodyPart = match.toLowerCase();
          if (!this.orthopedicContext.bodyParts.includes(bodyPart)) {
            this.orthopedicContext.bodyParts.push(bodyPart);
          }
        });
      }
    });
  }

  private extractPainLevel(text: string): void {
    // Look for pain scale mentions
    const painScaleMatch = text.match(/(\d+)\s*out\s*of\s*(\d+|ten)/i);
    if (painScaleMatch) {
      const level = parseInt(painScaleMatch[1]);
      const max = painScaleMatch[2].toLowerCase() === 'ten' ? 10 : parseInt(painScaleMatch[2]);
      
      if (level >= 1 && level <= max) {
        this.orthopedicContext.painLevel = level;
        console.log(`Pain level detected: ${level}/${max}`);
      }
    }
    
    // Look for descriptive pain levels
    if (text.includes('really bad') || text.includes('terrible') || text.includes('excruciating')) {
      this.orthopedicContext.painLevel = 8; // High pain
    } else if (text.includes('moderate') || text.includes('manageable')) {
      this.orthopedicContext.painLevel = 5; // Moderate pain
    } else if (text.includes('mild') || text.includes('slight')) {
      this.orthopedicContext.painLevel = 3; // Mild pain
    }
  }

  private extractInjuryMechanism(text: string): void {
    // More specific patterns to avoid partial matches - ordered by priority
    const injuryPatterns = [
      { pattern: /\b(heard a pop|heard a crack|heard a snap)\b/gi, mechanism: 'heard a pop' },
      { pattern: /\b(fell down|fell off)\b/gi, mechanism: 'fell down' },
      { pattern: /\b(car accident|motor vehicle|mva)\b/gi, mechanism: 'car accident' },
      { pattern: /\b(work injury|workplace|on the job)\b/gi, mechanism: 'work injury' },
      { pattern: /\b(playing|sports|basketball|football|tennis)\b/gi, mechanism: 'playing' },
      { pattern: /\b(lifting|lifted|picked up)\b/gi, mechanism: 'lifting' },
      { pattern: /\b(twisted|twisting)\b/gi, mechanism: 'twisted' },
      { pattern: /\b(fell)\b/gi, mechanism: 'fell' }
    ];
    
    // Check patterns in order of priority (most important first)
    for (const { pattern, mechanism } of injuryPatterns) {
      const match = text.match(pattern);
      if (match) {
        this.orthopedicContext.injuryMechanism = mechanism;
        console.log(`Injury mechanism detected: ${this.orthopedicContext.injuryMechanism}`);
        break; // Stop at first match to avoid overwriting with less specific patterns
      }
    }
  }

  // Get current orthopedic context
  getOrthopedicContext(): any {
    return { ...this.orthopedicContext };
  }

  // Reset orthopedic context (useful for new conversations)
  resetOrthopedicContext(): void {
    this.orthopedicContext = {
      currentPhase: 'greeting',
      bodyParts: [],
      painLevel: null,
      injuryMechanism: null,
      conversationFlow: []
    };
  }

  // Generate structured orthopedic narrative
  generateOrthopedicNarrative(): {
    summary: {
      patient: string;
      chiefComplaint: string;
      history: string;
      examination: string;
      assessment: string;
      plan: string;
    };
    keyFindings: {
      bodyParts: string[];
      painLevel: number | null;
      injuryMechanism: string | null;
      duration: string | null;
    };
    conversationFlow: Array<{
      phase: string;
      timestamp: number;
      trigger: string;
    }>;
    structuredTranscript: Array<{
      phase: string;
      speaker: string;
      text: string;
      timestamp?: number;
      medicalSignificance: string;
    }>;
  } {
    const cleanedConversation = this.getCleanedConversation();
    const context = this.getOrthopedicContext();
    
    // Group conversation by phases
    const phaseGroups = this.groupConversationByPhases(cleanedConversation);
    
    // Generate structured summary
    const summary = this.generatePhaseSummary(phaseGroups);
    
    // Extract key findings
    const keyFindings = this.extractKeyFindings(context, phaseGroups);
    
    // Create structured transcript
    const structuredTranscript = this.createStructuredTranscript(cleanedConversation, phaseGroups);
    
    return {
      summary,
      keyFindings,
      conversationFlow: context.conversationFlow,
      structuredTranscript
    };
  }

  private groupConversationByPhases(conversation: any[]): { [key: string]: any[] } {
    const phaseGroups: { [key: string]: any[] } = {
      greeting: [],
      chief_complaint: [],
      history: [],
      examination: [],
      assessment: [],
      plan: []
    };
    
    let currentPhase = 'greeting';
    
    conversation.forEach((turn) => {
      // Determine phase based on content analysis and conversation flow
      const turnText = turn.text.toLowerCase();
      
      // Phase detection based on content
      if (turnText.includes('orthopedic surgeon') || turnText.includes('i\'ll be your doctor')) {
        currentPhase = 'greeting';
      } else if (turnText.includes('what brings you in') || turnText.includes('why you\'re here') || turnText.includes('tell me about')) {
        currentPhase = 'chief_complaint';
      } else if (turnText.includes('when did this start') || turnText.includes('how did this happen') || turnText.includes('what were you doing')) {
        currentPhase = 'history';
      } else if (turnText.includes('let me take a look') || turnText.includes('examine') || turnText.includes('does this hurt')) {
        currentPhase = 'examination';
      } else if (turnText.includes('what i think is going on') || turnText.includes('looks like you have') || turnText.includes('diagnosis')) {
        currentPhase = 'assessment';
      } else if (turnText.includes('i\'d like to get') || turnText.includes('prescribe') || turnText.includes('follow up')) {
        currentPhase = 'plan';
      }
      
      // Assign turn to appropriate phase group
      if (phaseGroups[currentPhase]) {
        phaseGroups[currentPhase].push(turn);
      }
    });
    
    return phaseGroups;
  }

  private generatePhaseSummary(phaseGroups: { [key: string]: any[] }): {
    patient: string;
    chiefComplaint: string;
    history: string;
    examination: string;
    assessment: string;
    plan: string;
  } {
    return {
      patient: this.extractPatientInfo(phaseGroups.greeting),
      chiefComplaint: this.extractChiefComplaint(phaseGroups.chief_complaint),
      history: this.extractHistory(phaseGroups.history),
      examination: this.extractExamination(phaseGroups.examination),
      assessment: this.extractAssessment(phaseGroups.assessment),
      plan: this.extractPlan(phaseGroups.plan)
    };
  }

  private extractPatientInfo(greetingTurns: any[]): string {
    const patientTurns = greetingTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'Patient information not captured';
    
    const responses = patientTurns.map(turn => turn.text).join(' ');
    return `Patient: ${responses}`;
  }

  private extractChiefComplaint(complaintTurns: any[]): string {
    const patientTurns = complaintTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'Chief complaint not captured';
    
    const complaints = patientTurns.map(turn => turn.text).join(' ');
    return `Chief Complaint: ${complaints}`;
  }

  private extractHistory(historyTurns: any[]): string {
    const patientTurns = historyTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'History not captured';
    
    const history = patientTurns.map(turn => turn.text).join(' ');
    return `History: ${history}`;
  }

  private extractExamination(examTurns: any[]): string {
    const doctorTurns = examTurns.filter(turn => turn.speaker === 'doctor');
    const patientTurns = examTurns.filter(turn => turn.speaker === 'patient');
    
    const doctorFindings = doctorTurns.map(turn => turn.text).join(' ');
    const patientResponses = patientTurns.map(turn => turn.text).join(' ');
    
    return `Examination: ${doctorFindings} Patient responses: ${patientResponses}`;
  }

  private extractAssessment(assessmentTurns: any[]): string {
    const doctorTurns = assessmentTurns.filter(turn => turn.speaker === 'doctor');
    if (doctorTurns.length === 0) return 'Assessment not captured';
    
    const assessment = doctorTurns.map(turn => turn.text).join(' ');
    return `Assessment: ${assessment}`;
  }

  private extractPlan(planTurns: any[]): string {
    const doctorTurns = planTurns.filter(turn => turn.speaker === 'doctor');
    if (doctorTurns.length === 0) return 'Plan not captured';
    
    const plan = doctorTurns.map(turn => turn.text).join(' ');
    return `Plan: ${plan}`;
  }

  private extractKeyFindings(context: any, phaseGroups: { [key: string]: any[] }): {
    bodyParts: string[];
    painLevel: number | null;
    injuryMechanism: string | null;
    duration: string | null;
  } {
    // Extract duration from history
    let duration = null;
    const historyTurns = phaseGroups.history || [];
    const historyText = historyTurns.map(turn => turn.text).join(' ');
    
    // Improved duration pattern matching
    const durationMatch = historyText.match(/(\d+)\s*(days?|weeks?|months?|years?)\s*ago/i);
    if (durationMatch) {
      duration = `${durationMatch[1]} ${durationMatch[2]} ago`;
    } else {
      // Try alternative patterns
      const altMatch = historyText.match(/about\s+(\d+)\s*(days?|weeks?|months?|years?)\s*ago/i);
      if (altMatch) {
        duration = `${altMatch[1]} ${altMatch[2]} ago`;
      }
    }
    
    return {
      bodyParts: context.bodyParts || [],
      painLevel: context.painLevel,
      injuryMechanism: context.injuryMechanism,
      duration
    };
  }

  private createStructuredTranscript(conversation: any[], phaseGroups: { [key: string]: any[] }): Array<{
    phase: string;
    speaker: string;
    text: string;
    timestamp?: number;
    medicalSignificance: string;
  }> {
    return conversation.map(turn => {
      // Determine phase for this turn
      let phase = 'greeting';
      for (const [phaseName, turns] of Object.entries(phaseGroups)) {
        if (turns.includes(turn)) {
          phase = phaseName;
          break;
        }
      }
      
      // Determine medical significance
      const medicalSignificance = this.assessMedicalSignificance(turn.text, phase);
      
      return {
        phase,
        speaker: turn.speaker,
        text: turn.text,
        timestamp: turn.startTime,
        medicalSignificance
      };
    });
  }

  private assessMedicalSignificance(text: string, phase: string): string {
    const lowerText = text.toLowerCase();
    
    // High significance patterns
    if (lowerText.match(/\b(pain|hurt|injury|fracture|strain|sprain|tear)\b/)) {
      return 'High - Pain/Injury related';
    }
    
    if (lowerText.match(/\b(diagnosis|assessment|what i think|looks like)\b/)) {
      return 'High - Diagnostic information';
    }
    
    if (lowerText.match(/\b(prescribe|medication|treatment|follow up)\b/)) {
      return 'High - Treatment plan';
    }
    
    if (lowerText.match(/\b(examine|look at|check|test)\b/)) {
      return 'Medium - Examination findings';
    }
    
    if (lowerText.match(/\b(when|how|what|where)\b/)) {
      return 'Medium - History gathering';
    }
    
    // Phase-based significance
    if (phase === 'assessment' || phase === 'plan') {
      return 'High - Clinical decision making';
    }
    
    if (phase === 'examination') {
      return 'Medium - Clinical findings';
    }
    
    return 'Low - General conversation';
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
  
  // Enhanced conversation flow state
  const [cleanedConversation, setCleanedConversation] = useState<Array<{
    id: number;
    speaker: string;
    text: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
    wordCount: number;
    confidence: string;
    metadata: {
      segmentCount: number;
      wasMerged: boolean;
      originalSpeakers: string[];
    };
  }>>([]);

  // Orthopedic narrative state
  const [orthopedicNarrative, setOrthopedicNarrative] = useState<{
    summary: {
      patient: string;
      chiefComplaint: string;
      history: string;
      examination: string;
      assessment: string;
      plan: string;
    };
    keyFindings: {
      bodyParts: string[];
      painLevel: number | null;
      injuryMechanism: string | null;
      duration: string | null;
    };
    conversationFlow: Array<{
      phase: string;
      timestamp: number;
      trigger: string;
    }>;
    structuredTranscript: Array<{
      phase: string;
      speaker: string;
      text: string;
      timestamp?: number;
      medicalSignificance: string;
    }>;
  } | null>(null);

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
  
  // Enhanced speaker correction processor with flow cleaning
  const transcriptionProcessorRef = useRef<EnhancedTranscriptionProcessor | null>(null);
  
  // Initialize the processor
  if (!transcriptionProcessorRef.current) {
    transcriptionProcessorRef.current = new EnhancedTranscriptionProcessor();
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
  // Update cleaned conversation when segments change
  useEffect(() => {
    if (state.mode === 'ambient' && featureFlags.speakerLabeling && transcriptionProcessorRef.current) {
      const cleaned = transcriptionProcessorRef.current.getCleanedConversation();
      setCleanedConversation(cleaned);
      
      // Generate orthopedic narrative if we have enough conversation data
      if (cleaned.length >= 3) {
        try {
          const narrative = transcriptionProcessorRef.current.generateOrthopedicNarrative();
          setOrthopedicNarrative(narrative);
        } catch (error) {
          console.warn('Failed to generate orthopedic narrative:', error);
        }
      }
    }
  }, [segments, state.mode, featureFlags.speakerLabeling]);

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
    
    // Enhanced conversation flow data
    cleanedConversation,
    
    // Orthopedic narrative data
    orthopedicNarrative,

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
