#!/usr/bin/env node

/**
 * AWS Troubleshooting Report Generator
 * 
 * This script generates a comprehensive report for AWS support
 * including logs, audio files, and session data.
 * 
 * Usage:
 *   node generate-aws-troubleshoot-report.js [options]
 * 
 * Options:
 *   --input <dir>       Input directory with test results (default: ./troubleshoot-output)
 *   --output <file>     Output report file (default: aws-troubleshoot-report.json)
 *   --include-audio     Include audio file paths in report
 *   --include-logs      Include log file paths in report
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_CONFIG = {
  input: './troubleshoot-output',
  output: 'aws-troubleshoot-report.json',
  includeAudio: false,
  includeLogs: true
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--input':
        config.input = value;
        break;
      case '--output':
        config.output = value;
        break;
      case '--include-audio':
        config.includeAudio = true;
        i--; // No value for this flag
        break;
      case '--include-logs':
        config.includeLogs = true;
        i--; // No value for this flag
        break;
      case '--help':
        console.log(`
AWS Troubleshooting Report Generator

Usage: node generate-aws-troubleshoot-report.js [options]

Options:
  --input <dir>         Input directory with test results (default: ./troubleshoot-output)
  --output <file>       Output report file (default: aws-troubleshoot-report.json)
  --include-audio       Include audio file paths in report
  --include-logs        Include log file paths in report
  --help                Show this help message

Examples:
  node generate-aws-troubleshoot-report.js --include-audio
  node generate-aws-troubleshoot-report.js --input ./test-results --output report.json
        `);
        process.exit(0);
        break;
    }
  }
  
  return config;
}

// Read and parse session files
async function loadSessionData(inputDir) {
  const files = await fs.readdir(inputDir);
  const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));
  
  const sessions = [];
  for (const file of sessionFiles) {
    try {
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const sessionData = JSON.parse(content);
      sessions.push(sessionData);
    } catch (error) {
      console.warn(`Warning: Could not load session file ${file}:`, error.message);
    }
  }
  
  return sessions;
}

// Load summary data
async function loadSummaryData(inputDir) {
  try {
    const summaryPath = path.join(inputDir, 'troubleshoot-summary.json');
    const content = await fs.readFile(summaryPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Warning: Could not load summary file:', error.message);
    return null;
  }
}

// Find audio files
async function findAudioFiles() {
  const audioDir = path.join(process.cwd(), 'temp_audio_recordings');
  
  try {
    const files = await fs.readdir(audioDir);
    return files
      .filter(f => f.endsWith('.wav'))
      .map(f => path.join(audioDir, f));
  } catch (error) {
    console.warn('Warning: Could not access audio recordings directory:', error.message);
    return [];
  }
}

// Find log files
async function findLogFiles() {
  const logDir = path.join(process.cwd(), 'logs');
  
  try {
    const files = await fs.readdir(logDir);
    return files
      .filter(f => f.endsWith('.log'))
      .map(f => path.join(logDir, f));
  } catch (error) {
    console.warn('Warning: Could not access logs directory:', error.message);
    return [];
  }
}

// Analyze speaker label inconsistencies
function analyzeSpeakerInconsistencies(sessions) {
  const inconsistencies = [];
  
  for (const session of sessions) {
    const speakerChanges = session.speakerChanges || [];
    
    for (const change of speakerChanges) {
      // Look for rapid speaker changes (potential inconsistencies)
      const timeWindow = 5000; // 5 seconds
      const nearbyChanges = speakerChanges.filter(c => {
        const timeDiff = Math.abs(new Date(c.timestamp) - new Date(change.timestamp));
        return timeDiff < timeWindow && c !== change;
      });
      
      if (nearbyChanges.length > 2) {
        inconsistencies.push({
          sessionId: session.sessionId,
          timestamp: change.timestamp,
          rapidChanges: nearbyChanges.length + 1,
          changes: [change, ...nearbyChanges].map(c => ({
            timestamp: c.timestamp,
            fromSpeaker: c.fromSpeaker,
            toSpeaker: c.toSpeaker,
            text: c.text
          }))
        });
      }
    }
  }
  
  return inconsistencies;
}

// Generate AWS support report
async function generateReport(config) {
  console.log('📋 Generating AWS Troubleshooting Report');
  console.log('========================================');
  
  // Load test data
  console.log('Loading session data...');
  const sessions = await loadSessionData(config.input);
  const summary = await loadSummaryData(config.input);
  
  if (sessions.length === 0) {
    throw new Error('No session data found. Run the test script first.');
  }
  
  // Find additional files
  let audioFiles = [];
  let logFiles = [];
  
  if (config.includeAudio) {
    console.log('Finding audio files...');
    audioFiles = await findAudioFiles();
  }
  
  if (config.includeLogs) {
    console.log('Finding log files...');
    logFiles = await findLogFiles();
  }
  
  // Analyze data
  console.log('Analyzing speaker inconsistencies...');
  const inconsistencies = analyzeSpeakerInconsistencies(sessions);
  
  // Generate report
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: 'AWS Troubleshooting Report Generator',
      version: '1.0.0'
    },
    
    summary: {
      totalSessions: sessions.length,
      testDuration: summary?.averageDuration || 0,
      totalSpeakerChanges: summary?.totalSpeakerChanges || 0,
      awsRequestIds: summary?.awsRequestIds || [],
      awsSessionIds: summary?.awsSessionIds || [],
      inconsistenciesFound: inconsistencies.length
    },
    
    awsRequestIds: summary?.awsRequestIds || [],
    awsSessionIds: summary?.awsSessionIds || [],
    
    speakerLabelInconsistencies: inconsistencies,
    
    sampleAudio: config.includeAudio ? audioFiles.map(file => ({
      path: file,
      filename: path.basename(file),
      size: 'unknown' // Would need to stat the file
    })) : [],
    
    transcriptionLogs: config.includeLogs ? logFiles.map(file => ({
      path: file,
      filename: path.basename(file),
      type: 'transcription_log'
    })) : [],
    
    sessionDetails: sessions.map(session => ({
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      mode: 'ambient', // Would need to be passed from test
      language: 'fr-CA', // Would need to be passed from test
      awsRequestId: session.awsRequestId,
      awsSessionId: session.awsSessionId,
      speakerChanges: session.speakerChanges?.length || 0,
      transcriptionResults: session.transcriptionResults?.length || 0,
      errors: session.errors?.length || 0,
      audioRecording: session.audioRecording
    })),
    
    problematicSessions: sessions
      .filter(s => s.errors?.length > 0 || s.speakerChanges?.length > 10)
      .map(s => ({
        sessionId: s.sessionId,
        awsRequestId: s.awsRequestId,
        awsSessionId: s.awsSessionId,
        issues: {
          errors: s.errors?.length || 0,
          excessiveSpeakerChanges: s.speakerChanges?.length > 10,
          speakerChangeCount: s.speakerChanges?.length || 0
        },
        errors: s.errors || [],
        speakerChanges: s.speakerChanges || []
      })),
    
    recommendations: [
      'Review speaker label inconsistencies in the problematicSessions section',
      'Check AWS request IDs and session IDs for correlation with AWS logs',
      'Analyze sample audio files for audio quality issues',
      'Review transcription logs for error patterns',
      'Consider audio preprocessing improvements if speaker detection is inconsistent'
    ]
  };
  
  return report;
}

// Save report
async function saveReport(report, outputPath) {
  console.log(`Saving report to ${outputPath}...`);
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
  console.log('✅ Report saved successfully');
}

// Generate human-readable summary
function generateHumanSummary(report) {
  console.log('\n📊 AWS Troubleshooting Report Summary');
  console.log('=====================================');
  console.log(`Generated: ${report.metadata.generatedAt}`);
  console.log(`Total Sessions: ${report.summary.totalSessions}`);
  console.log(`Average Duration: ${report.summary.testDuration}s`);
  console.log(`Total Speaker Changes: ${report.summary.totalSpeakerChanges}`);
  console.log(`Inconsistencies Found: ${report.summary.inconsistenciesFound}`);
  console.log(`AWS Request IDs: ${report.awsRequestIds.length}`);
  console.log(`AWS Session IDs: ${report.awsSessionIds.length}`);
  console.log(`Problematic Sessions: ${report.problematicSessions.length}`);
  console.log(`Sample Audio Files: ${report.sampleAudio.length}`);
  console.log(`Log Files: ${report.transcriptionLogs.length}`);
  
  if (report.awsRequestIds.length > 0) {
    console.log('\n🔍 AWS Request IDs for Support:');
    report.awsRequestIds.forEach(id => console.log(`  - ${id}`));
  }
  
  if (report.awsSessionIds.length > 0) {
    console.log('\n🔍 AWS Session IDs for Support:');
    report.awsSessionIds.forEach(id => console.log(`  - ${id}`));
  }
  
  if (report.problematicSessions.length > 0) {
    console.log('\n⚠️  Problematic Sessions:');
    report.problematicSessions.forEach(session => {
      console.log(`  - ${session.sessionId} (Request ID: ${session.awsRequestId})`);
      console.log(`    Errors: ${session.issues.errors}, Speaker Changes: ${session.issues.speakerChangeCount}`);
    });
  }
  
  console.log('\n📋 Next Steps for AWS Support:');
  console.log('1. Provide the AWS Request IDs and Session IDs listed above');
  console.log('2. Share the sample audio files (if included)');
  console.log('3. Include the transcription logs (if included)');
  console.log('4. Reference the problematic sessions for specific issues');
  console.log('5. Use the session details for correlation with AWS logs');
}

// Main function
async function main() {
  try {
    const config = parseArgs();
    
    console.log(`Input directory: ${config.input}`);
    console.log(`Output file: ${config.output}`);
    console.log(`Include audio: ${config.includeAudio}`);
    console.log(`Include logs: ${config.includeLogs}`);
    console.log('');
    
    const report = await generateReport(config);
    await saveReport(report, config.output);
    generateHumanSummary(report);
    
    console.log(`\n✅ Report generation completed successfully!`);
    console.log(`📄 Full report saved to: ${config.output}`);
    
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Report generation interrupted by user');
  process.exit(0);
});

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
