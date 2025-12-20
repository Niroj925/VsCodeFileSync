import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { BACKEND_URL } from '../utils/constants';
import type { SocketEvent, SocketEventData } from '../types';

type EventCallback = (event: SocketEvent, data?: SocketEventData) => void;

interface UseWebSocketReturn {
  socket: Socket | null;
  emit: (event: string, data?: any) => void;
  disconnect: () => void;
}

export const useWebSocket = (onEvent?: EventCallback): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to backend via WebSocket');
        onEvent?.('connect');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from backend');
        onEvent?.('disconnect');
      });

      const events: SocketEvent[] = [
        'projectSynced',
        'fileCreated',
        'fileUpdated',
        'fileDeleted',
        'folderCreated',
        'folderDeleted'
      ];

      events.forEach(event => {
        socketRef.current?.on(event, (data: SocketEventData) => {
          onEvent?.(event, data);
        });
      });
    }
  }, [onEvent]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    emit,
    disconnect
  };
};