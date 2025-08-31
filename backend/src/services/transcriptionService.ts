import { 
  TranscribeStreamingClient, 
  StartStreamTranscriptionCommand,
  StartStreamTranscriptionCommandInput,
  TranscriptResultStream,
  BadRequestException,
  InternalFailureException,
  LimitExceededException,
  ServiceUnavailableException
} from '@aws-sdk/client-transcribe-streaming';
import { awsConfig } from '../config/environment.js';
import { TranscriptionConfig, TranscriptionResult } from '../types/index.js';

export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscriptResultStream> = new Map();

  constructor() {
    this.client = new TranscribeStreamingClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.credentials.accessKeyId,
        secretAccessKey: awsConfig.credentials.secretAccessKey,
      }
    });
  }

  /**
   * Start real-time transcription streaming with AWS Transcribe
   * Returns immediately with audio feeder functions, starts AWS in background
   */
  startStreamingTranscription(
    sessionId: string, 
    config: TranscriptionConfig,
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): { pushAudio: (audioData: Uint8Array) => void; endAudio: () => void } {
    console.log(`Starting AWS Transcribe streaming for session: ${sessionId} with language: ${config.language_code}`);

    // Simple async queue for audio chunks (never yields undefined)
    const queue: Uint8Array[] = [];
    let done = false;

    const audioIterable = (async function* () {
      while (!done || queue.length) {
        if (queue.length) {
          const chunk = queue.shift()!;
          // Yield the union object the SDK expects:
          yield { AudioEvent: { AudioChunk: chunk } };
          continue;
        }
        await new Promise((r) => setTimeout(r, 10));
      }
    })();

    // Prepare AWS Transcribe configuration - simplified for single language
    const cmdInput: StartStreamTranscriptionCommandInput = {
      LanguageCode: (config.language_code || 'fr-CA') as any,   // single language per session
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: config.media_sample_rate_hz || 16000,
      AudioStream: audioIterable,
      ShowSpeakerLabel: true,     // Enable speaker attribution
      // MaxSpeakerLabels: 2,         // PATIENT vs CLINICIAN - not supported in this version
      EnablePartialResultsStabilization: true,
      PartialResultsStability: 'high',
      // Custom vocabulary for medical terms (when available)
      ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
    };

    // Create streaming command
    const command = new StartStreamTranscriptionCommand(cmdInput);
    
    // Start AWS handshake in background (don't await)
    this.client.send(command).then(async (response) => {
      try {
        if (!response.TranscriptResultStream) {
          throw new Error('Failed to create transcript result stream');
        }

        // Store the stream for this session
        this.activeStreams.set(sessionId, response.TranscriptResultStream as any);

        // Handle transcript events
        this.handleTranscriptEvents(sessionId, response.TranscriptResultStream as any, onTranscript, onError);

        console.log(`AWS Transcribe streaming started successfully for session: ${sessionId}`);
      } catch (error) {
        console.error(`Failed to start AWS Transcribe streaming for session ${sessionId}:`, error);
        this.handleTranscribeError(error, onError);
      }
    }).catch((error) => {
      console.error(`AWS Transcribe handshake failed for session ${sessionId}:`, error);
      this.handleTranscribeError(error, onError);
    });

    // Store the queue for this session (available immediately)
    (this as any).audioQueues = (this as any).audioQueues || new Map();
    (this as any).audioQueues.set(sessionId, queue);
    (this as any).doneFlags = (this as any).doneFlags || new Map();
    (this as any).doneFlags.set(sessionId, () => { done = true; });

    // Return feeder functions immediately
    return {
      pushAudio: (audioData: Uint8Array) => {
        if (!done && audioData && audioData.length > 0) {
          queue.push(audioData);
          console.log(`🎵 Queued ${audioData.length} bytes for session: ${sessionId}`);
        }
      },
      endAudio: () => {
        done = true;
        console.log(`🎵 Audio stream ended for session: ${sessionId}`);
      }
    };
  }

  /**
   * Send audio data to the active transcription stream
   */
  async sendAudioData(sessionId: string, audioData: Uint8Array): Promise<void> {
    try {
      const audioQueue = (this as any).audioQueues?.get(sessionId);
      
      if (!audioQueue) {
        console.warn(`No audio queue found for session: ${sessionId}`);
        return;
      }

      // Validate audio data
      if (!audioData || audioData.length === 0) {
        console.warn(`Empty audio data received for session: ${sessionId}`);
        return;
      }

      // Add audio data to the queue
      audioQueue.push(audioData);
      
      console.log(`Queued ${audioData.length} bytes of audio data for session: ${sessionId}`);
      
    } catch (error) {
      console.error(`Error sending audio data for session ${sessionId}:`, error);
    }
  }

  /**
   * Handle transcript events from AWS Transcribe
   */
  private async handleTranscriptEvents(
    sessionId: string,
    stream: TranscriptResultStream,
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      for await (const evt of stream as any) {
        if (!evt.TranscriptEvent) continue;
        const results = evt.TranscriptEvent.Transcript?.Results ?? [];
        for (const r of results) {
          const alt = r.Alternatives?.[0];
          if (!alt?.Transcript) continue;
          // FIX: partial flag (true means partial)
          // Extract speaker information (best-effort)
          const speaker = alt?.Items?.[0]?.Speaker || null;
          
          onTranscript({
            transcript: alt.Transcript,
            is_partial: r.IsPartial === true,        // <-- was inverted
            confidence_score: alt.Confidence,
            timestamp: new Date(),
            resultId: r.ResultId,                    // stable key for tracking
            startTime: r.StartTime ?? null,          // start time in seconds
            endTime: r.EndTime ?? null,              // end time in seconds
            speaker,                                 // PATIENT vs CLINICIAN
          });
        }
      }
    } catch (error) {
      console.error(`Error handling transcript events for session ${sessionId}:`, error);
      this.handleTranscribeError(error, onError);
    }
  }

  /**
   * Stop transcription for a specific session
   */
  async stopTranscription(sessionId: string): Promise<void> {
    try {
      const stream = this.activeStreams.get(sessionId);
      if (stream) {
        // Close the stream
        // await stream.destroy?.(); // destroy method not available in this version
        this.activeStreams.delete(sessionId);
      }

      // Clean up queue and done flag
      (this as any).audioQueues?.delete(sessionId);
      const doneFlag = (this as any).doneFlags?.get(sessionId);
      if (doneFlag) {
        doneFlag();
        (this as any).doneFlags.delete(sessionId);
      }

      console.log(`Transcription stopped for session: ${sessionId}`);
    } catch (error) {
      console.error(`Error stopping transcription for session ${sessionId}:`, error);
    }
  }

  /**
   * Handle AWS Transcribe specific errors
   */
  private handleTranscribeError(error: any, onError: (error: Error) => void): void {
    let errorMessage = 'Unknown transcription error';
    
    if (error instanceof BadRequestException) {
      errorMessage = 'Invalid transcription request: ' + error.message;
    } else if (error instanceof InternalFailureException) {
      errorMessage = 'AWS Transcribe internal error: ' + error.message;
    } else if (error instanceof LimitExceededException) {
      errorMessage = 'Transcription limit exceeded: ' + error.message;
    } else if (error instanceof ServiceUnavailableException) {
      errorMessage = 'AWS Transcribe service unavailable: ' + error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('Transcription error:', errorMessage);
    onError(new Error(errorMessage));
  }

  /**
   * Get the status of the transcription service
   */
  getStatus(): { activeStreams: number; region: string } {
    return {
      activeStreams: this.activeStreams.size,
      region: awsConfig.region
    };
  }

  /**
   * Clean up all active streams (for shutdown)
   */
  async cleanup(): Promise<void> {
    const sessionIds = Array.from(this.activeStreams.keys());
    
    for (const sessionId of sessionIds) {
      await this.stopTranscription(sessionId);
    }
    
    console.log('Transcription service cleanup completed');
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
