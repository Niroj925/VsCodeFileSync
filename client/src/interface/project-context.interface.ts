import type { useStats } from "../hooks/useStats";
import type {
  FileContent,
  FileTreeNode,
  Project,
  SearchResult,
  SelectedItem,
} from "../types";
import type { ChatResponseData } from "../types/chat";

export interface ProjectContextType {
  // State
  projects: Project[];
  selectedProject: string;
  selectedFile: FileContent | null;
  searchQuery: string;
  searchResults: SearchResult[];
  sidebarOpen: boolean;
  isSyncing: boolean;
  copied: boolean;
  stats: ReturnType<typeof useStats>["stats"];
  loading: boolean;
  isOpenApiKeyModal: boolean;

  // Actions
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileContent | null>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  setCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOpenApiKeyModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Functions
  loadProjects: () => Promise<Project[]>;
  handleProjectSelect: (projectName: string) => void;
  handleFileSelect: (project: string, filePath: string) => Promise<void>;
  handleSearch: (e?: React.FormEvent) => Promise<void>;
  copyToClipboard: (text: string) => void;
  loadProjectFiles: (projectName: string) => Promise<SearchResult[]>;
  debouncedLoadProjects: () => void;
  debouncedLoadStats: () => void;

  fileTree: Record<string, FileTreeNode>;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;

  socketConnected: boolean;
  setSocketConnected: React.Dispatch<React.SetStateAction<boolean>>;

  selectedItems: SelectedItem[];
  addItem: (item: SelectedItem) => void;
  removeItem: (item: SelectedItem) => void;
  clearSelectedItems: () => void;

  chatResponse: ChatResponseData[];

  addChatResponse: (message: ChatResponseData) => void;
  addChatResponses: (messages: ChatResponseData[]) => void;
  clearChatResponse: () => void;
}
