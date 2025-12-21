export interface FileItem {
  path: string;
  fullPath?: string;
  size: number;
  lastModified: string;
  content?: string;
}

export interface FileContent extends FileItem {
  content: string;
  project: string;
  filePath: string;
}

export interface SearchResult {
  project: string;
  path: string;
  size: number;
  lastModified: string;
  snippet?: string;
}


export interface FileMetadata {
  size: number;
  lastModified: string;
  project: string;
  filePath: string;
}

export interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  project: string;
  children?: Record<string, FileTreeNode>;
}

export interface SelectedItem {
  type: "file" | "folder";
  project: string;
  path: string;
}

