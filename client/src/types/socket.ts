export interface SocketEventData {
  project: string;
  path?: string;
  content?: string;
  size?: number;
  lastModified?: string;
}

export type SocketEvent =
  | "projectSynced"
  | "projectEmbeded"
  | "fileCreated"
  | "fileUpdated"
  | "fileDeleted"
  | "folderCreated"
  | "folderDeleted"
  | "connect"
  | "disconnect";

export interface SocketService {
  connect: () => void;
  disconnect: () => void;
  on: (event: SocketEvent, callback: (data?: SocketEventData) => void) => void;
  off: (event: SocketEvent, callback: (data?: SocketEventData) => void) => void;
  emit: (event: string, data?: any) => void;
  isConnected: () => boolean;
}
