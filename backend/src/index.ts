import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

import { transcriptionService } from './services/transcriptionService.js';
import { TranscriptionConfig, TranscriptionResult } from './types/index.js';

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const wss = new WebSocketServer({ server });

// Store active transcription sessions - integrated with AWS Transcribe
const activeSessions = new Map();

wss.on('connection', (ws, req) => {
  let started = false;
  let sessionId = `dev-session-id`; // or your own
  let pushAudio: ((u8: Uint8Array) => void) | null = null;
  let endAudio: (() => void) | null = null;

  console.log("WebSocket connection established", { sessionId });

  ws.on('message', async (data, isBinary) => {
    if (!started) {
      // Expect the very first message to be start JSON
      try {
        const msg = JSON.parse(data.toString());
        if (msg?.type !== 'start_transcription' || !['fr-CA','en-US'].includes(msg.languageCode)) {
          ws.send(JSON.stringify({ type: 'transcription_error', error: 'Invalid languageCode' }));
          return ws.close();
        }
        started = true;

        // Start AWS stream (non-blocking) and expose feeder immediately
        const { pushAudio: feeder, endAudio: ender } =
          transcriptionService.startStreamingTranscription(
            sessionId,
            { 
              language_code: msg.languageCode, 
              media_sample_rate_hz: msg.sampleRate ?? 16000, 
              show_speaker_labels: false 
            },
            (res) => ws.send(JSON.stringify({ 
              type: 'transcription_result', 
              resultId: res.resultId,                         // stable key
              startTime: res.startTime ?? null,
              endTime: res.endTime ?? null,
              text: res.transcript, 
              isFinal: !res.is_partial,
              language_detected: res.language_detected,
              confidence_score: res.confidence_score
            })),
            (err) => ws.send(JSON.stringify({ type: 'transcription_error', error: String(err) }))
          );

        pushAudio = feeder;
        endAudio = ender;

        // Store session info
        activeSessions.set(sessionId, { 
          ws, 
          pushAudio: feeder,
          endAudio: ender,
          config: msg
        });

        // Tell client to start mic now
        ws.send(JSON.stringify({ type: 'stream_ready' }));
      } catch {
        ws.send(JSON.stringify({ type: 'transcription_error', error: 'Expected start_transcription JSON' }));
        return ws.close();
      }
      return;
    }

    // After start: binary = audio; JSON = control
    if (isBinary) {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      if (buf.length && pushAudio) {
        // Optional debug:
        // console.log('chunk bytes:', buf.length);
        pushAudio(new Uint8Array(buf));
      }
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type === 'stop_transcription') endAudio?.();
    } catch {}
  });

  ws.on('close', () => {
    endAudio?.();
    
    // Clean up session
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
    }
    
    try {
      const status = transcriptionService.getStatus();
      console.log("Closed WebSocket. Transcription status:", status);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn("getStatus() not available:", errorMessage);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Clean up transcription service
  await transcriptionService.cleanup();
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
  console.log("📋 Phase 2: Raw PCM16 streaming implemented");
  console.log("🚀 Phase 3: AWS Transcribe integration active");
  console.log("🌍 AWS Region:", transcriptionService.getStatus().region);
  console.log("🎤 Ready for real-time transcription");
});
