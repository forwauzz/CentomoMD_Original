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

wss.on('connection', (ws, req) => {
  const sessionId = "dev-session-id";
  const userId = "dev-user-id";

  console.log("WebSocket connection established", { sessionId, userId });

  ws.on("close", () => {
    // Prevent crash if getStatus is missing
    try {
      const status = transcriptionService.getStatus();
      console.log("Closed WebSocket. Transcription status:", status);
    } catch (err) {
      console.warn("getStatus() not available:", err.message);
    }
  });
});

server.listen(3001, () => {
  console.log("✅ Backend listening on http://localhost:3001");
});
