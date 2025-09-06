import { useState, useRef, useCallback, useEffect } from 'react';
import { WebSocketMessage, UseWebSocketReturn } from '@/types';
import { createWebSocketUrl } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

export const useWebSocket = (onMessage?: (message: any) => void): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000;

  const connect = useCallback(async () => {
    try {
      // TODO: Get WS token if auth is required
      let wsUrl = createWebSocketUrl('/ws/transcription');
      
      try {
        const config = await apiFetch('/api/config');
        if (config.wsRequireAuth) {
          // TODO: Get WS token from auth endpoint
          const tokenResponse = await apiFetch('/api/auth/ws-token', {
            method: 'POST',
          });
          
          if (tokenResponse.wsToken) {
            // Standardize on ws_token parameter
            wsUrl += `?ws_token=${encodeURIComponent(tokenResponse.wsToken)}`;
          }
        }
      } catch (error) {
        console.warn('Failed to get WS token, proceeding without auth:', error);
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        console.log('WebSocket connected');

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const pingMessage: WebSocketMessage = {
              type: 'ping',
              // timestamp: Date.now(),
            };
            ws.send(JSON.stringify(pingMessage));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected:', event.code, event.reason);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = undefined;
        }

        // Attempt reconnection if not a normal closure
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          setError('Connection lost. Attempting to reconnect...');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts)); // Exponential backoff
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong messages
          if (message.type === 'pong') {
            return;
          }

          // Handle other messages
          console.log('WebSocket message received:', message);
          
          // Pass message to callback if provided
          if (onMessage) {
            onMessage(message);
          }
          
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', parseError);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  }, [reconnectAttempts, onMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    setIsConnected(false);
    setError(null);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        setError('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not connected');
      setError('WebSocket is not connected');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    connect();
  }, [disconnect, connect]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
      const timeout = setTimeout(() => {
        connect();
      }, reconnectDelay * Math.pow(2, reconnectAttempts));

      return () => clearTimeout(timeout);
    }
  }, [isConnected, reconnectAttempts, connect]);

  return {
    isConnected,
    sendMessage,
    error,
    reconnect,
  };
};
