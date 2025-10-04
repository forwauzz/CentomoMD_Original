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
import { config, ENV as env } from '../config/env.js';
import { TranscriptionConfig, TranscriptionResult } from '../types/index.js';
import { getSessionById, getSessionSampleRate } from '../ws/session.js';
import { logPcm16Stats } from '../utils/audioUtils.js';
import { complianceLogger } from '../utils/logger.js';

export class TranscriptionService {
  private client: TranscribeStreamingClient;
  private activeStreams: Map<string, TranscriptResultStream> = new Map();
  private sessionMetadata: Map<string, { awsRequestId?: string; awsSessionId?: string; startTime: Date }> = new Map();

  constructor() {
    this.client = new TranscribeStreamingClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.credentials.accessKeyId,
        secretAccessKey: config.aws.credentials.secretAccessKey,
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

    // Phase 0: Prepare AWS Transcribe configuration with mode-specific parameters
    const session = getSessionById(sessionId);
    const sessionSampleRate = session?.ws ? getSessionSampleRate(session.ws) : undefined;
    const sampleRate = sessionSampleRate ?? 48000; // fallback to 48k
    
    const use48k = env.USE_48K_AUDIO;
    const enableLabels = env.ENABLE_SPEAKER_LABELS;
    
    const cmdInput: StartStreamTranscriptionCommandInput = {
      LanguageCode: (config.language_code || 'fr-CA') as any,   // single language per session
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: sampleRate,
      AudioStream: audioIterable,
      ShowSpeakerLabel: config.show_speaker_labels ?? enableLabels,     // Mode-specific speaker attribution
      // MaxSpeakerLabels removed - not available for streaming transcription
      EnablePartialResultsStabilization: true,
      PartialResultsStability: (config.partial_results_stability || 'high') as any,  // Mode-specific stability
      // Custom vocabulary for medical terms (when available)
      ...(config.vocabulary_name && { VocabularyName: config.vocabulary_name }),
    };

    // Create streaming command
    const command = new StartStreamTranscriptionCommand(cmdInput);
    
    // Log startup configuration
    console.log(`[ASR] Flags → USE_48K_AUDIO=${use48k}, ENABLE_SPEAKER_LABELS=${enableLabels}, sr=${sampleRate}`);
    console.log(`[ASR] Start stream → ${cmdInput.MediaSampleRateHertz} Hz, encoding=pcm, lang=${cmdInput.LanguageCode}`);
    console.log(`[ASR] Full AWS config:`, JSON.stringify(cmdInput, null, 2));
    
    // Initialize session metadata
    this.sessionMetadata.set(sessionId, { startTime: new Date() });

    // Start AWS handshake in background (don't await)
    this.client.send(command).then(async (response) => {
      try {
        console.log(`[ASR] AWS Transcribe response received for session ${sessionId}:`, {
          hasTranscriptResultStream: !!response.TranscriptResultStream,
          responseKeys: Object.keys(response)
        });
        
        if (!response.TranscriptResultStream) {
          throw new Error('Failed to create transcript result stream');
        }

        // Capture AWS request IDs from response headers
        const metadata = this.sessionMetadata.get(sessionId);
        if (metadata) {
          // Note: AWS SDK v3 doesn't expose response headers directly in streaming responses
          // We'll capture what we can from the response object
          metadata.awsRequestId = (response as any).$metadata?.requestId;
          metadata.awsSessionId = (response as any).$metadata?.sessionId;
          
          // Log AWS session initialization
          complianceLogger.logTranscription(sessionId, 'aws_session_started', {
            awsRequestId: metadata.awsRequestId,
            awsSessionId: metadata.awsSessionId,
            language: config.language_code,
            showSpeakerLabels: config.show_speaker_labels,
            partialResultsStability: config.partial_results_stability
          });
        }

        // Store the stream for this session
        this.activeStreams.set(sessionId, response.TranscriptResultStream as any);

        // Handle transcript events
        this.handleTranscriptEvents(sessionId, response.TranscriptResultStream as any, onTranscript, onError);

        console.log(`[ASR] AWS Transcribe streaming started successfully for session: ${sessionId}`);
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
          // Log PCM stats with the actual sample rate
          logPcm16Stats('tx', audioData, sampleRate);
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

      // Get session sample rate for logging
      const session = getSessionById(sessionId);
      const sessionSampleRate = session?.ws ? getSessionSampleRate(session.ws) : undefined;
      const effectiveSampleRate = sessionSampleRate ?? 48000;
      
      // Log PCM stats with the actual sample rate
      logPcm16Stats('tx', audioData, effectiveSampleRate);

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
    console.log(`[ASR] Starting transcript event handler for session: ${sessionId}`);
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

    // Track speaker changes for inconsistency detection
    let lastSpeaker: string | null = null;
    let speakerChangeCount = 0;

    try {
      for await (const evt of stream as any) {
        console.log(`[ASR] Received event for session ${sessionId}:`, {
          eventType: evt.TranscriptEvent ? 'TranscriptEvent' : 'Other',
          hasTranscript: !!evt.TranscriptEvent?.Transcript,
          resultCount: evt.TranscriptEvent?.Transcript?.Results?.length || 0
        });
        
        if (!evt.TranscriptEvent) continue;
        const results = evt.TranscriptEvent.Transcript?.Results ?? [];
        
        for (const r of results) {
          const alt = r.Alternatives?.[0];
          if (!alt?.Transcript) continue;
          
          // FIX: partial flag (true means partial)
          // Extract speaker information (best-effort)
          const speaker = alt?.Items?.[0]?.Speaker || null;
          
          // Track speaker changes for troubleshooting
          if (speaker && speaker !== lastSpeaker) {
            speakerChangeCount++;
            
            // Log speaker changes for AWS troubleshooting
            complianceLogger.logTranscription(sessionId, 'speaker_change', {
              fromSpeaker: lastSpeaker,
              toSpeaker: speaker,
              changeCount: speakerChangeCount,
              resultId: r.ResultId,
              isPartial: r.IsPartial,
              confidence: alt.Confidence,
              transcript: alt.Transcript.substring(0, 100) // First 100 chars only
            });
            
            lastSpeaker = speaker;
          }
          
          // Build complete AWS result for Mode 3
          if (!r.IsPartial) {
            // Final result - add to transcripts
            awsResult.results.transcripts.push({
              transcript: alt.Transcript
            });
            
            // Add items with speaker labels
            if (alt.Items) {
              for (const item of alt.Items) {
                awsResult.results.items.push({
                  start_time: item.StartTime?.toString() || "0.0",
                  end_time: item.EndTime?.toString() || "0.0",
                  alternatives: [{
                    confidence: item.Confidence?.toString() || "0.0",
                    content: item.Content || ""
                  }],
                  type: item.Type || "pronunciation",
                  speaker: item.Speaker // Include speaker in items for debugging
                });
              }
            }
          }
          
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
      
      // Stream ended - send final AWS result for Mode 3
      console.log(`[${sessionId}] Stream ended, sending final AWS result for Mode 3 pipeline`);
      onTranscript({
        transcript: '', // Empty transcript for final message
        is_partial: false,
        confidence_score: 1.0,
        timestamp: new Date(),
        resultId: 'final_aws_result',
        startTime: null,
        endTime: null,
        speaker: null,
        awsResult: awsResult // Include complete AWS result
      });
      
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

      // Log session end for troubleshooting
      const metadata = this.sessionMetadata.get(sessionId);
      if (metadata) {
        const duration = Date.now() - metadata.startTime.getTime();
        complianceLogger.logTranscription(sessionId, 'session_ended', {
          awsRequestId: metadata.awsRequestId,
          awsSessionId: metadata.awsSessionId,
          durationMs: duration
        });
        this.sessionMetadata.delete(sessionId);
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
      region: config.aws.region
    };
  }

  /**
   * Get troubleshooting data for a session (for AWS support)
   */
  getTroubleshootingData(sessionId: string): { 
    sessionMetadata?: { awsRequestId?: string; awsSessionId?: string; startTime: Date };
    isActive: boolean;
  } {
    const metadata = this.sessionMetadata.get(sessionId);
    const isActive = this.activeStreams.has(sessionId);
    
    return {
      ...(metadata && { sessionMetadata: { ...metadata } }),
      isActive
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
