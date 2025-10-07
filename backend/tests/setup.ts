import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Make vi available globally
globalThis.vi = vi;

// Centralized fetch mock
global.fetch = vi.fn();

// Centralized WebSocket mock
class FakeWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  readyState = WebSocket.CONNECTING;
  url: string;
  
  constructor(url: string) {
    this.url = url;
    // Simulate connection after a brief delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }
  
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    // Mock send implementation
  }
  
  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
  
  addEventListener(type: string, listener: EventListener) {
    switch (type) {
      case 'open':
        this.onopen = listener as (event: Event) => void;
        break;
      case 'message':
        this.onmessage = listener as (event: MessageEvent) => void;
        break;
      case 'close':
        this.onclose = listener as (event: CloseEvent) => void;
        break;
      case 'error':
        this.onerror = listener as (event: Event) => void;
        break;
    }
  }
  
  removeEventListener(type: string, listener: EventListener) {
    switch (type) {
      case 'open':
        this.onopen = null;
        break;
      case 'message':
        this.onmessage = null;
        break;
      case 'close':
        this.onclose = null;
        break;
      case 'error':
        this.onerror = null;
        break;
    }
  }
}

// Make WebSocket available globally
(globalThis as any).WebSocket = FakeWebSocket;

// Mock AWS SDK for transcription tests
const mockSend = vi.fn();
const mockTranscribeStreamingClient = {
  send: mockSend
};

vi.mock('@aws-sdk/client-transcribe-streaming', () => ({
  TranscribeStreamingClient: vi.fn(() => mockTranscribeStreamingClient),
  StartStreamTranscriptionCommand: vi.fn((input) => ({ input })),
  StartStreamTranscriptionCommandInput: vi.fn()
}));

// Make mocks available globally for tests
globalThis.mockSend = mockSend;
globalThis.mockTranscribeStreamingClient = mockTranscribeStreamingClient;

// Global test setup
beforeAll(() => {
  // Any global setup that needs to run once before all tests
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Any global cleanup that needs to run once after all tests
});
