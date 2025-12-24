export interface FileData {
  path: string;
  fullPath: string;
  content: string;
  size: number;
  lastModified: Date;
}

export interface Project {
  name: string;
  srcFolder: string;
  files: FileData[];
  lastSynced: Date;
}

export interface ChatRequest {
  message: string;
  files: Array<{
    path: string;
    type: 'file' | 'folder';
  }>;
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    files: Array<{
      path: string;
      content: string;
    }>;
  };
}

export interface SyncRequest {
  projectName: string;
  files: FileData[];
  srcFolder: string;
}

export interface SearchResult {
  project: string;
  path: string;
  fullPath: string;
  matchesInContent: boolean;
  matchesInPath: boolean;
  snippet: string;
  size: number;
}

export interface SocketEvent {
  type: 'fileCreated' | 'fileUpdated' | 'fileDeleted' | 'folderCreated' | 'projectSynced';
  data: any;
}

export interface FileEventData {
  project: string;
  path: string;
  content?: string;
  size?: number;
  lastModified?: Date;
}

export interface ProjectEventData {
  projectName: string;
  fileCount: number;
}