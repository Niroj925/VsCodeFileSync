import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { CORS_ORIGIN } from './config/constants';

let io: Server;

export const setupSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log('🚀 Frontend connected via WebSocket, ID:', socket.id);

    socket.on('joinRoom', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leaveRoom', (room: string) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('clientEvent', (data: any) => {
      console.log('Received client event:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Frontend disconnected (${socket.id}):`, reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.error('Socket connection error:', err);
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call setupSocket first.');
  }
  return io;
};

export const emitToRoom = (room: string, event: string, data: any): void => {
  const io = getIO();
  io.to(room).emit(event, data);
};

export const emitToAll = (event: string, data: any): void => {
  const io = getIO();
  io.emit(event, data);
};

export const emitToSocket = (socketId: string, event: string, data: any): void => {
  const io = getIO();
  io.to(socketId).emit(event, data);
};