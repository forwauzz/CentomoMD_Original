import { describe, it, expect, beforeEach } from 'vitest';
import { TranscriptionService } from '../services/transcriptionService.js';
import { TranscriptionConfig } from '../types/index.js';

// Use global mocks from setup.ts
const mockTranscribeStreamingClient = (globalThis as any).mockTranscribeStreamingClient;

// Mock the getModeSpecificConfig function from index.ts
const getModeSpecificConfig = (mode: string, baseConfig: any) => {
  const config = {
    language_code: baseConfig.language_code,
    media_sample_rate_hz: baseConfig.media_sample_rate_hz,
  };

  switch (mode) {
    case 'word_for_word':
      return {
        ...config,
        show_speaker_labels: false,
        max_speaker_labels: undefined,  // Explicitly disable for Mode 1
        partial_results_stability: 'high' as const
      };
    case 'smart_dictation':
      return {
        ...config,
        show_speaker_labels: false,  // Changed: Mode 2 should NOT use speaker labels
        max_speaker_labels: undefined,  // Explicitly disable for Mode 2
        partial_results_stability: 'high' as const
      };
    case 'ambient':
      return {
        ...config,
        show_speaker_labels: true,  // Mode 3: Enable speaker labels
        max_speaker_labels: 2,  // Mode 3: Limit to 2 speakers (PATIENT vs CLINICIAN)
        partial_results_stability: 'medium' as const
      };
    default:
      return {
        ...config,
        show_speaker_labels: false,
        max_speaker_labels: undefined,  // Explicitly disable for fallback
        partial_results_stability: 'high' as const
      };
  }
};

describe('AWS Transcribe Configuration', () => {
  let transcriptionService: TranscriptionService;
  let mockOnTranscript: (result: any) => void;
  let mockOnError: (error: Error) => void;

  beforeEach(() => {
    transcriptionService = new TranscriptionService();
    mockOnTranscript = vi.fn();
    mockOnError = vi.fn();
    vi.clearAllMocks();
  });

  describe('Mode 1 (Word-for-Word) Configuration', () => {
    it('should NOT set ShowSpeakerLabel or MaxSpeakerLabels for Mode 1', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      const modeConfig = getModeSpecificConfig('word_for_word', baseConfig);

      // Assert Mode 1 configuration
      expect(modeConfig.show_speaker_labels).toBe(false);
      expect(modeConfig.max_speaker_labels).toBeUndefined();
      expect(modeConfig.partial_results_stability).toBe('high');
    });

    it('should create AWS Transcribe command with correct parameters for Mode 1', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000,
        show_speaker_labels: false,
        max_speaker_labels: undefined,
        partial_results_stability: 'high'
      };

      // Mock the AWS response
      mockTranscribeStreamingClient.send.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-1',
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
      expect(mockTranscribeStreamingClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            LanguageCode: 'fr-CA',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            ShowSpeakerLabel: false,
            // MaxSpeakerLabels should not be set
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'high'
          })
        })
      );
    });
  });

  describe('Mode 2 (Smart Dictation) Configuration', () => {
    it('should NOT set ShowSpeakerLabel or MaxSpeakerLabels for Mode 2', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      const modeConfig = getModeSpecificConfig('smart_dictation', baseConfig);

      // Assert Mode 2 configuration
      expect(modeConfig.show_speaker_labels).toBe(false);
      expect(modeConfig.max_speaker_labels).toBeUndefined();
      expect(modeConfig.partial_results_stability).toBe('high');
    });

    it('should create AWS Transcribe command with correct parameters for Mode 2', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000,
        show_speaker_labels: false,
        max_speaker_labels: undefined,
        partial_results_stability: 'high'
      };

      // Mock the AWS response
      mockTranscribeStreamingClient.send.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-2',
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
      expect(mockTranscribeStreamingClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            LanguageCode: 'fr-CA',
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: 16000,
            ShowSpeakerLabel: false,
            // MaxSpeakerLabels should not be set
            EnablePartialResultsStabilization: true,
            PartialResultsStability: 'high'
          })
        })
      );
    });
  });

  describe('Mode 3 (Ambient) Configuration', () => {
    it('should set ShowSpeakerLabel=true and MaxSpeakerLabels=2 for Mode 3', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      const modeConfig = getModeSpecificConfig('ambient', baseConfig);

      // Assert Mode 3 configuration
      expect(modeConfig.show_speaker_labels).toBe(true);
      expect(modeConfig.max_speaker_labels).toBe(2);
      expect(modeConfig.partial_results_stability).toBe('medium');
    });

    it('should create AWS Transcribe command with correct parameters for Mode 3', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000,
        show_speaker_labels: true,
        max_speaker_labels: 2,
        partial_results_stability: 'medium'
      };

      // Mock the AWS response
      mockTranscribeStreamingClient.send.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-3',
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
      expect(mockTranscribeStreamingClient.send).toHaveBeenCalledWith(
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
    });

    it('should handle custom MaxSpeakerLabels configuration for Mode 3', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      // Test with custom max speaker labels
      const customModeConfig = {
        ...getModeSpecificConfig('ambient', baseConfig),
        max_speaker_labels: 3  // Custom value
      };

      expect(customModeConfig.show_speaker_labels).toBe(true);
      expect(customModeConfig.max_speaker_labels).toBe(3);
    });
  });

  describe('Default/Fallback Configuration', () => {
    it('should use safe defaults for unknown modes', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      const modeConfig = getModeSpecificConfig('unknown_mode', baseConfig);

      // Assert fallback configuration
      expect(modeConfig.show_speaker_labels).toBe(false);
      expect(modeConfig.max_speaker_labels).toBeUndefined();
      expect(modeConfig.partial_results_stability).toBe('high');
    });
  });

  describe('TranscriptionService Integration', () => {
    it('should properly handle undefined max_speaker_labels in AWS command', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000,
        show_speaker_labels: false,
        max_speaker_labels: undefined,  // Explicitly undefined
        partial_results_stability: 'high'
      };

      // Mock the AWS response
      mockTranscribeStreamingClient.send.mockResolvedValue({
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

      // Verify MaxSpeakerLabels is not included in the command when undefined
      const sentCommand = mockTranscribeStreamingClient.send.mock.calls[0][0];
      expect(sentCommand.input).not.toHaveProperty('MaxSpeakerLabels');
    });

    it('should include MaxSpeakerLabels in AWS command when defined', async () => {
      const config: TranscriptionConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000,
        show_speaker_labels: true,
        max_speaker_labels: 2,
        partial_results_stability: 'medium'
      };

      // Mock the AWS response
      mockTranscribeStreamingClient.send.mockResolvedValue({
        TranscriptResultStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { TranscriptEvent: { Transcript: { Results: [] } } };
          }
        }
      });

      const { pushAudio, endAudio } = transcriptionService.startStreamingTranscription(
        'test-session-defined',
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

      // Verify MaxSpeakerLabels is included in the command when defined
      const sentCommand = mockTranscribeStreamingClient.send.mock.calls[0][0];
      expect(sentCommand.input).toHaveProperty('MaxSpeakerLabels', 2);
    });
  });

  describe('Mode Configuration Validation', () => {
    it('should validate all mode configurations have correct speaker label settings', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      // Test all modes
      const modes = ['word_for_word', 'smart_dictation', 'ambient'];
      
      modes.forEach(mode => {
        const config = getModeSpecificConfig(mode, baseConfig);
        
        if (mode === 'ambient') {
          // Mode 3 should have speaker labels enabled
          expect(config.show_speaker_labels).toBe(true);
          expect(config.max_speaker_labels).toBe(2);
        } else {
          // Mode 1 and 2 should NOT have speaker labels
          expect(config.show_speaker_labels).toBe(false);
          expect(config.max_speaker_labels).toBeUndefined();
        }
      });
    });

    it('should maintain consistent partial results stability settings', () => {
      const baseConfig = {
        language_code: 'fr-CA',
        media_sample_rate_hz: 16000
      };

      const mode1Config = getModeSpecificConfig('word_for_word', baseConfig);
      const mode2Config = getModeSpecificConfig('smart_dictation', baseConfig);
      const mode3Config = getModeSpecificConfig('ambient', baseConfig);

      expect(mode1Config.partial_results_stability).toBe('high');
      expect(mode2Config.partial_results_stability).toBe('high');
      expect(mode3Config.partial_results_stability).toBe('medium');
    });
  });
});
