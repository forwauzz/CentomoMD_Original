# Mode 3 Transcribe Feature Implementation Guide

## Overview

Mode 3 (Ambient/Transcribe) is designed for long-form capture with speaker diarization, providing full AI processing with multi-speaker identification. This document outlines the current implementation status and what needs to be completed.

## Current Implementation Status

### ✅ **IMPLEMENTED COMPONENTS**

#### **1. Mode Configuration**
```typescript
// backend/src/config/modes.ts
'mode3': {
  id: 'mode3',
  name: 'Ambient',
  nameEn: 'Ambient',
  description: 'Capture longue durée avec diarisation',
  descriptionEn: 'Long-form capture with diarization',
  processingType: 'batch',
  supportedSections: ['section_7', 'section_8', 'section_11'],
  supportedLanguages: ['fr', 'en'],
  capabilities: {
    voiceCommands: false,
    verbatimSupport: false,
    aiFormatting: true,
    postProcessing: true,
    realtimeProcessing: false
  },
  configuration: {
    maxProcessingTime: 300,
    batchSize: 10,
    retryAttempts: 1,
    fallbackMode: 'mode2'
  }
}
```

#### **2. AWS Transcribe Configuration**
```typescript
// backend/src/index.ts - getModeSpecificConfig function
case 'ambient':
  return {
    ...config,
    show_speaker_labels: true,
    partial_results_stability: 'medium' as const
    // vocabulary_name omitted - will be undefined
  };
```

#### **3. Frontend Mode Selection**
```typescript
// frontend/src/hooks/useTranscription.ts
ws.send(JSON.stringify({ 
  type: 'start_transcription', 
  languageCode, 
  sampleRate: 16000,
  mode: state.mode,  // Mode 3 is passed to backend
  sessionId 
}));
```

#### **4. WebSocket Integration**
```typescript
// backend/src/index.ts - WebSocket message handling
const modeConfig = getModeSpecificConfig(msg.mode || 'smart_dictation', {
  language_code: msg.languageCode, 
  media_sample_rate_hz: msg.sampleRate ?? 16000
});
```

#### **5. Template Compatibility**
```typescript
// frontend/src/config/template-config.ts
compatibleModes: ['mode1', 'mode2', 'mode3']
```

### ⚠️ **PARTIALLY IMPLEMENTED**

#### **1. Mode-Specific AWS Configuration**
- **Status**: Configuration exists but not fully utilized
- **Issue**: All modes currently use similar AWS Transcribe settings
- **Required**: Mode 3 should use medium stability, speaker labels enabled

#### **2. Speaker Diarization Processing**
- **Status**: AWS provides speaker labels but not processed
- **Issue**: Speaker attribution (PATIENT vs CLINICIAN) not implemented
- **Required**: Post-processing to identify and format speaker roles

### ❌ **NOT IMPLEMENTED**

#### **1. Mode3Formatter Class**
```typescript
// MISSING: backend/src/services/formatter/mode3.ts
export class Mode3Formatter {
  async processMultiSpeaker(transcribeJson: any, section: '7'|'8'|'11', language: 'fr'|'en') {
    // 1. Merge tokens by speaker
    // 2. Strip timestamps and remove fillers
    // 3. Role hinting (spk_0=worker, spk_1=clinician)
    // 4. Build narrative string
    // 5. Send through Mode 2 formatter chain
    return { narrative, formatted, issues };
  }
}
```

#### **2. Multi-Speaker Processing Pipeline**
- Speaker token merging
- Timestamp removal
- Filler word removal
- Role-based formatting
- Narrative construction

#### **3. Processing Orchestrator Integration**
```typescript
// MISSING: Integration in ProcessingOrchestrator.ts
private async processMode3Formatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  // Mode 3 specific processing logic
}
```

## Required Implementation

### **Phase 1: Create Mode3Formatter Class**

#### **File**: `backend/src/services/formatter/mode3.ts`

```typescript
import { Mode2Formatter } from './mode2.js';

export interface Mode3FormattingOptions {
  language: 'fr' | 'en';
  section: '7' | '8' | '11';
  case_id?: string;
  selected_sections?: string[];
  extra_dictation?: string;
  templateCombo?: boolean;
  verbatimSupport?: boolean;
  voiceCommandsSupport?: boolean;
}

export interface Mode3FormattingResult {
  formatted: string;
  issues: string[];
  sources_used?: string[];
  confidence_score?: number;
  speaker_attribution?: {
    patient: string[];
    clinician: string[];
  };
}

export interface SpeakerToken {
  text: string;
  speaker: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

export class Mode3Formatter {
  private mode2Formatter: Mode2Formatter;

  constructor() {
    this.mode2Formatter = new Mode2Formatter();
  }

  /**
   * Process multi-speaker transcription with diarization
   */
  async format(
    transcript: string, 
    options: Mode3FormattingOptions
  ): Promise<Mode3FormattingResult> {
    try {
      console.log('Mode 3: Processing multi-speaker transcription');

      // Step 1: Parse speaker tokens from AWS Transcribe output
      const speakerTokens = this.parseSpeakerTokens(transcript);
      
      // Step 2: Merge tokens by speaker and clean up
      const cleanedTokens = this.mergeAndCleanTokens(speakerTokens);
      
      // Step 3: Identify speaker roles (patient vs clinician)
      const roleAttribution = this.identifySpeakerRoles(cleanedTokens);
      
      // Step 4: Build narrative with speaker attribution
      const narrative = this.buildNarrative(cleanedTokens, roleAttribution);
      
      // Step 5: Process through Mode 2 formatter for AI enhancement
      const mode2Result = await this.mode2Formatter.format(narrative, {
        language: options.language,
        section: options.section,
        case_id: options.case_id,
        selected_sections: options.selected_sections,
        extra_dictation: options.extra_dictation,
        templateCombo: options.templateCombo,
        verbatimSupport: options.verbatimSupport,
        voiceCommandsSupport: options.voiceCommandsSupport
      });

      return {
        formatted: mode2Result.formatted,
        issues: mode2Result.issues,
        sources_used: mode2Result.sources_used,
        confidence_score: mode2Result.confidence_score,
        speaker_attribution: roleAttribution
      };

    } catch (error) {
      console.error('Mode 3 formatting error:', error);
      return {
        formatted: transcript,
        issues: [`Mode 3 processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        confidence_score: 0
      };
    }
  }

  /**
   * Parse speaker tokens from AWS Transcribe JSON output
   */
  private parseSpeakerTokens(transcript: string): SpeakerToken[] {
    try {
      // AWS Transcribe provides speaker labels in this format:
      // "spk_0: Hello, how are you today?"
      // "spk_1: I'm doing well, thank you."
      
      const tokens: SpeakerToken[] = [];
      const lines = transcript.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const match = line.match(/^(spk_\d+):\s*(.+)$/);
        if (match) {
          const [, speaker, text] = match;
          tokens.push({
            text: text.trim(),
            speaker,
            start_time: 0, // AWS doesn't provide timestamps in this format
            end_time: 0,
            confidence: 0.9 // Default confidence
          });
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error parsing speaker tokens:', error);
      return [];
    }
  }

  /**
   * Merge tokens by speaker and clean up
   */
  private mergeAndCleanTokens(tokens: SpeakerToken[]): SpeakerToken[] {
    const merged: { [speaker: string]: SpeakerToken } = {};
    
    for (const token of tokens) {
      if (merged[token.speaker]) {
        // Merge with existing speaker token
        merged[token.speaker].text += ' ' + token.text;
        merged[token.speaker].end_time = token.end_time;
        merged[token.speaker].confidence = Math.min(merged[token.speaker].confidence, token.confidence);
      } else {
        merged[token.speaker] = { ...token };
      }
    }
    
    // Clean up merged tokens
    const cleaned: SpeakerToken[] = [];
    for (const token of Object.values(merged)) {
      // Remove filler words and clean up text
      token.text = this.cleanText(token.text);
      if (token.text.trim().length > 0) {
        cleaned.push(token);
      }
    }
    
    return cleaned;
  }

  /**
   * Clean text by removing fillers and normalizing
   */
  private cleanText(text: string): string {
    // Remove common filler words
    const fillers = [
      'um', 'uh', 'er', 'ah', 'mm', 'hmm',
      'euh', 'ben', 'alors', 'donc', 'voilà'
    ];
    
    let cleaned = text;
    for (const filler of fillers) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '');
    }
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Identify speaker roles (patient vs clinician)
   */
  private identifySpeakerRoles(tokens: SpeakerToken[]): { patient: string[]; clinician: string[] } {
    const patient: string[] = [];
    const clinician: string[] = [];
    
    // Simple heuristic: first speaker is usually patient, second is clinician
    // In a real implementation, this would use more sophisticated analysis
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (i === 0 || token.speaker === 'spk_0') {
        patient.push(token.text);
      } else {
        clinician.push(token.text);
      }
    }
    
    return { patient, clinician };
  }

  /**
   * Build narrative with speaker attribution
   */
  private buildNarrative(tokens: SpeakerToken[], roleAttribution: { patient: string[]; clinician: string[] }): string {
    let narrative = '';
    
    // Build narrative with clear speaker attribution
    if (roleAttribution.patient.length > 0) {
      narrative += `PATIENT: ${roleAttribution.patient.join(' ')}\n\n`;
    }
    
    if (roleAttribution.clinician.length > 0) {
      narrative += `CLINICIAN: ${roleAttribution.clinician.join(' ')}\n\n`;
    }
    
    return narrative.trim();
  }
}
```

### **Phase 2: Integrate with Processing Orchestrator**

#### **File**: `backend/src/services/processing/ProcessingOrchestrator.ts`

```typescript
// Add to existing ProcessingOrchestrator class

/**
 * Process Mode 3 Ambient formatter template
 */
private async processMode3Formatter(content: string, template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  const correlationId = request.correlationId || 'no-correlation-id';
  
  try {
    console.log(`[${correlationId}] Processing Mode 3 Ambient formatter template: ${template.id}`);
    
    // Import Mode3Formatter
    const { Mode3Formatter } = await import('../../services/formatter/mode3.js');
    const formatter = new Mode3Formatter();
    
    // Process with Mode 3 formatter
    const result = await formatter.format(content, {
      language: request.language as 'fr' | 'en',
      section: template.section as '7' | '8' | '11',
      case_id: request.caseId,
      selected_sections: request.selectedSections,
      extra_dictation: request.extraDictation,
      templateCombo: request.templateCombo,
      verbatimSupport: request.verbatimSupport,
      voiceCommandsSupport: request.voiceCommandsSupport
    });
    
    const processedContent = result.formatted;
    
    // Log any issues or suggestions
    if (result.issues && result.issues.length > 0) {
      console.warn(`[${correlationId}] Mode 3 formatting issues:`, result.issues);
    }
    
    if (result.speaker_attribution) {
      console.info(`[${correlationId}] Speaker attribution:`, {
        patient_segments: result.speaker_attribution.patient.length,
        clinician_segments: result.speaker_attribution.clinician.length
      });
    }
    
    console.log(`[${correlationId}] Mode 3 formatting completed`, {
      originalLength: content.length,
      processedLength: processedContent.length,
      templateId: template.id,
      hasIssues: result.issues ? result.issues.length > 0 : false,
      confidenceScore: result.confidence_score
    });
    
    return processedContent;
  } catch (error) {
    console.error(`[${correlationId}] Mode 3 formatting error:`, error);
    // Return original content if formatting fails
    return content;
  }
}

// Update the processTemplate method to include Mode 3
private async processTemplate(template: TemplateConfig, request: ProcessingRequest): Promise<string> {
  // ... existing code ...
  
  switch (template.processingMode) {
    case 'mode1':
      return this.processWordForWordFormatter(content, template, request);
    case 'mode2':
      return this.processMode2Formatter(content, template, request);
    case 'mode3':
      return this.processMode3Formatter(content, template, request);
    default:
      console.warn(`[${request.correlationId}] Unknown processing mode: ${template.processingMode}`);
      return content;
  }
}
```

### **Phase 3: Update Template Configuration**

#### **File**: `backend/src/config/templates.ts`

```typescript
// Add Mode 3 compatible templates
{
  id: 'section7_mode3_ambient',
  name: 'Section 7 - Mode 3 Ambient',
  description: 'Section 7 with multi-speaker diarization',
  section: '7',
  processingMode: 'mode3',
  compatibleModes: ['mode3'],
  supportedLanguages: ['fr', 'en'],
  // ... other template properties
}
```

### **Phase 4: Frontend Integration**

#### **File**: `frontend/src/components/transcription/TranscriptionInterface.tsx`

```typescript
// Add Mode 3 specific UI elements
{state.mode === 'mode3' && (
  <div className="mode3-indicators">
    <div className="speaker-indicators">
      <span className="speaker-patient">👤 Patient</span>
      <span className="speaker-clinician">👨‍⚕️ Clinician</span>
    </div>
    <div className="ambient-mode-info">
      <p>Mode 3: Long-form capture with speaker diarization</p>
    </div>
  </div>
)}
```

## Testing Strategy

### **Unit Tests**

#### **File**: `backend/test-mode3-formatter.js`

```javascript
const { Mode3Formatter } = require('./dist/src/services/formatter/mode3.js');

async function testMode3Formatter() {
  console.log('Testing Mode 3 Formatter...');
  
  const formatter = new Mode3Formatter();
  
  // Test multi-speaker input
  const multiSpeakerInput = `
spk_0: Bonjour docteur, j'ai mal au dos depuis une semaine.
spk_1: Bonjour, pouvez-vous me décrire la douleur?
spk_0: C'est une douleur aiguë dans le bas du dos, côté droit.
spk_1: Avez-vous eu un traumatisme récent?
spk_0: Oui, j'ai soulevé une charge lourde au travail.
  `;
  
  const result = await formatter.format(multiSpeakerInput, {
    language: 'fr',
    section: '7'
  });
  
  console.log('Mode 3 Result:', result);
  console.log('✅ Mode 3 test completed!');
}

testMode3Formatter().catch(console.error);
```

### **Integration Tests**

#### **File**: `backend/test-mode3-integration.js`

```javascript
// Test Mode 3 with real AWS Transcribe output
const testMode3Integration = async () => {
  // 1. Start transcription in Mode 3
  // 2. Send multi-speaker audio
  // 3. Verify speaker diarization
  // 4. Check AI formatting output
  // 5. Validate template processing
};
```

## Implementation Timeline

### **Week 1: Core Implementation**
- [ ] Create `Mode3Formatter` class
- [ ] Implement speaker token parsing
- [ ] Add speaker role identification
- [ ] Build narrative construction

### **Week 2: Integration**
- [ ] Integrate with `ProcessingOrchestrator`
- [ ] Update template configurations
- [ ] Add frontend Mode 3 indicators
- [ ] Test with existing templates

### **Week 3: Testing & Refinement**
- [ ] Unit tests for Mode 3 formatter
- [ ] Integration tests with AWS Transcribe
- [ ] Performance optimization
- [ ] Error handling improvements

### **Week 4: Documentation & Deployment**
- [ ] Update API documentation
- [ ] Create user guides
- [ ] Performance monitoring
- [ ] Production deployment

## Success Criteria

### **Functional Requirements**
- [ ] Multi-speaker transcription with diarization
- [ ] Speaker role identification (patient vs clinician)
- [ ] AI formatting through Mode 2 integration
- [ ] Template compatibility for Sections 7, 8, 11
- [ ] Error handling and fallback mechanisms

### **Performance Requirements**
- [ ] Process multi-speaker content within 300 seconds
- [ ] Maintain 90%+ accuracy for speaker attribution
- [ ] Handle batch processing of up to 10 segments
- [ ] Graceful degradation on processing failures

### **Quality Requirements**
- [ ] Comprehensive unit test coverage
- [ ] Integration tests with real AWS Transcribe output
- [ ] Documentation for all public APIs
- [ ] Error logging and monitoring

## Dependencies

### **External Dependencies**
- AWS Transcribe Streaming API
- Mode 2 Formatter (for AI processing)
- Processing Orchestrator
- Template system

### **Internal Dependencies**
- WebSocket infrastructure
- Audio processing pipeline
- Template configuration system
- Error handling framework

## Risk Mitigation

### **Technical Risks**
- **AWS Transcribe accuracy**: Implement confidence scoring and fallback
- **Speaker identification errors**: Use multiple heuristics and user feedback
- **Processing timeouts**: Implement chunking and progress indicators
- **Memory usage**: Optimize token processing and cleanup

### **User Experience Risks**
- **Complex UI**: Provide clear Mode 3 indicators and help text
- **Processing delays**: Show progress indicators and estimated completion
- **Error recovery**: Implement retry mechanisms and clear error messages

## Conclusion

Mode 3 Transcribe feature is approximately 60% implemented with the core infrastructure in place. The main missing components are:

1. **Mode3Formatter class** - Core processing logic
2. **Speaker diarization processing** - Multi-speaker handling
3. **Processing Orchestrator integration** - Template processing
4. **Frontend enhancements** - Mode 3 specific UI

With the implementation plan outlined above, Mode 3 can be completed within 4 weeks, providing a robust multi-speaker transcription solution with AI-powered formatting and template integration.
