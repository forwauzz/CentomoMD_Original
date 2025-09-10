import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TranscriptionInterface from '../TranscriptionInterface';

// Mock the useTranscription hook
vi.mock('../../../hooks/useTranscription', () => ({
  useTranscription: () => ({
    isRecording: false,
    isConnected: true,
    currentTranscript: '',
    finalTranscripts: [],
    currentSection: 'section_7',
    mode: 'ambient',
    error: undefined,
    reconnectionAttempts: 0,
    segments: [],
    paragraphs: [],
    activeSection: 'section_7',
    buffers: {},
    voiceCommands: [],
    isListening: false,
    mode3Narrative: null,
    mode3Progress: 'idle',
    finalAwsJson: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    sendVoiceCommand: vi.fn(),
    updateState: vi.fn(),
    reconnect: vi.fn(),
    setActiveSection: vi.fn(),
  })
}));

describe('TranscriptionInterface Mode 3 Integration', () => {
  beforeEach(() => {
    // Mock fetch for pipeline endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        narrative: "PATIENT: Je souffre de douleur au dos.\n\nCLINICIAN: Pouvez-vous me décrire la douleur plus précisément?",
        irSummary: {
          turnCount: 2,
          speakerCount: 2,
          totalDuration: 5.2
        },
        roleMap: { 
          spk_0: 'PATIENT', 
          spk_1: 'CLINICIAN' 
        },
        meta: {
          processingTime: 150,
          profile: 'default',
          success: true
        }
      })
    });
  });

  it('should display Mode 3 progress indicators', () => {
    render(<TranscriptionInterface />);
    
    // Check if Mode 3 specific UI elements are present
    expect(screen.getByText(/ambient|mode 3/i)).toBeInTheDocument();
  });

  it('should handle Mode 3 pipeline processing flow', async () => {
    // Mock the hook with Mode 3 state
    const mockUseTranscription = vi.fn(() => ({
      isRecording: false,
      isConnected: true,
      currentTranscript: '',
      finalTranscripts: [],
      currentSection: 'section_7',
      mode: 'ambient',
      error: undefined,
      reconnectionAttempts: 0,
      segments: [],
      paragraphs: [],
      activeSection: 'section_7',
      buffers: {},
      voiceCommands: [],
      isListening: false,
      mode3Narrative: "PATIENT: Je souffre de douleur au dos.\n\nCLINICIAN: Pouvez-vous me décrire la douleur plus précisément?",
      mode3Progress: 'ready',
      finalAwsJson: {
        results: {
          items: [
            { type: 'pronunciation', alternatives: [{ content: 'Je', confidence: '0.99' }] },
            { type: 'pronunciation', alternatives: [{ content: 'souffre', confidence: '0.98' }] }
          ]
        },
        speaker_labels: {
          segments: [
            { speaker_label: 'spk_0', start_time: '0.0', end_time: '2.5' },
            { speaker_label: 'spk_1', start_time: '2.5', end_time: '5.0' }
          ]
        }
      },
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      sendVoiceCommand: vi.fn(),
      updateState: vi.fn(),
      reconnect: vi.fn(),
      setActiveSection: vi.fn(),
    }));

    vi.doMock('../../../hooks/useTranscription', () => ({
      useTranscription: mockUseTranscription
    }));

    render(<TranscriptionInterface />);

    // Wait for narrative to appear
    await waitFor(() => {
      expect(screen.getByText(/PATIENT:/)).toBeInTheDocument();
      expect(screen.getByText(/CLINICIAN:/)).toBeInTheDocument();
    });

    // Verify the narrative content
    expect(screen.getByText(/Je souffre de douleur au dos/)).toBeInTheDocument();
    expect(screen.getByText(/Pouvez-vous me décrire la douleur/)).toBeInTheDocument();
  });

  it('should show processing progress for Mode 3', () => {
    // Mock processing state
    const mockUseTranscription = vi.fn(() => ({
      isRecording: false,
      isConnected: true,
      currentTranscript: '',
      finalTranscripts: [],
      currentSection: 'section_7',
      mode: 'ambient',
      error: undefined,
      reconnectionAttempts: 0,
      segments: [],
      paragraphs: [],
      activeSection: 'section_7',
      buffers: {},
      voiceCommands: [],
      isListening: false,
      mode3Narrative: null,
      mode3Progress: 'processing',
      finalAwsJson: null,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      sendVoiceCommand: vi.fn(),
      updateState: vi.fn(),
      reconnect: vi.fn(),
      setActiveSection: vi.fn(),
    }));

    vi.doMock('../../../hooks/useTranscription', () => ({
      useTranscription: mockUseTranscription
    }));

    render(<TranscriptionInterface />);

    // Should show processing indicator
    expect(screen.getByText(/Cleaning & building narrative/i)).toBeInTheDocument();
  });

  it('should handle Mode 3 pipeline errors gracefully', () => {
    // Mock error state
    const mockUseTranscription = vi.fn(() => ({
      isRecording: false,
      isConnected: true,
      currentTranscript: '',
      finalTranscripts: [],
      currentSection: 'section_7',
      mode: 'ambient',
      error: 'Pipeline processing failed: Network error',
      reconnectionAttempts: 0,
      segments: [],
      paragraphs: [],
      activeSection: 'section_7',
      buffers: {},
      voiceCommands: [],
      isListening: false,
      mode3Narrative: null,
      mode3Progress: 'idle',
      finalAwsJson: null,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      sendVoiceCommand: vi.fn(),
      updateState: vi.fn(),
      reconnect: vi.fn(),
      setActiveSection: vi.fn(),
    }));

    vi.doMock('../../../hooks/useTranscription', () => ({
      useTranscription: mockUseTranscription
    }));

    render(<TranscriptionInterface />);

    // Should show error message
    expect(screen.getByText(/Pipeline processing failed/)).toBeInTheDocument();
  });
});
