import io, { Socket } from 'socket.io-client';
import { BACKEND_URL } from '../utils/constants';
import type { SocketEvent, SocketEventData, SocketService } from '../types';

class SocketServiceImpl implements SocketService {
  private socket: Socket | null = null;
  private listeners: Map<SocketEvent, Set<(data?: SocketEventData) => void>> = new Map();

  connect(): void {
    if (!this.socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.emitToListeners('connect');
      });

      this.socket.on('disconnect', () => {
        this.emitToListeners('disconnect');
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event: SocketEvent, callback: (data?: SocketEventData) => void): void {
    if (!this.socket) return;
    
    this.socket.on(event, callback);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: SocketEvent, callback: (data?: SocketEventData) => void): void {
    if (!this.socket || !this.listeners.has(event)) return;
    
    this.socket.off(event, callback);
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  private emitToListeners(event: SocketEvent, data?: SocketEventData): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => {
        callback(data);
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketServiceImpl();