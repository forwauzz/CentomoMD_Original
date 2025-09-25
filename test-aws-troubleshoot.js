#!/usr/bin/env node

/**
 * AWS Troubleshooting Test Script
 * 
 * This script runs controlled transcription sessions to reproduce
 * speaker labeling issues for AWS support.
 * 
 * Usage:
 *   node test-aws-troubleshoot.js [options]
 * 
 * Options:
 *   --mode <mode>        Transcription mode (ambient|smart_dictation|word_for_word)
 *   --language <lang>    Language code (fr-CA|en-US)
 *   --duration <sec>     Test duration in seconds (default: 60)
 *   --sessions <count>   Number of test sessions (default: 1)
 *   --output <dir>       Output directory for results (default: ./troubleshoot-output)
 */

import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_CONFIG = {
  mode: 'ambient',
  language: 'fr-CA',
  duration: 60,
  sessions: 1,
  output: './troubleshoot-output',
  serverUrl: 'ws://localhost:3001/ws/transcription'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--mode':
        config.mode = value;
        break;
      case '--language':
        config.language = value;
        break;
      case '--duration':
        config.duration = parseInt(value);
        break;
      case '--sessions':
        config.sessions = parseInt(value);
        break;
      case '--output':
        config.output = value;
        break;
      case '--help':
        console.log(`
AWS Troubleshooting Test Script

Usage: node test-aws-troubleshoot.js [options]

Options:
  --mode <mode>        Transcription mode (ambient|smart_dictation|word_for_word)
  --language <lang>    Language code (fr-CA|en-US)
  --duration <sec>     Test duration in seconds (default: 60)
  --sessions <count>   Number of test sessions (default: 1)
  --output <dir>       Output directory for results (default: ./troubleshoot-output)
  --help               Show this help message

Examples:
  node test-aws-troubleshoot.js --mode ambient --duration 120 --sessions 3
  node test-aws-troubleshoot.js --language en-US --mode smart_dictation
        `);
        process.exit(0);
        break;
    }
  }
  
  return config;
}

// Test session class
class TroubleshootSession {
  constructor(config, sessionId) {
    this.config = config;
    this.sessionId = sessionId;
    this.ws = null;
    this.results = {
      sessionId,
      startTime: null,
      endTime: null,
      duration: 0,
      transcriptionResults: [],
      speakerChanges: [],
      errors: [],
      awsRequestId: null,
      awsSessionId: null
    };
    this.isRecording = false;
    this.audioContext = null;
    this.mediaStream = null;
  }

  async run() {
    console.log(`🚀 Starting test session ${this.sessionId}`);
    console.log(`   Mode: ${this.config.mode}`);
    console.log(`   Language: ${this.config.language}`);
    console.log(`   Duration: ${this.config.duration}s`);
    
    try {
      await this.setupAudio();
      await this.connectWebSocket();
      await this.startTranscription();
      await this.runTest();
      await this.stopTranscription();
      await this.collectResults();
      
      console.log(`✅ Session ${this.sessionId} completed successfully`);
      return this.results;
    } catch (error) {
      console.error(`❌ Session ${this.sessionId} failed:`, error.message);
      this.results.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      return this.results;
    } finally {
      await this.cleanup();
    }
  }

  async setupAudio() {
    // Note: This is a simplified version for testing
    // In a real browser environment, you would use getUserMedia
    console.log(`   Setting up audio for session ${this.sessionId}`);
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.serverUrl);
      
      this.ws.on('open', () => {
        console.log(`   WebSocket connected for session ${this.sessionId}`);
        resolve();
      });
      
      this.ws.on('error', (error) => {
        console.error(`   WebSocket error for session ${this.sessionId}:`, error);
        reject(error);
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });
      
      this.ws.on('close', () => {
        console.log(`   WebSocket closed for session ${this.sessionId}`);
      });
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'connection_established':
          console.log(`   Connection established for session ${this.sessionId}`);
          break;
          
        case 'stream_ready':
          console.log(`   Stream ready for session ${this.sessionId}`);
          this.isRecording = true;
          break;
          
        case 'transcription_result':
          this.results.transcriptionResults.push({
            timestamp: new Date().toISOString(),
            resultId: message.resultId,
            text: message.text,
            isFinal: message.isFinal,
            speaker: message.speaker,
            confidence: message.confidence_score,
            startTime: message.startTime,
            endTime: message.endTime
          });
          
          // Track speaker changes
          if (message.speaker && message.isFinal) {
            const lastResult = this.results.transcriptionResults
              .filter(r => r.isFinal && r.speaker)
              .slice(-2, -1)[0];
            
            if (lastResult && lastResult.speaker !== message.speaker) {
              this.results.speakerChanges.push({
                timestamp: new Date().toISOString(),
                fromSpeaker: lastResult.speaker,
                toSpeaker: message.speaker,
                resultId: message.resultId,
                text: message.text.substring(0, 100)
              });
            }
          }
          break;
          
        case 'transcription_error':
          this.results.errors.push({
            timestamp: new Date().toISOString(),
            error: message.error
          });
          break;
      }
    } catch (error) {
      console.error(`   Error parsing message for session ${this.sessionId}:`, error);
    }
  }

  async startTranscription() {
    const startMessage = {
      type: 'start_transcription',
      languageCode: this.config.language,
      sampleRate: 16000,
      mode: this.config.mode
    };
    
    this.ws.send(JSON.stringify(startMessage));
    this.results.startTime = new Date();
    
    console.log(`   Transcription started for session ${this.sessionId}`);
  }

  async runTest() {
    console.log(`   Running test for ${this.config.duration} seconds...`);
    
    // Simulate audio data (in a real test, this would be actual microphone input)
    const testDuration = this.config.duration * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < testDuration && this.isRecording) {
      // Send dummy audio data (silence)
      const dummyAudio = new Int16Array(4096).fill(0);
      this.ws.send(dummyAudio.buffer);
      
      // Wait 256ms (4096 samples at 16kHz)
      await new Promise(resolve => setTimeout(resolve, 256));
    }
  }

  async stopTranscription() {
    this.ws.send(JSON.stringify({ type: 'stop_transcription' }));
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    console.log(`   Transcription stopped for session ${this.sessionId}`);
  }

  async collectResults() {
    // Get troubleshooting data from API
    try {
      const response = await fetch(`http://localhost:3001/api/troubleshoot/session/${this.sessionId}`);
      if (response.ok) {
        const troubleshootData = await response.json();
        this.results.awsRequestId = troubleshootData.transcription?.sessionMetadata?.awsRequestId;
        this.results.awsSessionId = troubleshootData.transcription?.sessionMetadata?.awsSessionId;
        this.results.audioRecording = troubleshootData.audio;
      }
    } catch (error) {
      console.warn(`   Could not fetch troubleshooting data for session ${this.sessionId}:`, error.message);
    }
  }

  async cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
    }
  }
}

// Main test runner
async function runTests(config) {
  console.log('🔧 AWS Troubleshooting Test Suite');
  console.log('=====================================');
  console.log(`Configuration:`);
  console.log(`  Mode: ${config.mode}`);
  console.log(`  Language: ${config.language}`);
  console.log(`  Duration: ${config.duration}s`);
  console.log(`  Sessions: ${config.sessions}`);
  console.log(`  Output: ${config.output}`);
  console.log('');

  // Create output directory
  await fs.mkdir(config.output, { recursive: true });

  const allResults = [];
  
  for (let i = 0; i < config.sessions; i++) {
    const sessionId = `troubleshoot-${Date.now()}-${i}`;
    const session = new TroubleshootSession(config, sessionId);
    
    const result = await session.run();
    allResults.push(result);
    
    // Save individual session results
    const sessionFile = path.join(config.output, `session-${i + 1}-${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(result, null, 2));
    
    console.log(`   Session ${i + 1} results saved to: ${sessionFile}`);
    
    // Wait between sessions
    if (i < config.sessions - 1) {
      console.log('   Waiting 5 seconds before next session...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Generate summary report
  const summary = generateSummary(allResults);
  const summaryFile = path.join(config.output, 'troubleshoot-summary.json');
  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');
  console.log(`Total Sessions: ${summary.totalSessions}`);
  console.log(`Successful Sessions: ${summary.successfulSessions}`);
  console.log(`Failed Sessions: ${summary.failedSessions}`);
  console.log(`Total Speaker Changes: ${summary.totalSpeakerChanges}`);
  console.log(`Average Session Duration: ${summary.averageDuration}s`);
  console.log(`AWS Request IDs Captured: ${summary.awsRequestIds.length}`);
  console.log('');
  console.log(`📁 Results saved to: ${config.output}`);
  console.log(`📄 Summary report: ${summaryFile}`);
  
  return summary;
}

function generateSummary(results) {
  const successfulSessions = results.filter(r => r.errors.length === 0);
  const failedSessions = results.filter(r => r.errors.length > 0);
  
  const totalSpeakerChanges = results.reduce((sum, r) => sum + r.speakerChanges.length, 0);
  const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length / 1000;
  
  const awsRequestIds = results
    .map(r => r.awsRequestId)
    .filter(id => id)
    .filter((id, index, arr) => arr.indexOf(id) === index); // unique
  
  const awsSessionIds = results
    .map(r => r.awsSessionId)
    .filter(id => id)
    .filter((id, index, arr) => arr.indexOf(id) === index); // unique

  return {
    timestamp: new Date().toISOString(),
    totalSessions: results.length,
    successfulSessions: successfulSessions.length,
    failedSessions: failedSessions.length,
    totalSpeakerChanges,
    averageDuration: Math.round(averageDuration * 100) / 100,
    awsRequestIds,
    awsSessionIds,
    sessions: results.map(r => ({
      sessionId: r.sessionId,
      duration: r.duration,
      speakerChanges: r.speakerChanges.length,
      transcriptionResults: r.transcriptionResults.length,
      errors: r.errors.length,
      awsRequestId: r.awsRequestId,
      awsSessionId: r.awsSessionId
    }))
  };
}

// Run the tests
async function main() {
  try {
    const config = parseArgs();
    await runTests(config);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
