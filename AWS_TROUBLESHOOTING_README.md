# AWS Troubleshooting System

This temporary system captures data needed for AWS support to investigate speaker labeling inconsistencies in AWS Transcribe.

## 🚨 **IMPORTANT: TEMPORARY SYSTEM**

This system is **temporary** and will be removed after AWS troubleshooting is complete. It includes:
- Audio file recording (temporary storage)
- Enhanced logging with AWS request IDs
- Speaker change tracking
- Test scripts for reproducing issues

## 📋 **What AWS Needs**

AWS support requested:
1. **Transcription logs showing inconsistent speaker labels**
2. **Request IDs** (`x-amzn-request-id` and `x-amzn-transcribe-session-id`)
3. **Sample audio files**

## 🛠️ **How to Use**

### 1. Start the Backend
```bash
cd backend
npm start
```

### 2. Run Test Sessions
```bash
# Run a single 60-second test in ambient mode
node test-aws-troubleshoot.js --mode ambient --duration 60

# Run multiple sessions with different settings
node test-aws-troubleshoot.js --mode ambient --duration 120 --sessions 3 --language fr-CA

# Run in English
node test-aws-troubleshoot.js --mode ambient --duration 60 --language en-US
```

### 3. Generate Report for AWS
```bash
# Generate basic report
node generate-aws-troubleshoot-report.js

# Include audio files in report
node generate-aws-troubleshoot-report.js --include-audio

# Custom output location
node generate-aws-troubleshoot-report.js --input ./my-test-results --output aws-report.json
```

## 📊 **What Gets Captured**

### AWS Request IDs
- `x-amzn-request-id` from AWS responses
- `x-amzn-transcribe-session-id` from AWS responses
- Logged in `logs/audit.log`

### Speaker Label Tracking
- All speaker changes with timestamps
- Rapid speaker changes (potential inconsistencies)
- Confidence scores and transcript text
- Logged in `logs/audit.log`

### Audio Files
- WAV files saved to `temp_audio_recordings/`
- 16kHz, mono, PCM format
- Automatically cleaned up after 24 hours

### Session Data
- Complete transcription results
- Error logs
- Session metadata
- Saved as JSON files in `troubleshoot-output/`

## 🔍 **API Endpoints**

### Get Session Troubleshooting Data
```bash
GET /api/troubleshoot/session/{sessionId}
```

### List Audio Recordings
```bash
GET /api/troubleshoot/recordings
```

### Cleanup Old Recordings
```bash
GET /api/troubleshoot/cleanup
```

## 📁 **Output Files**

### Test Results
- `troubleshoot-output/session-1-{sessionId}.json` - Individual session data
- `troubleshoot-output/troubleshoot-summary.json` - Test summary

### Audio Files
- `temp_audio_recordings/session_{sessionId}_{timestamp}.wav` - Audio recordings

### Logs
- `logs/audit.log` - Detailed transcription logs with AWS request IDs
- `logs/combined.log` - General application logs
- `logs/error.log` - Error logs

### Final Report
- `aws-troubleshoot-report.json` - Comprehensive report for AWS support

## 🧹 **Cleanup After AWS Call**

Once you're done with AWS troubleshooting:

1. **Stop the backend** (Ctrl+C)

2. **Remove temporary files:**
   ```bash
   rm -rf temp_audio_recordings/
   rm -rf troubleshoot-output/
   rm -f aws-troubleshoot-report.json
   ```

3. **Remove temporary code:**
   - Delete `backend/src/services/audioRecordingService.ts`
   - Remove audio recording imports from `backend/src/index.ts`
   - Remove troubleshooting API endpoints from `backend/src/index.ts`
   - Delete test scripts: `test-aws-troubleshoot.js`, `generate-aws-troubleshoot-report.js`

4. **Revert transcription service changes:**
   - Remove AWS request ID logging from `backend/src/services/transcriptionService.ts`
   - Remove speaker change tracking
   - Remove session metadata tracking

## 🔧 **Configuration**

### Test Script Options
```bash
--mode <mode>        # ambient|smart_dictation|word_for_word
--language <lang>    # fr-CA|en-US
--duration <sec>     # Test duration in seconds
--sessions <count>   # Number of test sessions
--output <dir>       # Output directory
```

### Report Generator Options
```bash
--input <dir>        # Input directory with test results
--output <file>      # Output report file
--include-audio      # Include audio file paths
--include-logs       # Include log file paths
```

## 📞 **For AWS Support Call**

When speaking with AWS, provide:

1. **AWS Request IDs** from the report
2. **AWS Session IDs** from the report
3. **Sample audio files** (if requested)
4. **Transcription logs** showing speaker inconsistencies
5. **Problematic session details** from the report

The report will contain all the necessary information organized for easy reference during your call.

## ⚠️ **Notes**

- Audio files are stored temporarily and auto-deleted after 24 hours
- All logging is HIPAA-compliant (no PHI/PII in logs)
- The system is designed to be easily removable
- Test sessions use dummy audio data (silence) - replace with real audio for actual testing
