import fs from 'fs/promises';
import path from 'path';
import { complianceLogger } from '../utils/logger.js';

/**
 * Temporary audio recording service for AWS troubleshooting
 * This service will be removed after AWS troubleshooting is complete
 */
export class AudioRecordingService {
  private recordings: Map<string, { 
    filePath: string; 
    startTime: Date; 
    audioChunks: Buffer[];
    sampleRate: number;
  }> = new Map();

  private readonly RECORDINGS_DIR = path.join(process.cwd(), 'temp_audio_recordings');

  constructor() {
    this.ensureRecordingsDirectory();
  }

  private async ensureRecordingsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.RECORDINGS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create recordings directory:', error);
    }
  }

  /**
   * Start recording audio for a session
   */
  async startRecording(sessionId: string, sampleRate: number = 44100): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `session_${sessionId}_${timestamp}.wav`;
      const filePath = path.join(this.RECORDINGS_DIR, fileName);

      this.recordings.set(sessionId, {
        filePath,
        startTime: new Date(),
        audioChunks: [],
        sampleRate
      });

      complianceLogger.logTranscription(sessionId, 'audio_recording_started', {
        filePath,
        sampleRate
      });

      console.log(`🎙️ Started audio recording for session ${sessionId}: ${fileName}`);
    } catch (error) {
      console.error(`Failed to start recording for session ${sessionId}:`, error);
    }
  }

  /**
   * Add audio chunk to recording
   */
  addAudioChunk(sessionId: string, audioData: Uint8Array): void {
    const recording = this.recordings.get(sessionId);
    if (recording) {
      recording.audioChunks.push(Buffer.from(audioData));
    }
  }

  /**
   * Stop recording and save WAV file
   */
  async stopRecording(sessionId: string): Promise<string | null> {
    const recording = this.recordings.get(sessionId);
    if (!recording) {
      console.warn(`No recording found for session ${sessionId}`);
      return null;
    }

    try {
      // Combine all audio chunks
      const totalLength = recording.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioBuffer = Buffer.concat(recording.audioChunks, totalLength);

      // Create WAV file header
      const wavHeader = this.createWavHeader(audioBuffer.length, recording.sampleRate);
      const wavFile = Buffer.concat([wavHeader, audioBuffer]);

      // Write file
      await fs.writeFile(recording.filePath, wavFile);

      const duration = Date.now() - recording.startTime.getTime();
      complianceLogger.logTranscription(sessionId, 'audio_recording_stopped', {
        filePath: recording.filePath,
        durationMs: duration,
        fileSizeBytes: wavFile.length,
        audioChunks: recording.audioChunks.length
      });

      console.log(`🎙️ Stopped audio recording for session ${sessionId}: ${recording.filePath}`);
      
      // Clean up
      this.recordings.delete(sessionId);
      
      return recording.filePath;
    } catch (error) {
      console.error(`Failed to stop recording for session ${sessionId}:`, error);
      this.recordings.delete(sessionId);
      return null;
    }
  }

  /**
   * Create WAV file header for PCM audio
   */
  private createWavHeader(dataLength: number, sampleRate: number): Buffer {
    const header = Buffer.alloc(44);
    
    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataLength, 4);
    header.write('WAVE', 8);
    
    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20);  // PCM format
    header.writeUInt16LE(1, 22);  // mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28); // byte rate
    header.writeUInt16LE(2, 32);  // block align
    header.writeUInt16LE(16, 34); // bits per sample
    
    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataLength, 40);
    
    return header;
  }

  /**
   * Get recording info for a session
   */
  getRecordingInfo(sessionId: string): { 
    isRecording: boolean; 
    startTime?: Date; 
    chunksCount?: number;
    filePath?: string;
  } {
    const recording = this.recordings.get(sessionId);
    if (!recording) {
      return { isRecording: false };
    }

    return {
      isRecording: true,
      startTime: recording.startTime,
      chunksCount: recording.audioChunks.length,
      filePath: recording.filePath
    };
  }

  /**
   * Clean up old recordings (older than 24 hours)
   */
  async cleanupOldRecordings(): Promise<void> {
    try {
      const files = await fs.readdir(this.RECORDINGS_DIR);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.RECORDINGS_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️ Cleaned up old recording: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old recordings:', error);
    }
  }

  /**
   * Get all recording files for troubleshooting
   */
  async getRecordingFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.RECORDINGS_DIR);
      return files.map(file => path.join(this.RECORDINGS_DIR, file));
    } catch (error) {
      console.error('Failed to get recording files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const audioRecordingService = new AudioRecordingService();
