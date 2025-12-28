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

// types/llm-response.ts

export type ChatBlockType =
  | "query"
  | "summary"
  | "analysis"
  | "text"
  | "list"
  | "code"
  | "warning";

export interface ChatBlock {
  type: ChatBlockType;
  content?: string;

  // Only for code blocks
  filePath?: string;
  language?: string;
}

export interface LLMResponse {
  success: boolean;

  /** Original user query */
  query: string;

  provider: string;
  model: string;

  /** Ordered blocks for UI rendering */
  blocks: ChatBlock[];

  timestamp: Date;
}
