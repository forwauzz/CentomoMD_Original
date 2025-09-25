# AWS Transcribe Speaker Labeling Troubleshooting Report

**Date:** September 23, 2025  
**Application:** CentomoMD - Medical Transcription App  
**Issue:** Inconsistent speaker labeling in AWS Transcribe streaming mode  
**AWS Region:** ca-central-1  

---

## 🎯 **Problem Summary**

Our medical transcription application is experiencing inconsistent speaker labeling when using AWS Transcribe streaming API in ambient mode. The speaker diarization is incorrectly attributing speech between Patient and Clinician speakers, causing incorrect medical documentation.

**Expected Behavior:** Consistent speaker identification (Patient vs Clinician)  
**Actual Behavior:** Frequent speaker label changes and incorrect attributions  

---

## 📋 **AWS Request Information**

### **Primary Session for Investigation:**
- **AWS Request ID:** `585b512c-22d0-461a-8119-db4c94c8f1b5`
- **Session ID:** `dev-session-id`
- **Timestamp:** 2025-09-23T17:17:58.289Z
- **Language:** en-US
- **Mode:** Ambient (speaker diarization enabled)
- **Partial Results Stability:** high

### **Additional Sessions for Reference:**
- **Session 1:** `8f740972-02a8-4f12-a468-ceccf82c8ece` (2025-09-23T17:16:24)
- **Session 2:** `62f44a0e-2421-4bff-b11e-9c7b3dc45f1f` (2025-09-23T17:17:48)

---

## 🎵 **Sample Audio Files**

### **Primary Audio File for Analysis:**
**File Path:** `C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\temp_audio_recordings\session_dev-session-id_2025-09-23T17-17-58-288Z.wav`

**File Details:**
- **Size:** 4,079,660 bytes (4.08 MB)
- **Duration:** ~2 minutes 9 seconds
- **Format:** WAV, 16kHz, Mono, PCM
- **Audio Chunks:** 498 chunks processed
- **Content:** Doctor-patient conversation with speaker labeling issues

### **Additional Audio Files:**
1. `session_dev-session-id_2025-09-23T17-16-24-147Z.wav` (2.22 MB, ~1 minute)
2. `session_dev-session-id_2025-09-23T17-17-48-115Z.wav` (8.2 KB, ~1 second)

---

## 📊 **Speaker Label Inconsistencies**

### **Session: 585b512c-22d0-461a-8119-db4c94c8f1b5**

**Total Speaker Changes:** 6 changes detected

| Change # | Timestamp | From Speaker | To Speaker | Result ID | Transcript Sample |
|----------|-----------|--------------|------------|-----------|-------------------|
| 1 | 13:18:01 | null | 0 | 4b651a1c-8ae1-4543-be15-d6ee696dbdd6 | "Yes." |
| 2 | 13:18:07 | 0 | 1 | a328093c-b7bb-4e35-a65c-5135bc951fdf | "um, Harris, I'll be your doctor today. Um, you just wash my hands really quick." |
| 3 | 13:18:14 | 1 | 0 | 65f7c3d0-092b-439f-834e-7c057813ad26 | "Um, would you prefer Miss Bellamy or would you, can I call you Pa? Pats. Great. Once I see you see u" |
| 4 | 13:18:32 | 0 | 1 | b7a854d6-5ad5-4312-8ff4-a7cd287e92f3 | "can you tell me why you're here today? I have a terrible headache. It looks really bad. Um, is there" |
| 5 | 13:19:27 | 1 | 0 | 145745df-3a33-4411-b18a-6c54a83968af | "Well, um, it started about three days ago, and, um, uh, nothing has helped it. It's, it's just laid " |
| 6 | 13:19:57 | 0 | 1 | 946a168d-5d44-4b74-adf4-51324ab1131a | "So, you said this headache started about three days ago. Yeah, um-hum. OK. Um" |

### **Analysis:**
- **Rapid speaker changes** occurring within seconds
- **Inconsistent attribution** of doctor vs patient speech
- **Speaker 0** appears to be both patient and doctor at different times
- **Speaker 1** appears to be both doctor and patient at different times

---

## 🔧 **Technical Configuration**

### **AWS Transcribe Settings:**
```json
{
  "LanguageCode": "en-US",
  "MediaEncoding": "pcm",
  "MediaSampleRateHertz": 16000,
  "ShowSpeakerLabel": true,
  "MaxSpeakerLabels": 2,
  "EnablePartialResultsStabilization": true,
  "PartialResultsStability": "high"
}
```

### **Audio Processing:**
- **Sample Rate:** 16,000 Hz
- **Channels:** Mono (1 channel)
- **Encoding:** PCM 16-bit
- **Chunk Size:** 8,192 bytes (4096 samples)
- **Chunk Duration:** 256ms per chunk

### **Application Architecture:**
- **Frontend:** React/TypeScript with WebSocket audio streaming
- **Backend:** Node.js/Express with AWS Transcribe integration
- **Transport:** WebSocket over HTTP (ws://localhost:3001)
- **Audio Source:** Browser microphone via getUserMedia API

---

## 📁 **File Locations for AWS Analysis**

### **Primary Audio File (RECOMMENDED FOR ANALYSIS):**
```
C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\temp_audio_recordings\session_dev-session-id_2025-09-23T17-17-58-288Z.wav
```

### **Log Files:**
```
C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\logs\audit.log
C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\logs\combined.log
```

### **Troubleshooting Data:**
```
C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\temp_audio_recordings\
```

---

## 🎯 **Specific Issues for AWS Investigation**

1. **Speaker Label Inconsistency:** Why are speakers 0 and 1 being attributed to both patient and doctor roles?

2. **Rapid Speaker Changes:** What causes the frequent speaker label changes within seconds?

3. **Audio Quality Impact:** Is the 16kHz mono audio quality sufficient for accurate speaker diarization?

4. **Partial Results Stability:** Despite setting "high" stability, why are speaker labels still inconsistent?

5. **Medical Context:** Are there specific audio characteristics in medical conversations that affect speaker detection?

---

## 📞 **Contact Information**

**Application:** CentomoMD  
**Environment:** Development  
**AWS Region:** ca-central-1  
**Issue Priority:** High (affects medical documentation accuracy)  

---

## 🔍 **Next Steps**

1. **AWS Analysis:** Please analyze the provided audio file with the AWS Request ID
2. **Speaker Diarization Review:** Investigate why speaker labels are inconsistent
3. **Configuration Recommendations:** Suggest optimal settings for medical transcription
4. **Audio Quality Assessment:** Evaluate if audio preprocessing is needed

---

## 📋 **Files to Download for AWS Analysis**

### **CRITICAL - Download This File:**
```
session_dev-session-id_2025-09-23T17-17-58-288Z.wav
Location: C:\Users\alici\Desktop\DEV CENTOMO\scribe\backend\temp_audio_recordings\
Size: 4.08 MB
Duration: ~2 minutes
Content: Doctor-patient conversation with speaker labeling issues
```

### **Supporting Files (Optional):**
```
audit.log - Contains detailed speaker change logs
combined.log - General application logs
```

---

**Note:** This is a temporary troubleshooting system that will be removed after AWS analysis is complete. All audio files are automatically cleaned up after 24 hours for compliance.
