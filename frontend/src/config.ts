// src/config.ts
const isProd = import.meta.env.PROD;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isProd
    ? 'https://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net'
    : 'http://localhost:3001');

export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (isProd
    ? 'wss://centomomd-behsfacjb8c2adef.canadacentral-01.azurewebsites.net/ws'
    : 'ws://localhost:3001/ws');
