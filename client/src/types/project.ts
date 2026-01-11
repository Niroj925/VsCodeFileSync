import type { FileContent, FileItem, SearchResult } from "./file";

export interface Project {
  name: string;
  fileCount: number;
  size?: number;
  lastSynced: string;
  rootPath?: string;
}

export interface ProjectStats {
  totalProjects: number;
  totalFiles: number;
  totalSize: number;
  formattedSize: string;
}

export interface ProjectService {
  getProjects: () => Promise<Project[]>;
  getProject: () => Promise<Project>;
  getProjectFiles: (projectName: string) => Promise<FileItem[]>;
  searchFiles: (query: string, project?: string) => Promise<SearchResult[]>;
  getFileContent: (project: string, filePath: string) => Promise<FileContent>;
  syncProject: (projectName: string) => Promise<void>;
}