# Diarization Fix Implementation Plan

## 🎯 **Objective**
Fix AWS Transcribe streaming diarization to work correctly with ambient mode only, based on AWS documentation findings.

## 🔍 **Root Cause Analysis**
1. **Wrong Parameter Names**: Using `MaxSpeakerLabels` (not available for streaming)
2. **Wrong Response Format**: Expecting batch format instead of streaming format
3. **Suboptimal Configuration**: Using `'medium'` stability instead of `'high'`

## 📋 **Surgical Implementation Plan**

### **Phase 1: Fix AWS Parameter Configuration**
**File:** `backend/src/services/transcriptionService.ts`
**Lines:** 57-69
**Change:** Remove `MaxSpeakerLabels` parameter entirely

**Current Code:**
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: (config.language_code || 'fr-CA') as any,
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,
  ShowSpeakerLabel: config.show_speaker_labels || false,
  ...(config.max_speaker_labels && { MaxSpeakerLabels: config.max_speaker_labels }), // ❌ REMOVE
  EnablePartialResultsStabilization: true,
  PartialResultsStability: (config.partial_results_stability || 'high') as any,
  ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
};
```

**Fixed Code:**
```typescript
const cmdInput: StartStreamTranscriptionCommandInput = {
  LanguageCode: (config.language_code || 'fr-CA') as any,
  MediaEncoding: 'pcm',
  MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
  AudioStream: audioIterable,
  ShowSpeakerLabel: config.show_speaker_labels || false,
  // MaxSpeakerLabels removed - not available for streaming
  EnablePartialResultsStabilization: true,
  PartialResultsStability: (config.partial_results_stability || 'high') as any,
  ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
};
```

### **Phase 2: Update Mode Configuration**
**File:** `backend/src/index.ts`
**Lines:** 42-48
**Change:** Update ambient mode to use `'high'` stability

**Current Code:**
```typescript
case 'ambient':
  return {
    ...config,
    show_speaker_labels: true,
    partial_results_stability: 'medium' as const
    // vocabulary_name omitted - will be undefined
  };
```

**Fixed Code:**
```typescript
case 'ambient':
  return {
    ...config,
    show_speaker_labels: true,
    partial_results_stability: 'high' as const  // ✅ Better for diarization
    // vocabulary_name omitted - will be undefined
  };
```

### **Phase 3: Fix S1 Ingest Response Handling**
**File:** `backend/src/services/transcriptionService.ts`
**Lines:** 155-234
**Change:** Update AWS result building to handle streaming format

**Current Code:**
```typescript
// Store complete AWS result for Mode 3 pipeline
const awsResult: any = {
  results: {
    transcripts: [],
    items: []
  },
  speaker_labels: {
    speakers: 0,
    segments: []
  }
};
```

**Fixed Code:**
```typescript
// Store complete AWS result for Mode 3 pipeline (streaming format)
const awsResult: any = {
  results: {
    transcripts: [],
    items: []
  }
  // Note: speaker_labels not needed for streaming - speaker info is in items
};
```

### **Phase 4: Update S1 Ingest Logic**
**File:** `backend/src/services/pipeline/stages/s1_ingest_aws.ts`
**Lines:** 20-28
**Change:** Update validation to handle streaming format

**Current Code:**
```typescript
if (!awsResult.speaker_labels?.segments || !awsResult.results?.items) {
  throw new Error('Invalid AWS Transcribe result: missing speaker_labels or results');
}
```

**Fixed Code:**
```typescript
if (!awsResult.results?.items) {
  throw new Error('Invalid AWS Transcribe result: missing results items');
}

// For streaming, check if any items have speaker labels
const hasSpeakerLabels = awsResult.results.items.some(item => item.Speaker);
if (!hasSpeakerLabels) {
  throw new Error('Invalid AWS Transcribe result: no speaker labels found in items');
}
```

### **Phase 5: Update S1 Parse Logic**
**File:** `backend/src/services/pipeline/stages/s1_ingest_aws.ts`
**Lines:** 59-89
**Change:** Update parsing to handle streaming format with speaker info in items

**Current Code:**
```typescript
private parseSegmentsToTurns(
  segments: AWSSpeakerSegment[], 
  items: AWSTranscriptItem[]
): IrTurn[] {
  // Current logic expects segments array
}
```

**Fixed Code:**
```typescript
private parseItemsToTurns(items: AWSTranscriptItem[]): IrTurn[] {
  const turns: IrTurn[] = [];
  let currentTurn: IrTurn | null = null;
  
  for (const item of items) {
    if (item.Speaker) {
      // New speaker - start new turn
      if (currentTurn) {
        turns.push(currentTurn);
      }
      
      currentTurn = {
        speaker: item.Speaker,
        startTime: parseFloat(item.start_time || '0'),
        endTime: parseFloat(item.end_time || '0'),
        text: item.alternatives[0]?.content || '',
        confidence: parseFloat(item.alternatives[0]?.confidence || '0'),
        isPartial: false
      };
    } else if (currentTurn) {
      // Continue current turn
      currentTurn.text += item.alternatives[0]?.content || '';
      currentTurn.endTime = parseFloat(item.end_time || currentTurn.endTime.toString());
      currentTurn.confidence = (currentTurn.confidence + parseFloat(item.alternatives[0]?.confidence || '0')) / 2;
    }
  }
  
  if (currentTurn) {
    turns.push(currentTurn);
  }
  
  return turns;
}
```

### **Phase 6: Update S1 Execute Method**
**File:** `backend/src/services/pipeline/stages/s1_ingest_aws.ts`
**Lines:** 17-57
**Change:** Update to use new parsing method

**Current Code:**
```typescript
const turns = this.parseSegmentsToTurns(
  awsResult.speaker_labels.segments,
  awsResult.results.items
);
```

**Fixed Code:**
```typescript
const turns = this.parseItemsToTurns(awsResult.results.items);
```

### **Phase 7: Update Test Script**
**File:** `test-diarization.js`
**Change:** Update mock data to use streaming format

**Current Mock Data:**
```javascript
const mockAWSResult = {
  "results": { /* ... */ },
  "speaker_labels": {
    "segments": [ /* ... */ ]
  }
};
```

**Fixed Mock Data:**
```javascript
const mockAWSResult = {
  "results": {
    "transcripts": [
      {
        "transcript": "Bonjour docteur, j'ai mal au dos depuis trois semaines. Oui, pouvez-vous me décrire la douleur? C'est une douleur aiguë dans le bas du dos."
      }
    ],
    "items": [
      {
        "start_time": "0.0",
        "end_time": "2.5",
        "alternatives": [
          {
            "confidence": "0.95",
            "content": "Bonjour"
          }
        ],
        "type": "pronunciation",
        "Speaker": "spk_0"  // ✅ Speaker info in items
      },
      // ... more items with Speaker field
    ]
  }
  // Note: No speaker_labels section for streaming
};
```

## 🧪 **Testing Strategy**

### **Test 1: Parameter Validation**
- Verify `MaxSpeakerLabels` is removed from AWS config
- Confirm `ShowSpeakerLabel: true` for ambient mode
- Confirm `PartialResultsStability: 'high'` for ambient mode

### **Test 2: Response Format**
- Test S1 ingest with streaming format
- Verify speaker info is extracted from `Items[].Speaker`
- Confirm turns are properly parsed

### **Test 3: End-to-End Pipeline**
- Test complete S1-S5 pipeline with streaming format
- Verify role mapping works with new turn structure
- Confirm narrative generation produces correct output

### **Test 4: Real AWS Streaming**
- Test with actual AWS streaming transcription
- Verify speaker diarization works in ambient mode
- Confirm other modes don't have speaker labels

## 📊 **Success Criteria**

1. ✅ **AWS Parameters**: No `MaxSpeakerLabels` in streaming config
2. ✅ **Response Format**: S1 ingest handles streaming format correctly
3. ✅ **Speaker Detection**: Speaker labels extracted from `Items[].Speaker`
4. ✅ **Mode Isolation**: Diarization only works in ambient mode
5. ✅ **Pipeline Flow**: S1-S5 pipeline processes streaming format
6. ✅ **Real Testing**: Works with actual AWS streaming

## 🚀 **Implementation Order**

1. **Phase 1**: Fix AWS parameters (transcriptionService.ts)
2. **Phase 2**: Update mode configuration (index.ts)
3. **Phase 3**: Fix AWS result building (transcriptionService.ts)
4. **Phase 4**: Update S1 validation (s1_ingest_aws.ts)
5. **Phase 5**: Update S1 parsing logic (s1_ingest_aws.ts)
6. **Phase 6**: Update S1 execute method (s1_ingest_aws.ts)
7. **Phase 7**: Update test script (test-diarization.js)

## ⚠️ **Risk Mitigation**

- **Backup**: Create backup of current files before changes
- **Incremental**: Test each phase before proceeding
- **Rollback**: Keep original code commented for quick rollback
- **Validation**: Run existing tests after each change

## 📝 **Notes**

- **Minimal Changes**: Only touch the specific lines mentioned
- **No Refactoring**: Keep existing architecture intact
- **Backward Compatibility**: Ensure other modes still work
- **Documentation**: Update comments to reflect streaming format

---

**Ready for surgical implementation!** 🏥
