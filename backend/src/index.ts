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
        
        case 'audio_chunk':
          await handleAudioChunk(ws, sessionId, message.payload);
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
    
    // Store session info
    activeSessions.set(sessionId, { 
      ws, 
      config,
      audioChunks: [],
      lastAudioTime: Date.now(),
      isProcessingAudio: false
    });
    
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
      // Process any remaining audio chunks
      if (session.audioChunks.length > 0) {
        await processAudioChunks(session);
      }
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

// Handle audio chunk from frontend
async function handleAudioChunk(ws, sessionId, audioData) {
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      console.warn('No active session for audio chunk:', sessionId);
      return;
    }

    // Store audio chunk
    session.audioChunks.push({
      data: audioData.audioData,
      timestamp: audioData.timestamp,
      sampleRate: audioData.sampleRate || 16000,
      channelCount: audioData.channelCount || 1
    });

    // Process audio chunks if we have enough data or enough time has passed
    const now = Date.now();
    const timeSinceLastProcess = now - session.lastAudioTime;
    
    if (session.audioChunks.length >= 10 || timeSinceLastProcess > 2000) {
      await processAudioChunks(session);
      session.lastAudioTime = now;
    }

  } catch (error) {
    console.error('Error handling audio chunk:', error);
  }
}

// Process accumulated audio chunks
async function processAudioChunks(session) {
  if (session.isProcessingAudio || session.audioChunks.length === 0) {
    return;
  }

  session.isProcessingAudio = true;

  try {
    console.log(`Processing ${session.audioChunks.length} audio chunks`);
    
    // For now, we'll simulate transcription based on audio chunks
    // In a real implementation, this would send to AWS Transcribe or similar
    const hasAudio = session.audioChunks.some(chunk => 
      chunk.data.some(byte => byte !== 0)
    );

    if (hasAudio) {
      // Generate transcript based on audio activity
      const transcript = generateTranscriptFromAudio(session.audioChunks);
      
      session.ws.send(JSON.stringify({
        type: 'transcription_result',
        data: {
          transcript,
          is_partial: false,
          confidence_score: 0.92,
          language_detected: 'fr-CA',
          timestamp: new Date()
        }
      }));
    }

    // Clear processed chunks
    session.audioChunks = [];

  } catch (error) {
    console.error('Error processing audio chunks:', error);
  } finally {
    session.isProcessingAudio = false;
  }
}

// Generate transcript based on audio activity (simulated)
function generateTranscriptFromAudio(audioChunks) {
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
  
  // Use audio activity to determine which transcript to return
  const totalAudioActivity = audioChunks.reduce((sum, chunk) => {
    return sum + chunk.data.reduce((chunkSum, byte) => chunkSum + Math.abs(byte), 0);
  }, 0);
  
  const index = Math.floor(totalAudioActivity / 1000) % transcripts.length;
  return transcripts[index];
}

server.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
});
