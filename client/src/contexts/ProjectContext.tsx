import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { useProjects } from '../hooks/useProjects';
import { useFileSearch } from '../hooks/useFileSearch';
import { useStats } from '../hooks/useStats';
import type { FileContent, FileTreeNode, Project, SearchResult } from '../types';

interface ProjectContextType {
  // State
  projects: Project[];
  selectedProject: string;
  selectedFile: FileContent | null;
  searchQuery: string;
  searchResults: SearchResult[];
  sidebarOpen: boolean;
  isSyncing: boolean;
  copied: boolean;
  stats: ReturnType<typeof useStats>['stats'];
  loading: boolean;

  // Actions
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileContent | null>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  setCopied: React.Dispatch<React.SetStateAction<boolean>>;

  // Functions
  loadProjects: () => Promise<Project[]>;
  handleProjectSelect: (projectName: string) => void;
  handleFileSelect: (project: string, filePath: string) => Promise<void>;
  handleSearch: (e?: React.FormEvent) => Promise<void>;
  handleSyncProject: () => void;
  copyToClipboard: (text: string) => void;
  loadProjectFiles: (projectName: string) => Promise<SearchResult[]>;
  debouncedLoadProjects: () => void;
  debouncedLoadStats: () => void;

  fileTree: Record<string, FileTreeNode>;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within ProjectProvider');
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [fileTree, setFileTree] = useState<Record<string, FileTreeNode>>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { projects, loading: projectsLoading, loadProjects: originalLoadProjects, loadProjectFiles: originalLoadProjectFiles } = useProjects();
  const { searchResults, loading: searchLoading, searchFiles, loadFileContent, setSearchResults } = useFileSearch();
  const { stats, calculateStats } = useStats(projects);

  // Debounced functions
  const debouncedLoadProjects = useRef(
    debounce(async () => { await originalLoadProjects(); }, 300)
  ).current;

  const debouncedLoadStats = useRef(
    debounce(() => calculateStats(), 300)
  ).current;

  // Build file tree
  const buildFileTree = useCallback((files: SearchResult[], projectName: string): FileTreeNode => {
    const root: FileTreeNode = { name: projectName, type: 'folder', path: '', project: projectName, children: {} };
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        if (!current.children![part]) {
          current.children![part] = { name: part, type: isFile ? 'file' : 'folder', path: parts.slice(0, index + 1).join('/'), project: projectName, children: isFile ? undefined : {} };
        }
        if (!isFile) current = current.children![part];
      });
    });
    return root;
  }, []);

  const handleProjectSelect = useCallback(async (projectName: string) => {
    setSelectedProject(projectName);

    try {
      const files = await originalLoadProjectFiles(projectName);
      const formattedFiles = files.map(f => ({ project: projectName, path: f.path, size: f.size, lastModified: f.lastModified }));
      setSearchResults(formattedFiles);

      const tree = buildFileTree(formattedFiles, projectName);
      setFileTree(prev => ({ ...prev, [projectName]: tree }));

      // Auto-expand first level
      setExpandedFolders(new Set(Object.keys(tree.children || {}).map(key => `${projectName}/${key}`)));
    } catch (err) {
      console.error(err);
    }
  }, [originalLoadProjectFiles, setSearchResults, buildFileTree]);

  const handleFileSelect = useCallback(async (project: string, filePath: string) => {
    try {
      const file = await loadFileContent(project, filePath);
      setSelectedFile({ ...file, project, filePath });
    } catch (err) {
      console.error(err);
    }
  }, [loadFileContent]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      if (selectedProject) handleProjectSelect(selectedProject);
      return;
    }
    await searchFiles(searchQuery, selectedProject);
  }, [searchQuery, selectedProject, searchFiles, handleProjectSelect]);

  const handleSyncProject = useCallback(() => {
    setIsSyncing(true);
    alert('Use VS Code extension to sync:\n1. Open project\n2. Right-click src folder\n3. Select "Sync File"');
    setIsSyncing(false);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const loadProjectFiles = useCallback(async (projectName: string): Promise<SearchResult[]> => {
    try {
      const files = await originalLoadProjectFiles(projectName);
      return files.map(f => ({ project: projectName, path: f.path, size: f.size, lastModified: f.lastModified }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [originalLoadProjectFiles]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      handleProjectSelect(projects[0].name);
    }
  }, [projects, selectedProject, handleProjectSelect]);

  useEffect(() => { calculateStats(); }, [projects, calculateStats]);

  const value: ProjectContextType = {
    projects,
    selectedProject,
    selectedFile,
    searchQuery,
    searchResults,
    sidebarOpen,
    isSyncing,
    copied,
    stats,
    loading: projectsLoading || searchLoading,

    setSelectedProject,
    setSelectedFile,
    setSearchQuery,
    setSidebarOpen,
    setIsSyncing,
    setCopied,

    loadProjects: originalLoadProjects,
    handleProjectSelect,
    handleFileSelect,
    handleSearch,
    handleSyncProject,
    copyToClipboard,
    loadProjectFiles,
    debouncedLoadProjects: debouncedLoadProjects as any,
    debouncedLoadStats: debouncedLoadStats as any,

    fileTree,
    expandedFolders,
    toggleFolder
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
