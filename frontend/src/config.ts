// src/config.ts
const isProd = import.meta.env.PROD;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isProd
    ? 'https://api.alie.app'
    : 'http://localhost:3001');

export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (isProd
    ? 'wss://api.alie.app/ws'
    : 'ws://localhost:3001/ws');

// Runtime validation for WebSocket URL
if (!WS_URL.startsWith('ws')) {
  console.error('[WS] Invalid VITE_WS_URL; must be full ws(s):// URL including path, e.g. wss://api.alie.app/ws');
}