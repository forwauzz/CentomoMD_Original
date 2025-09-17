// Test script for Phase 2: Advanced Orthopedic Context Tracking
// This tests the new orthopedic context tracking features

// Mock the EnhancedTranscriptionProcessor class (simplified version for testing)
class EnhancedTranscriptionProcessor {
  constructor() {
    this.orthopedicContext = {
      currentPhase: 'greeting',
      bodyParts: [],
      painLevel: null,
      injuryMechanism: null,
      conversationFlow: []
    };
  }

  updateOrthopedicContext(text, startTime) {
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

  updateConversationPhase(text, timestamp) {
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

  extractInjuryMechanism(text) {
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

  getOrthopedicContext() {
    return { ...this.orthopedicContext };
  }

  resetOrthopedicContext() {
    this.orthopedicContext = {
      currentPhase: 'greeting',
      bodyParts: [],
      painLevel: null,
      injuryMechanism: null,
      conversationFlow: []
    };
  }
}

// Test cases for Phase 2
const testCases = [
  // Phase transitions
  { text: "I'll be your orthopedic surgeon today", expectedPhase: "greeting", expectedBodyParts: [], expectedPainLevel: null, expectedInjuryMechanism: null },
  { text: "Can you tell me what brings you in today?", expectedPhase: "chief_complaint", expectedBodyParts: [], expectedPainLevel: null, expectedInjuryMechanism: null },
  { text: "I hurt my shoulder playing basketball", expectedPhase: "chief_complaint", expectedBodyParts: ["shoulder"], expectedPainLevel: null, expectedInjuryMechanism: "playing" },
  { text: "When did this start?", expectedPhase: "history", expectedBodyParts: ["shoulder"], expectedPainLevel: null, expectedInjuryMechanism: "playing" },
  { text: "It started about 3 days ago when I fell down", expectedPhase: "history", expectedBodyParts: ["shoulder"], expectedPainLevel: null, expectedInjuryMechanism: "fell down" },
  { text: "On a scale of 1 to 10, how would you rate your pain?", expectedPhase: "history", expectedBodyParts: ["shoulder"], expectedPainLevel: null, expectedInjuryMechanism: "fell down" },
  { text: "It's about a 7 out of 10", expectedPhase: "history", expectedBodyParts: ["shoulder"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "Let me take a look at your shoulder", expectedPhase: "examination", expectedBodyParts: ["shoulder"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "Does this hurt when I press here?", expectedPhase: "examination", expectedBodyParts: ["shoulder"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "Ow, that hurts right there", expectedPhase: "examination", expectedBodyParts: ["shoulder"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "What I think is going on is a rotator cuff strain", expectedPhase: "assessment", expectedBodyParts: ["shoulder", "rotator cuff"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "I'd like to get an X-ray to rule out any fractures", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  
  // Body part extraction tests
  { text: "My back has been hurting", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  { text: "I can't move my knee properly", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back", "knee"], expectedPainLevel: 7, expectedInjuryMechanism: "fell down" },
  
  // Pain level tests
  { text: "The pain is really bad", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back", "knee"], expectedPainLevel: 8, expectedInjuryMechanism: "fell down" },
  { text: "It's moderate now", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back", "knee"], expectedPainLevel: 5, expectedInjuryMechanism: "fell down" },
  
  // Injury mechanism tests
  { text: "I heard a pop when I twisted it", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back", "knee"], expectedPainLevel: 5, expectedInjuryMechanism: "heard a pop" },
  { text: "It happened at work when I was lifting", expectedPhase: "plan", expectedBodyParts: ["shoulder", "rotator cuff", "back", "knee"], expectedPainLevel: 5, expectedInjuryMechanism: "lifting" }
];

console.log("🧪 Testing Phase 2: Advanced Orthopedic Context Tracking\n");

const processor = new EnhancedTranscriptionProcessor();
let passed = 0;
let total = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase.text}"`);
  
  // Process the text
  processor.updateOrthopedicContext(testCase.text, index * 1000);
  const context = processor.getOrthopedicContext();
  
  // Validate results
  const phasePass = context.currentPhase === testCase.expectedPhase;
  const bodyPartsPass = JSON.stringify(context.bodyParts.sort()) === JSON.stringify(testCase.expectedBodyParts.sort());
  const painLevelPass = context.painLevel === testCase.expectedPainLevel;
  const injuryMechanismPass = context.injuryMechanism === testCase.expectedInjuryMechanism;
  
  const overallPass = phasePass && bodyPartsPass && painLevelPass && injuryMechanismPass;
  
  console.log(`  Phase: ${phasePass ? '✅' : '❌'} (expected: ${testCase.expectedPhase}, got: ${context.currentPhase})`);
  console.log(`  Body Parts: ${bodyPartsPass ? '✅' : '❌'} (expected: [${testCase.expectedBodyParts.join(', ')}], got: [${context.bodyParts.join(', ')}])`);
  console.log(`  Pain Level: ${painLevelPass ? '✅' : '❌'} (expected: ${testCase.expectedPainLevel}, got: ${context.painLevel})`);
  console.log(`  Injury Mechanism: ${injuryMechanismPass ? '✅' : '❌'} (expected: ${testCase.expectedInjuryMechanism}, got: ${context.injuryMechanism})`);
  console.log(`  Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (overallPass) passed++;
});

console.log(`📊 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

if (passed === total) {
  console.log("🎉 All tests passed! Phase 2 orthopedic context tracking is working correctly.");
} else {
  console.log("⚠️  Some tests failed. Check the context tracking logic.");
}

// Test conversation flow tracking
console.log("\n🔄 Testing Conversation Flow Tracking:");
const flow = processor.getOrthopedicContext().conversationFlow;
flow.forEach((transition, index) => {
  console.log(`  ${index + 1}. ${transition.phase} (trigger: "${transition.trigger}")`);
});

console.log("\n📋 Final Context Summary:");
const finalContext = processor.getOrthopedicContext();
console.log(`  Current Phase: ${finalContext.currentPhase}`);
console.log(`  Body Parts: [${finalContext.bodyParts.join(', ')}]`);
console.log(`  Pain Level: ${finalContext.painLevel}`);
console.log(`  Injury Mechanism: ${finalContext.injuryMechanism}`);
console.log(`  Flow Transitions: ${finalContext.conversationFlow.length}`);
