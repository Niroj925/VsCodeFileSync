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

// File and project types (existing)
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

// Chat/LMM types
export interface ChatRequest {
  query: string;
  files: Array<{
    path: string;
    // type: 'file' | 'folder' | 'project';
    content?: string; // For direct content
  }>;
  projectName?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}
export type ChatBlockType =
  | "query"
  | "summary"
  | "analysis"
  | "text"
  | "list"
  | "code"
  | "warning"
  | "file-structure";  

export interface ChatBlock {
  type: ChatBlockType;
  content?: string;
  filePath?: string;
  language?: string;
}

export interface LLMResponse {
  success: boolean;
  query: string;
  provider: string;
  model: string;
  blocks: ChatBlock[];
  timestamp: Date;
}


export type ChunkData = {
  symbol: string;
  filePath: string;
  type: "class-method" | "function" | "react-component";
  lineRange: [number, number];
  calls: string[];
  content: string;
};

export type StoredData = {
  projectName: string;
  path:string;
  chunks: ChunkData[];
};

export type UpdateFileChunkInput = {
  projectName: string;
  srcFolder: string;
  filePath: string;
  relativePath: string;
  content: string;
};