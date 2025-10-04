import { WebSocket } from 'ws';
import { PassThrough } from 'stream';

// Session state interface
export interface SessionState {
  ws: WebSocket;
  sessionId: string;
  sampleRate?: number;
  isInitialized: boolean;
  pcmPipe: PassThrough;
  frames?: number;
}

// Store active sessions
const activeSessions = new Map<WebSocket, SessionState>();

// Create a new session
export function createSession(ws: WebSocket, sessionId: string): SessionState {
  const sessionState: SessionState = {
    ws,
    sessionId,
    sampleRate: 48000, // Default sample rate
    isInitialized: false,
    pcmPipe: new PassThrough()
  };
  
  activeSessions.set(ws, sessionState);
  return sessionState;
}

// Update session sample rate
export function updateSessionSampleRate(ws: WebSocket, sampleRate: number): boolean {
  const sessionState = activeSessions.get(ws);
  if (!sessionState) {
    return false;
  }
  
  // Validate sample rate
  if (sampleRate === 44100 || sampleRate === 48000 || sampleRate === 16000) {
    sessionState.sampleRate = sampleRate;
    sessionState.isInitialized = true;
    return true;
  }
  
  return false;
}

// Clean up session
export function cleanupSession(ws: WebSocket): void {
  const sessionState = activeSessions.get(ws);
  if (sessionState) {
    // Clean up PCM pipe
    if (sessionState.pcmPipe && !sessionState.pcmPipe.destroyed) {
      sessionState.pcmPipe.destroy();
    }
    
    // Remove from active sessions
    activeSessions.delete(ws);
  }
}

// Get session state
export function getSessionState(ws: WebSocket): SessionState | undefined {
  return activeSessions.get(ws);
}

// Get all active sessions
export function getAllActiveSessions(): Map<WebSocket, SessionState> {
  return new Map(activeSessions);
}

// Get session sample rate by WebSocket
export function getSessionSampleRate(socket: WebSocket): number | undefined {
  const sessionState = activeSessions.get(socket);
  return sessionState?.sampleRate;
}

// Get session by ID (for transcription service)
export function getSessionById(sessionId: string): SessionState | undefined {
  for (const [, sessionState] of activeSessions) {
    if (sessionState.sessionId === sessionId) {
      return sessionState;
    }
  }
  return undefined;
}