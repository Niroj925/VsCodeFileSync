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
  const onEventRef = useRef<EventCallback | undefined>(onEvent);

  // Keep onEventRef up to date without causing reconnections
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Connect once and register all event listeners
  useEffect(() => {
    if (socketRef.current) return; // Already connected

    console.log('Initializing WebSocket connection...');
    
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to backend via WebSocket');
      onEventRef.current?.('connect');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from backend:', reason);
      onEventRef.current?.('disconnect');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Application events
    const events: SocketEvent[] = [
      'projectSynced',
      'fileCreated',
      'fileUpdated',
      'fileDeleted',
      'folderCreated',
      'folderDeleted',
    ];

    events.forEach(event => {
      socket.on(event, (data: SocketEventData) => {
        // console.log(`📡 Received event: ${event}`, data);
        onEventRef.current?.(event, data);
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    disconnect,
  };
};