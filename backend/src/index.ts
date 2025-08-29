import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

import { transcriptionService } from './services/transcriptionService.js';

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const wss = new WebSocketServer({ server });

// Store active transcription sessions
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  const sessionId = "dev-session-id";
  const userId = "dev-user-id";

  console.log("WebSocket connection established", { sessionId, userId });

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('WebSocket message received:', message.type);

      switch (message.type) {
        case 'start_transcription':
          await handleStartTranscription(ws, sessionId, message.payload);
          break;
        
        case 'stop_transcription':
          await handleStopTranscription(ws, sessionId);
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
          break;
        
        default:
          console.warn('Unknown WebSocket message type:', message.type);
          ws.send(JSON.stringify({
            type: 'error',
            payload: {
              error: 'UNKNOWN_MESSAGE_TYPE',
              message: `Unknown message type: ${message.type}`
            }
          }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: {
          error: 'MESSAGE_PROCESSING_ERROR',
          message: 'Failed to process message'
        }
      }));
    }
  });

  ws.on("close", () => {
    // Stop transcription if active
    if (activeSessions.has(sessionId)) {
      handleStopTranscription(ws, sessionId);
    }
    
    try {
      const status = transcriptionService.getStatus();
      console.log("Closed WebSocket. Transcription status:", status);
    } catch (err) {
      console.warn("getStatus() not available:", err.message);
    }
  });

  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    payload: {
      sessionId,
      timestamp: new Date()
    }
  }));
});

// Handle transcription start
async function handleStartTranscription(ws, sessionId, config) {
  try {
    console.log('Starting transcription for session:', sessionId);
    
    // Start simulated transcription
    const interval = setInterval(() => {
      if (!activeSessions.has(sessionId)) {
        clearInterval(interval);
        return;
      }

      const transcript = generateSimulatedTranscript();
      ws.send(JSON.stringify({
        type: 'transcription_result',
        data: {
          transcript,
          is_partial: false,
          confidence_score: 0.95,
          language_detected: 'fr-CA',
          timestamp: new Date()
        }
      }));
    }, 3000); // Send transcript every 3 seconds

    // Store session info
    activeSessions.set(sessionId, { ws, interval, config });
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'transcription_started',
      payload: { sessionId },
      timestamp: new Date()
    }));

    console.log('Transcription started for session:', sessionId);
  } catch (error) {
    console.error('Failed to start transcription:', error);
    ws.send(JSON.stringify({
      type: 'error',
      payload: {
        error: 'TRANSCRIPTION_START_FAILED',
        message: 'Failed to start transcription'
      }
    }));
  }
}

// Handle transcription stop
async function handleStopTranscription(ws, sessionId) {
  try {
    console.log('Stopping transcription for session:', sessionId);
    
    const session = activeSessions.get(sessionId);
    if (session) {
      clearInterval(session.interval);
      activeSessions.delete(sessionId);
    }
    
    ws.send(JSON.stringify({
      type: 'transcription_stopped',
      payload: { sessionId },
      timestamp: new Date()
    }));

    console.log('Transcription stopped for session:', sessionId);
  } catch (error) {
    console.error('Failed to stop transcription:', error);
  }
}

// Generate simulated French medical transcripts
function generateSimulatedTranscript() {
  const transcripts = [
    "Bonjour, comment allez-vous aujourd'hui?",
    "Je vais examiner votre blessure au travail.",
    "Pouvez-vous me décrire la douleur que vous ressentez?",
    "L'examen montre une amélioration de la mobilité.",
    "Nous allons continuer le traitement de réadaptation.",
    "La blessure semble bien guérir selon les radiographies.",
    "Je recommande de continuer les exercices de physiothérapie.",
    "Votre capacité de travail s'améliore progressivement.",
    "Nous devons évaluer votre retour au travail progressif.",
    "La douleur a diminué de manière significative.",
    "L'amplitude de mouvement est maintenant normale.",
    "Vous pouvez reprendre vos activités quotidiennes.",
    "Le pronostic de guérison est très favorable.",
    "Nous allons planifier votre retour au travail.",
    "La blessure ne présente plus de complications."
  ];
  
  return transcripts[Math.floor(Math.random() * transcripts.length)];
}

server.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
});
