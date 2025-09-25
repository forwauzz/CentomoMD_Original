import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TranscriptionService } from '../services/transcriptionService.js';
import { TranscriptionConfig } from '../types/index.js';

// Use global mocks from setup.ts
const mockSend = (globalThis as any).mockSend;
const mockTranscribeStreamingClient = (globalThis as any).mockTranscribeStreamingClient;

describe('TranscriptionService AWS Configuration', () => {
  let transcriptionService: TranscriptionService;
  let mockOnTranscript: (result: any) => void;
  let mockOnError: (error: Error) => void;

  beforeEach(() => {
    transcriptionService = new TranscriptionService();
    mockOnTranscript = vi.fn();
    mockOnError = vi.fn();
    vi.clearAllMocks();
  });

  describe('Mode 1 (Word-for-Word) AWS Command', () => {
    it('should create AWS command without ShowSpeakerLabel or MaxSpeakerLabels for Mode 1', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: false,
        max_speaker_labels: undefined,
        partial_results_stability: 'high'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-mode1',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the command was created with correct parameters
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            LanguageCode: 'fr-CA',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            ShowSpeakerLabel: false,
            // MaxSpeakerLabels should not be present
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'high'
          })
        })
      );

      // Verify MaxSpeakerLabels is not included
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });
  });

  describe('Mode 2 (Smart Dictation) AWS Command', () => {
    it('should create AWS command without ShowSpeakerLabel or MaxSpeakerLabels for Mode 2', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: false,
        max_speaker_labels: undefined,
        partial_results_stability: 'high'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-mode2',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the command was created with correct parameters
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            LanguageCode: 'fr-CA',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            ShowSpeakerLabel: false,
            // MaxSpeakerLabels should not be present
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'high'
          })
        })
      );

      // Verify MaxSpeakerLabels is not included
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });
  });

  describe('Mode 3 (Ambient) AWS Command', () => {
    it('should create AWS command with ShowSpeakerLabel=true and MaxSpeakerLabels=2 for Mode 3', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: true,
        max_speaker_labels: 2,
        partial_results_stability: 'medium'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-mode3',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the command was created with correct parameters
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            LanguageCode: 'fr-CA',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            ShowSpeakerLabel: true,
            MaxSpeakerLabels: 2,  // Should be set for Mode 3
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'medium'
          })
        })
      );

      // Verify MaxSpeakerLabels is included
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toHaveProperty('MaxSpeakerLabels', 2);
    });

    it('should handle custom MaxSpeakerLabels values for Mode 3', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: true,
        max_speaker_labels: 3,  // Custom value
        partial_results_stability: 'medium'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-mode3-custom',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MaxSpeakerLabels is set to custom value
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toHaveProperty('MaxSpeakerLabels', 3);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle undefined max_speaker_labels gracefully', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: false,
        max_speaker_labels: undefined,
        partial_results_stability: 'high'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-undefined',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MaxSpeakerLabels is not included when undefined
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });

    it('should handle null max_speaker_labels gracefully', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: false,
        max_speaker_labels: null as any,
        partial_results_stability: 'high'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-null',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MaxSpeakerLabels is not included when null
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });

    it('should handle zero max_speaker_labels gracefully', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: true,
        max_speaker_labels: 0,
        partial_results_stability: 'medium'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-zero',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MaxSpeakerLabels is not included when zero (falsy)
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });
  });

  describe('Language and Sample Rate Configuration', () => {
    it('should preserve language code in AWS command', async () => {
      const config: TranscriptionConfig = {
        language_code: 'en-US',
        media_sample_rate_hz: 44100,
        show_speaker_labels: true,
        max_speaker_labels: 2,
        partial_results_stability: 'medium'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-en',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify language code is preserved
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toHaveProperty('LanguageCode', 'en-US');
    });

    it('should preserve sample rate in AWS command', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 44100,
        show_speaker_labels: true,
        max_speaker_labels: 2,
        partial_results_stability: 'medium'
      };

      // Mock successful AWS response
      mockSend.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-hq',
        config,
        mockOnTranscript,
        mockOnError
      );

      // Simulate audio data
      const audioData = new Uint8Array([1, 2, 3, 4]);
      pushAudio(audioData);
      endAudio();

      // Wait for the command to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify sample rate is preserved
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toHaveProperty('MediaSampleRateHertz', 44100);
    });
  });
});
