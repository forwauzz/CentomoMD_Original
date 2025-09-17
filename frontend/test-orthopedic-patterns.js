// Test script for orthopedic patterns
// This tests the new orthopedic-specific speaker correction patterns

// Mock the classes (simplified version for testing)
class AdvancedSpeakerCorrection {
  constructor() {
    this.speakerPatterns = {
      doctor: {
        questions: /\b(tell me|rate on a|pain scale|does it move|does the|anything that makes|how would you|what about)\b/gi,
        medical: /\b(pain scale|radiation|0 being|10 being|scale of|examination|symptoms)\b/gi,
        instructions: /\b(let me|I want you to|can you|try to)\b/gi,
        transitions: /\b(so|um so|now|and|alright)\b/gi,
        acknowledgments: /\b(OK|alright|I see|mm-hmm)\b/gi,
        // Orthopedic-specific patterns
        orthopedic: /\b(I'll be your orthopedic surgeon|I'm Dr\.|let me just wash my hands|Can you tell me what brings you in|tell me about this pain|when did this start|how did this happen|what were you doing when|on a scale of 1 to 10|rate your pain|does it hurt when you|can you move|any numbness|have you tried|any previous injuries|let me take a look|I'm going to examine|push against my hand|does this hurt|I can feel|there's some swelling|what I think is going on|it looks like you have|I'd like to get an X-ray|we need to rule out|I'm going to prescribe|let's start with conservative treatment|follow up with me|any questions for me|does that make sense)\b/gi,
        examination: /\b(let me take a look|I'm going to examine|can you raise your arm|push against my hand|does this hurt|I can feel|there's some swelling|tenderness|stiffness)\b/gi,
        assessment: /\b(what I think is going on|it looks like you have|I'd like to get an X-ray|we need to rule out|I'm going to prescribe|let's start with conservative treatment|follow up with me)\b/gi
      },
      patient: {
        personal: /\b(I took|I tried|I have|I feel|I can't|I don't|my pain|it hurts)\b/gi,
        medications: /\b(Tylenol|Motrin|ibuprofen|aspirin|took some|tried some)\b/gi,
        symptoms: /\b(nothing helped|doesn't work|makes it worse|feels like|started when)\b/gi,
        answers: /\b(yes|no|yeah|nope|maybe|I think|probably|not really)\b/gi,
        descriptions: /\b(it's like|feels like|kind of|sort of)\b/gi,
        // Orthopedic-specific patterns
        orthopedic: /\b(I hurt my|I injured my|I twisted my|I fell on my|my back hurts|my neck is killing me|my shoulder is in pain|I have pain in my|I can't move|it's been hurting for|the pain is sharp|it feels like|it's a \d+ out of 10|it's really bad|nothing helps|it's worse when I|I was playing|I fell down|I heard a pop|it happened when I|I can't work|I haven't been able to|it's affecting my|I tried ice|I've been taking|I saw another doctor|I had physical therapy|ow|ouch|that hurts|yes, right there|that's the spot|I can feel tingling|it's tender there)\b/gi,
        pain: /\b(the pain is sharp|dull|aching|throbbing|burning|shooting|it's a \d+ out of 10|it's really bad|terrible|excruciating|unbearable|nothing helps|it's worse when I|it hurts more when)\b/gi,
        injury: /\b(I hurt my|I injured my|I twisted my|I fell on my|I was playing|I fell down|I heard a pop|it happened when I|I was doing)\b/gi
      }
    };
  }

  calculateDoctorScore(text) {
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
    
    return score;
  }

  calculatePatientScore(text) {
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

  correctSpeaker(text, originalSpeaker, context = {}) {
    const cleanText = text.trim().toLowerCase();
    
    // Calculate speaker scores
    const doctorScore = this.calculateDoctorScore(cleanText);
    const patientScore = this.calculatePatientScore(cleanText);
    
    // Determine speaker with confidence
    const scoreDiff = Math.abs(doctorScore - patientScore);
    
    if (scoreDiff > 2) {
      return doctorScore > patientScore ? 'doctor' : 'patient';
    }
    
    if (scoreDiff > 0.5) {
      return doctorScore > patientScore ? 'doctor' : 'patient';
    }
    
    // Default fallback
    return doctorScore > patientScore ? 'doctor' : 'patient';
  }
}

// Test cases
const processor = new AdvancedSpeakerCorrection();

const testCases = [
  // Doctor patterns
  { text: "I'll be your orthopedic surgeon today", expected: "doctor" },
  { text: "Can you tell me what brings you in today?", expected: "doctor" },
  { text: "On a scale of 1 to 10, how would you rate your pain?", expected: "doctor" },
  { text: "Let me take a look at your shoulder", expected: "doctor" },
  { text: "Does this hurt when I press here?", expected: "doctor" },
  { text: "I'd like to get an X-ray to rule out any fractures", expected: "doctor" },
  
  // Patient patterns
  { text: "I hurt my shoulder playing basketball", expected: "patient" },
  { text: "The pain is about a 7 out of 10", expected: "patient" },
  { text: "I can't raise my arm above my head", expected: "patient" },
  { text: "Ow, that hurts right there", expected: "patient" },
  { text: "I fell down and heard a pop", expected: "patient" },
  { text: "My back has been hurting for three days", expected: "patient" },
  
  // Mixed cases (should be corrected)
  { text: "I have a terrible headache", expected: "patient" },
  { text: "Tell me about your symptoms", expected: "doctor" },
  { text: "Nothing has helped the pain", expected: "patient" },
  { text: "Let me examine your knee", expected: "doctor" }
];

console.log("🧪 Testing Orthopedic Speaker Correction Patterns\n");

let passed = 0;
let total = testCases.length;

testCases.forEach((testCase, index) => {
  const result = processor.correctSpeaker(testCase.text, 'unknown');
  const success = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${success ? '✅' : '❌'}`);
  console.log(`  Text: "${testCase.text}"`);
  console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
  console.log(`  Doctor Score: ${processor.calculateDoctorScore(testCase.text.toLowerCase())}`);
  console.log(`  Patient Score: ${processor.calculatePatientScore(testCase.text.toLowerCase())}`);
  console.log('');
  
  if (success) passed++;
});

console.log(`\n📊 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

if (passed === total) {
  console.log("🎉 All tests passed! Orthopedic patterns are working correctly.");
} else {
  console.log("⚠️  Some tests failed. Check the patterns and scoring logic.");
}
