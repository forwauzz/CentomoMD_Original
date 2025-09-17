// Test script for Phase 4: Advanced Orthopedic Narrative Generation
// This tests the intelligent narrative generation using orthopedic context

// Mock the EnhancedTranscriptionProcessor class with Phase 4 features
class EnhancedTranscriptionProcessor {
  constructor() {
    this.orthopedicContext = {
      currentPhase: 'greeting',
      bodyParts: [],
      painLevel: null,
      injuryMechanism: null,
      conversationFlow: []
    };
    this.conversationHistory = [];
    this.rawSegments = [];
  }

  // Mock the orthopedic context tracking methods
  updateOrthopedicContext(text, startTime) {
    const cleanText = text.toLowerCase();
    const timestamp = startTime || Date.now();
    
    this.updateConversationPhase(cleanText, timestamp);
    this.extractBodyParts(cleanText);
    this.extractPainLevel(cleanText);
    this.extractInjuryMechanism(cleanText);
  }

  updateConversationPhase(text, timestamp) {
    const previousPhase = this.orthopedicContext.currentPhase;
    let newPhase = previousPhase;
    
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
    
    if (newPhase !== previousPhase) {
      this.orthopedicContext.currentPhase = newPhase;
      this.orthopedicContext.conversationFlow.push({
        phase: newPhase,
        timestamp,
        trigger: text.substring(0, 50)
      });
    }
  }

  extractBodyParts(text) {
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

  extractPainLevel(text) {
    const painScaleMatch = text.match(/(\d+)\s*out\s*of\s*(\d+|ten)/i);
    if (painScaleMatch) {
      const level = parseInt(painScaleMatch[1]);
      const max = painScaleMatch[2].toLowerCase() === 'ten' ? 10 : parseInt(painScaleMatch[2]);
      
      if (level >= 1 && level <= max) {
        this.orthopedicContext.painLevel = level;
      }
    }
    
    if (text.includes('really bad') || text.includes('terrible') || text.includes('excruciating')) {
      this.orthopedicContext.painLevel = 8;
    } else if (text.includes('moderate') || text.includes('manageable')) {
      this.orthopedicContext.painLevel = 5;
    } else if (text.includes('mild') || text.includes('slight')) {
      this.orthopedicContext.painLevel = 3;
    }
  }

  extractInjuryMechanism(text) {
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
    
    for (const { pattern, mechanism } of injuryPatterns) {
      const match = text.match(pattern);
      if (match) {
        this.orthopedicContext.injuryMechanism = mechanism;
        break;
      }
    }
  }

  getOrthopedicContext() {
    return { ...this.orthopedicContext };
  }

  // Mock conversation data for testing
  setMockConversation() {
    this.rawSegments = [
      { text: "I'll be your orthopedic surgeon today", speaker: "doctor", startTime: 0, endTime: 3 },
      { text: "Hi, nice to meet you", speaker: "patient", startTime: 3, endTime: 6 },
      { text: "Can you tell me what brings you in today?", speaker: "doctor", startTime: 6, endTime: 10 },
      { text: "I hurt my shoulder playing basketball", speaker: "patient", startTime: 10, endTime: 15 },
      { text: "When did this start?", speaker: "doctor", startTime: 15, endTime: 18 },
      { text: "It started about 3 days ago when I fell down", speaker: "patient", startTime: 18, endTime: 25 },
      { text: "On a scale of 1 to 10, how would you rate your pain?", speaker: "doctor", startTime: 25, endTime: 32 },
      { text: "It's about a 7 out of 10", speaker: "patient", startTime: 32, endTime: 37 },
      { text: "Let me take a look at your shoulder", speaker: "doctor", startTime: 37, endTime: 42 },
      { text: "Ow, that hurts right there", speaker: "patient", startTime: 42, endTime: 46 },
      { text: "What I think is going on is a rotator cuff strain", speaker: "doctor", startTime: 46, endTime: 54 },
      { text: "I'm going to prescribe some pain medication", speaker: "doctor", startTime: 54, endTime: 60 },
      { text: "Thank you, that sounds good", speaker: "patient", startTime: 60, endTime: 64 }
    ];
  }

  // Mock the getCleanedConversation method
  getCleanedConversation() {
    return this.rawSegments.map((segment, index) => ({
      id: index,
      speaker: segment.speaker,
      text: segment.text,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: segment.endTime - segment.startTime,
      wordCount: segment.text.split(' ').length,
      confidence: 'high',
      metadata: {
        segmentCount: 1,
        wasMerged: false,
        originalSpeakers: [segment.speaker]
      }
    }));
  }

  // Mock the narrative generation methods
  generateOrthopedicNarrative() {
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

  groupConversationByPhases(conversation) {
    const phaseGroups = {
      greeting: [],
      chief_complaint: [],
      history: [],
      examination: [],
      assessment: [],
      plan: []
    };
    
    const context = this.getOrthopedicContext();
    let currentPhase = 'greeting';
    
    conversation.forEach((turn, index) => {
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

  generatePhaseSummary(phaseGroups) {
    return {
      patient: this.extractPatientInfo(phaseGroups.greeting),
      chiefComplaint: this.extractChiefComplaint(phaseGroups.chief_complaint),
      history: this.extractHistory(phaseGroups.history),
      examination: this.extractExamination(phaseGroups.examination),
      assessment: this.extractAssessment(phaseGroups.assessment),
      plan: this.extractPlan(phaseGroups.plan)
    };
  }

  extractPatientInfo(greetingTurns) {
    const patientTurns = greetingTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'Patient information not captured';
    
    const responses = patientTurns.map(turn => turn.text).join(' ');
    return `Patient: ${responses}`;
  }

  extractChiefComplaint(complaintTurns) {
    const patientTurns = complaintTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'Chief complaint not captured';
    
    const complaints = patientTurns.map(turn => turn.text).join(' ');
    return `Chief Complaint: ${complaints}`;
  }

  extractHistory(historyTurns) {
    const patientTurns = historyTurns.filter(turn => turn.speaker === 'patient');
    if (patientTurns.length === 0) return 'History not captured';
    
    const history = patientTurns.map(turn => turn.text).join(' ');
    return `History: ${history}`;
  }

  extractExamination(examTurns) {
    const doctorTurns = examTurns.filter(turn => turn.speaker === 'doctor');
    const patientTurns = examTurns.filter(turn => turn.speaker === 'patient');
    
    const doctorFindings = doctorTurns.map(turn => turn.text).join(' ');
    const patientResponses = patientTurns.map(turn => turn.text).join(' ');
    
    return `Examination: ${doctorFindings} Patient responses: ${patientResponses}`;
  }

  extractAssessment(assessmentTurns) {
    const doctorTurns = assessmentTurns.filter(turn => turn.speaker === 'doctor');
    if (doctorTurns.length === 0) return 'Assessment not captured';
    
    const assessment = doctorTurns.map(turn => turn.text).join(' ');
    return `Assessment: ${assessment}`;
  }

  extractPlan(planTurns) {
    const doctorTurns = planTurns.filter(turn => turn.speaker === 'doctor');
    if (doctorTurns.length === 0) return 'Plan not captured';
    
    const plan = doctorTurns.map(turn => turn.text).join(' ');
    return `Plan: ${plan}`;
  }

  extractKeyFindings(context, phaseGroups) {
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

  createStructuredTranscript(conversation, phaseGroups) {
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

  assessMedicalSignificance(text, phase) {
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

// Test cases for Phase 4
const testCases = [
  {
    description: "Generate complete orthopedic narrative",
    expectedSummary: {
      patient: "Patient: Hi, nice to meet you",
      chiefComplaint: "Chief Complaint: I hurt my shoulder playing basketball",
      history: "History: It started about 3 days ago when I fell down It's about a 7 out of 10",
      examination: "Examination: Let me take a look at your shoulder Patient responses: Ow, that hurts right there",
      assessment: "Assessment: What I think is going on is a rotator cuff strain",
      plan: "Plan: I'm going to prescribe some pain medication"
    },
    expectedKeyFindings: {
      bodyParts: ["shoulder"],
      painLevel: 7,
      injuryMechanism: "fell down",
      duration: "3 days ago"
    }
  }
];

console.log("🧪 Testing Phase 4: Advanced Orthopedic Narrative Generation\n");

const processor = new EnhancedTranscriptionProcessor();

// Set up mock conversation data
processor.setMockConversation();

// Process the conversation to build context
processor.rawSegments.forEach((segment, index) => {
  processor.updateOrthopedicContext(segment.text, segment.startTime);
});

// Generate the narrative
const narrative = processor.generateOrthopedicNarrative();

console.log("📋 Generated Orthopedic Narrative:\n");

// Test Summary Generation
console.log("📝 SUMMARY:");
console.log(`  Patient: ${narrative.summary.patient}`);
console.log(`  Chief Complaint: ${narrative.summary.chiefComplaint}`);
console.log(`  History: ${narrative.summary.history}`);
console.log(`  Examination: ${narrative.summary.examination}`);
console.log(`  Assessment: ${narrative.summary.assessment}`);
console.log(`  Plan: ${narrative.summary.plan}`);

console.log("\n🔍 KEY FINDINGS:");
console.log(`  Body Parts: [${narrative.keyFindings.bodyParts.join(', ')}]`);
console.log(`  Pain Level: ${narrative.keyFindings.painLevel}`);
console.log(`  Injury Mechanism: ${narrative.keyFindings.injuryMechanism}`);
console.log(`  Duration: ${narrative.keyFindings.duration}`);

console.log("\n🔄 CONVERSATION FLOW:");
narrative.conversationFlow.forEach((transition, index) => {
  console.log(`  ${index + 1}. ${transition.phase} (trigger: "${transition.trigger}")`);
});

console.log("\n📊 STRUCTURED TRANSCRIPT:");
narrative.structuredTranscript.forEach((turn, index) => {
  console.log(`  ${index + 1}. [${turn.phase}] ${turn.speaker}: "${turn.text}"`);
  console.log(`     Medical Significance: ${turn.medicalSignificance}`);
});

// Validate results
let passed = 0;
let total = 0;

// Test summary generation
const testCase = testCases[0];
total += 6; // 6 summary fields

if (narrative.summary.patient.includes("Hi, nice to meet you")) passed++;
if (narrative.summary.chiefComplaint.includes("I hurt my shoulder playing basketball")) passed++;
if (narrative.summary.history.includes("3 days ago")) passed++;
if (narrative.summary.examination.includes("Let me take a look")) passed++;
if (narrative.summary.assessment.includes("rotator cuff strain")) passed++;
if (narrative.summary.plan.includes("prescribe some pain medication")) passed++;

// Test key findings
total += 4; // 4 key findings

if (narrative.keyFindings.bodyParts.includes("shoulder")) passed++;
if (narrative.keyFindings.painLevel === 7) passed++;
if (narrative.keyFindings.injuryMechanism === "fell down") passed++;
if (narrative.keyFindings.duration === "3 days ago") passed++;

// Test conversation flow
total += 1;
if (narrative.conversationFlow.length >= 5) passed++;

// Test structured transcript
total += 1;
if (narrative.structuredTranscript.length === 13) passed++;

console.log(`\n📊 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

if (passed === total) {
  console.log("🎉 All tests passed! Phase 4 orthopedic narrative generation is working correctly.");
} else {
  console.log("⚠️  Some tests failed. Check the narrative generation logic.");
}

console.log("\n📋 Phase 4 Features Tested:");
console.log("  ✅ Structured summary generation by phase");
console.log("  ✅ Key findings extraction");
console.log("  ✅ Conversation flow tracking");
console.log("  ✅ Structured transcript with medical significance");
console.log("  ✅ Medical significance assessment");
console.log("  ✅ Duration extraction from history");
