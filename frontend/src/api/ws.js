import { useEffect, useRef, useState, useCallback } from 'react';
import { tokenStorage } from './client';

export function useWorkspaceSocket(workspaceId, onEvent) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!workspaceId) return;

    const token = tokenStorage.getAccess();
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In dev Vite proxy forwards /ws to Daphne port 8000
    const wsUrl = `${protocol}//${host}/ws/workspaces/${workspaceId}/?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (onEvent) {
            onEvent(payload);
          }
        } catch (err) {
          console.error("Failed to parse websocket event", err);
        }
      };

      ws.onclose = (e) => {
        setIsConnected(false);
        // Attempt reconnect after 3 seconds if not deliberately closed
        if (e.code !== 1000 && e.code !== 4001 && e.code !== 4003) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.warn("WebSocket connection error:", err);
    }
  }, [workspaceId, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect]);

  const sendEvent = useCallback((type, data = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  return { isConnected, sendEvent };
}
