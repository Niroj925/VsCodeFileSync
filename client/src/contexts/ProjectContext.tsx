import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import { useProjects } from '../hooks/useProjects';
import { useFileSearch } from '../hooks/useFileSearch';
import { useStats } from '../hooks/useStats';
import type { FileContent, Project, SearchResult } from '../types';

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
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const {
    projects,
    loading: projectsLoading,
    loadProjects: originalLoadProjects,
    loadProjectFiles: originalLoadProjectFiles
  } = useProjects();

  const {
    searchResults,
    loading: searchLoading,
    searchFiles,
    loadFileContent,
    setSearchResults
  } = useFileSearch();

  const { stats, calculateStats } = useStats(projects);

  // Create debounced versions
  const debouncedLoadProjects = useRef(
    debounce(async () => {
      await originalLoadProjects();
    }, 300)
  ).current;

  const debouncedLoadStats = useRef(
    debounce(() => {
      calculateStats();
    }, 300)
  ).current;

  const handleProjectSelect = useCallback(async (projectName: string) => {
    setSelectedProject(projectName);
    try {
      const files = await originalLoadProjectFiles(projectName);
      const formattedFiles: SearchResult[] = files.map(file => ({
        project: projectName,
        path: file.path,
        size: file.size,
        lastModified: file.lastModified
      }));
      setSearchResults(formattedFiles);
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  }, [originalLoadProjectFiles, setSearchResults]);

  const handleFileSelect = useCallback(async (project: string, filePath: string) => {
    try {
      const file = await loadFileContent(project, filePath);
      setSelectedFile({
        ...file,
        project,
        filePath
      });
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  }, [loadFileContent]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      if (selectedProject) {
        handleProjectSelect(selectedProject);
      }
      return;
    }
    await searchFiles(searchQuery, selectedProject);
  }, [searchQuery, selectedProject, searchFiles, handleProjectSelect]);

  const handleSyncProject = useCallback(async () => {
    setIsSyncing(true);
    try {
      alert('Please use the VS Code extension to sync your project.\n\n1. Open your project in VS Code\n2. Right-click on the src folder\n3. Select "Sync File"');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const loadProjectFiles = useCallback(async (projectName: string): Promise<SearchResult[]> => {
    try {
      const files = await originalLoadProjectFiles(projectName);
      return files.map(file => ({
        project: projectName,
        path: file.path,
        size: file.size,
        lastModified: file.lastModified
      }));
    } catch (error) {
      console.error('Failed to load project files:', error);
      return [];
    }
  }, [originalLoadProjectFiles]);

  // Calculate stats when projects change
  React.useEffect(() => {
    calculateStats();
  }, [projects, calculateStats]);

  const value: ProjectContextType = {
    // State
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
    
    // Actions
    setSelectedProject,
    setSelectedFile,
    setSearchQuery,
    setSidebarOpen,
    setIsSyncing,
    setCopied,
    
    // Functions
    loadProjects: originalLoadProjects,
    handleProjectSelect,
    handleFileSelect,
    handleSearch,
    handleSyncProject,
    copyToClipboard,
    loadProjectFiles,
    debouncedLoadProjects: debouncedLoadProjects as any,
    debouncedLoadStats: debouncedLoadStats as any
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};