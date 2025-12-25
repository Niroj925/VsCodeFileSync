import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import debounce from "lodash.debounce";
import { useProjects } from "../hooks/useProjects";
import { useFileSearch } from "../hooks/useFileSearch";
import { useStats } from "../hooks/useStats";
import type {
  FileContent,
  FileTreeNode,
  SearchResult,
  SelectedItem,
} from "../types";
import type { ChatResponseData } from "../types/chat";
import type { ProjectContextType } from "../interface/project-context.interface";

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context)
    throw new Error("useProjectContext must be used within ProjectProvider");
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOpenApiKeyModal, setIsOpenApiKeyModal] = useState(false);
  const [isOpenModelModal, setIsOpenModelModal] = useState(false);

  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [chatResponse, setChatResponse] = useState<ChatResponseData[]>([]);

  const addChatResponse = useCallback((message: ChatResponseData) => {
    setChatResponse((prev) => [...prev, message]);
  }, []);

  const addChatResponses = useCallback((messages: ChatResponseData[]) => {
    setChatResponse((prev) => [...prev, ...messages]);
  }, []);

  const clearChatResponse = useCallback(() => {
    setChatResponse([]);
  }, []);

  const [fileTree, setFileTree] = useState<Record<string, FileTreeNode>>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const {
    projects,
    loading: projectsLoading,
    loadProjects: originalLoadProjects,
    loadProjectFiles: originalLoadProjectFiles,
  } = useProjects();
  const {
    searchResults,
    loading: searchLoading,
    searchFiles,
    loadFileContent,
    setSearchResults,
  } = useFileSearch();
  const { stats, calculateStats } = useStats(projects);

  // Debounced functions
  const debouncedLoadProjects = useRef(
    debounce(async () => {
      await originalLoadProjects();
    }, 300)
  ).current;

  const debouncedLoadStats = useRef(
    debounce(() => calculateStats(), 300)
  ).current;

  // Build file tree
  const buildFileTree = useCallback(
    (files: SearchResult[], projectName: string): FileTreeNode => {
      const root: FileTreeNode = {
        name: projectName,
        type: "folder",
        path: "",
        project: projectName,
        children: {},
      };
      files.forEach((file) => {
        const parts = file.path.split("/");
        let current = root;
        parts.forEach((part, index) => {
          const isFile = index === parts.length - 1;
          if (!current.children![part]) {
            current.children![part] = {
              name: part,
              type: isFile ? "file" : "folder",
              path: parts.slice(0, index + 1).join("/"),
              project: projectName,
              children: isFile ? undefined : {},
            };
          }
          if (!isFile) current = current.children![part];
        });
      });
      return root;
    },
    []
  );

  const handleProjectSelect = useCallback(
    async (projectName: string) => {
      setSelectedProject(projectName);

      try {
        const files = await originalLoadProjectFiles(projectName);
        // now add type
        const formattedFiles: SearchResult[] = files.map((f) => ({
          project: projectName,
          path: f.path,
          size: f.size,
          lastModified: f.lastModified,
          type: f.path.endsWith("/") ? "folder" : "file", // basic detection
        }));
        setSearchResults(formattedFiles);

        const tree = buildFileTree(formattedFiles, projectName);
        setFileTree((prev) => ({ ...prev, [projectName]: tree }));

        // Auto-expand first level
        setExpandedFolders(
          new Set(
            Object.keys(tree.children || {}).map(
              (key) => `${projectName}/${key}`
            )
          )
        );
      } catch (err) {
        console.error(err);
      }
    },
    [originalLoadProjectFiles, setSearchResults, buildFileTree]
  );

  const handleFileSelect = useCallback(
    async (project: string, filePath: string) => {
      try {
        const file = await loadFileContent(project, filePath);
        setSelectedFile({ ...file, project, filePath });
      } catch (err) {
        console.error(err);
      }
    },
    [loadFileContent]
  );
  const clearSelectedItems = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchQuery.trim()) {
        if (selectedProject) handleProjectSelect(selectedProject);
        return;
      }
      await searchFiles(searchQuery, selectedProject);
    },
    [searchQuery, selectedProject, searchFiles, handleProjectSelect]
  );

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const loadProjectFiles = useCallback(
    async (projectName: string): Promise<SearchResult[]> => {
      try {
        const files = await originalLoadProjectFiles(projectName);

        return files.map((f) => ({
          project: projectName,
          path: f.path,
          size: f.size,
          lastModified: f.lastModified,
          type: f.path.endsWith("/") ? "folder" : "file",
        }));
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    [originalLoadProjectFiles]
  );

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const addItem = useCallback((item: SelectedItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.project === item.project && i.path === item.path)
        ? prev
        : [...prev, item]
    );
  }, []);

  const removeItem = useCallback((item: SelectedItem) => {
    setSelectedItems((prev) =>
      prev.filter((i) => i.project !== item.project || i.path !== item.path)
    );
  }, []);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      handleProjectSelect(projects[0].name);
    }
  }, [projects, selectedProject, handleProjectSelect]);

  useEffect(() => {
    calculateStats();
  }, [projects, calculateStats]);

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
    isOpenApiKeyModal,
    isOpenModelModal: false,

    setSelectedProject,
    setSelectedFile,
    setSearchQuery,
    setSidebarOpen,
    setIsSyncing,
    setCopied,
    setIsOpenApiKeyModal,
    setIsOpenModelModal,

    loadProjects: originalLoadProjects,
    handleProjectSelect,
    handleFileSelect,
    handleSearch,
    copyToClipboard,
    loadProjectFiles,
    debouncedLoadProjects: debouncedLoadProjects as any,
    debouncedLoadStats: debouncedLoadStats as any,

    fileTree,
    expandedFolders,
    toggleFolder,

    socketConnected,
    setSocketConnected,

    selectedItems,
    addItem,
    removeItem,
    clearSelectedItems,

    chatResponse,
    addChatResponse,
    addChatResponses,
    clearChatResponse,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
