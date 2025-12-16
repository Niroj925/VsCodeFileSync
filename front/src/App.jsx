import React, { useState, useEffect,useRef,useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Search,
  Folder,
  FileText,
  Code,
  Upload,
  Download,
  RefreshCw,
  X,
  ChevronRight,
  Clock,
  Hash,
  Globe,
  Server,
  Users,
  Zap,
  Star,
  BookOpen,
  Eye,
  Filter,
  ChevronDown,
  Home,
  Settings,
  Bell,
  User,
  Menu,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import debounce from 'lodash.debounce';

const BACKEND_URL = 'http://localhost:5001';

function App() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [socket, setSocket] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalFiles: 0,
    totalSize: 0
  });
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileContentRef = useRef(null);


  const loadProjects = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/projects`);
      setProjects(response.data.projects);
      if (response.data.projects.length > 0 && !selectedProject) {
        setSelectedProject(response.data.projects[0].name);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadStats = async () => {
    // Calculate stats from projects
    const totalProjects = projects.length;
    const totalFiles = projects.reduce((sum, project) => sum + project.fileCount, 0);
    const totalSize = projects.reduce((sum, project) => sum + (project.size || 0), 0);
    
    setStats({ totalProjects, totalFiles, totalSize });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // If empty search, show all files of selected project
      if (selectedProject) {
        loadProjectFiles(selectedProject);
      }
      return;
    }

    setLoading(true);
    try {
      const params = { query: searchQuery };
      if (selectedProject) {
        params.project = selectedProject;
      }

      const response = await axios.get(`${BACKEND_URL}/api/search`, { params });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (project, filePath) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/file`, {
        params: { project, filePath }
      });
      
      setSelectedFile({
        ...response.data.file,
        project: project,
        filePath: filePath
      });

      // Scroll to file content
      if (fileContentRef.current) {
        fileContentRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const loadProjectFiles = async (projectName) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/project/${projectName}/files`);
      setSearchResults(response.data.files.map(file => ({
        project: projectName,
        path: file.path,
        size: file.size,
        lastModified: file.lastModified
      })));
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  const handleSyncProject = async () => {
    setIsSyncing(true);
    try {
      alert('Please use the VS Code extension to sync your project.\n\n1. Open your project in VS Code\n2. Right-click on the src folder\n3. Select "Sync File"');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


const debouncedLoadProjects = useMemo(() => debounce(loadProjects, 300), []);
const debouncedLoadStats = useMemo(() => debounce(loadStats, 300), []);


useEffect(() => {
  // Initialize WebSocket connection
  const newSocket = io(BACKEND_URL, {
    transports: ['websocket', 'polling']
  });
  setSocket(newSocket);

  // Event: Project fully synced
  newSocket.on('projectSynced', (data) => {
    console.log('Project synced:', data);
    debouncedLoadProjects();
    debouncedLoadStats();
    setIsSyncing(false);
  });

  // Event: File created
  newSocket.on('fileCreated', (data) => {
    console.log('File created:', data);

    // Auto-update open file if it matches
    if (
      selectedFile &&
      selectedFile.project === data.project &&
      selectedFile.filePath === data.path
    ) {
      setSelectedFile(prev => ({
        ...prev,
        content: data.content,
        size: data.size,
        lastModified: data.lastModified
      }));
    }

    debouncedLoadProjects();
    debouncedLoadStats();
  });

  // Event: Folder created
  newSocket.on('folderCreated', (data) => {
    console.log('Folder created:', data);
    debouncedLoadProjects();
    debouncedLoadStats();
  });

  // Event: File updated
  newSocket.on('fileUpdated', (data) => {
    console.log('File updated:', data);

    // Update currently open file live
    if (
      selectedFile &&
      selectedFile.project === data.project &&
      selectedFile.filePath === data.path
    ) {
      setSelectedFile(prev => ({
        ...prev,
        content: data.content,
        size: data.size,
        lastModified: data.lastModified
      }));
    }

    debouncedLoadProjects();
    debouncedLoadStats();
  });

  // Event: File deleted
  newSocket.on('fileDeleted', (data) => {
    console.log('File deleted:', data);

    // Close currently open file if deleted
    if (
      selectedFile &&
      selectedFile.project === data.project &&
      selectedFile.filePath === data.path
    ) {
      setSelectedFile(null);
    }

    debouncedLoadProjects();
    debouncedLoadStats();
  });

  // Event: Folder deleted
  newSocket.on('folderDeleted', (data) => {
    console.log('Folder deleted:', data);
    debouncedLoadProjects();
    debouncedLoadStats();
  });

  newSocket.on('connect', () => {
    console.log('Connected to backend via WebSocket');
  });

  newSocket.on('disconnect', () => {
    console.log('Disconnected from backend');
  });

  return () => {
    newSocket.disconnect();
    debouncedLoadProjects.cancel();
    debouncedLoadStats.cancel();
  };
}, [selectedFile]);


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
      js: '🟨', ts: '🔷', jsx: '⚛️', tsx: '⚛️',
      html: '🌐', css: '🎨', scss: '🎨', json: '📋',
      md: '📝', txt: '📄', py: '🐍', java: '☕',
      cpp: '⚙️', c: '⚙️', go: '🐹', rs: '🦀',
      php: '🐘', rb: '💎', swift: '🐦', kt: '🔧'
    };
    return icons[ext] || '📄';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden mr-2"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-2 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">VS Code File Sync</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real-time project file management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                  <Server className="h-3 w-3" />
                  <span>Backend: Connected</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                  <Users className="h-3 w-3" />
                  <span>{stats.totalProjects} Projects</span>
                </div>
              </div>
              
              <button className="btn-primary flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Sync Project</span>
              </button>
              
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Folder className="h-5 w-5 mr-2 text-primary-500" />
                    Projects
                  </h2>
                  <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {projects.length}
                  </span>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {projects.map((project) => (
                    <div
                      key={project.name}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedProject === project.name
                          ? 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800'
                          : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        setSelectedProject(project.name);
                        loadProjectFiles(project.name);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            selectedProject === project.name
                              ? 'bg-primary-100 dark:bg-primary-900'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <Code className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {project.fileCount} files
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                          selectedProject === project.name ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(project.lastSynced)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {projects.length === 0 && (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Folder className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">No projects synced yet</p>
                      <button
                        onClick={handleSyncProject}
                        disabled={isSyncing}
                        className="btn-primary w-full flex items-center justify-center space-x-2"
                      >
                        {isSyncing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span>{isSyncing ? 'Syncing...' : 'Sync First Project'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats.totalProjects}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Projects</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {stats.totalFiles}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Files</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl col-span-2">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatFileSize(stats.totalSize)}
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Total Size</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files, code, or content..."
                        className="input-field pl-12 pr-4 py-3 text-lg"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <X className="h-5 w-5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="input-field py-3 pr-10 appearance-none"
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => (
                      <option key={project.name} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="btn-primary px-6 py-3 flex items-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                    <span>{loading ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchQuery('function')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  function
                </button>
                <button
                  onClick={() => setSearchQuery('import')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  import
                </button>
                <button
                  onClick={() => setSearchQuery('const')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  const
                </button>
                <button
                  onClick={() => setSearchQuery('class')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  class
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedFile ? 'File Viewer' : `Files ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`}
                    </h2>
                    {selectedFile && (
                      <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {selectedFile.project}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedFile && (
                      <>
                        <button
                          onClick={() => copyToClipboard(selectedFile.content)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Close</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6" ref={fileContentRef}>
                {selectedFile ? (
                  <div className="space-y-6">
                    {/* File Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-mono font-semibold text-gray-900 dark:text-white">
                            {selectedFile.filePath}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <Hash className="h-4 w-4 mr-1" />
                              {formatFileSize(selectedFile.size)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(selectedFile.lastModified)}
                            </span>
                            <span className="flex items-center">
                              <Folder className="h-4 w-4 mr-1" />
                              {selectedFile.project}
                            </span>
                          </div>
                        </div>
                        <div className="text-4xl">
                          {getFileIcon(selectedFile.filePath)}
                        </div>
                      </div>
                    </div>

                    {/* File Content */}
                    <div className="relative">
                      <div className="absolute top-0 right-0 z-10">
                        <button
                          onClick={() => copyToClipboard(selectedFile.content)}
                          className="btn-secondary flex items-center space-x-2 m-4"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                      <pre className="code-block mt-2 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed">
                        <code className="font-mono">
                          {selectedFile.content}
                        </code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mb-6">
                          <Search className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No files to display
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                          {selectedProject 
                            ? `Select a project and start searching, or use the VS Code extension to sync your project.`
                            : 'Select a project from the sidebar or sync a new project to get started.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={handleSyncProject}
                            className="btn-primary flex items-center justify-center space-x-2"
                          >
                            <Upload className="h-4 w-4" />
                            <span>Sync Project from VS Code</span>
                          </button>
                          <button
                            onClick={() => selectedProject && loadProjectFiles(selectedProject)}
                            className="btn-secondary flex items-center justify-center space-x-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh Files</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {searchResults.map((result, index) => (
                          <div
                            key={`${result.project}-${result.path}-${index}`}
                            onClick={() => loadFileContent(result.project, result.path)}
                            className="card-hover p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20">
                                  <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-mono font-medium text-gray-900 dark:text-white">
                                      {result.path}
                                    </h4>
                                    <span className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      {result.project}
                                    </span>
                                  </div>
                                  
                                  {result.snippet && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                      {result.snippet}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center">
                                      <Hash className="h-3 w-3 mr-1" />
                                      {formatFileSize(result.size)}
                                    </span>
                                    {result.lastModified && (
                                      <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatDate(result.lastModified)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            {!selectedFile && (
              <div className="glass-card rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary-500" />
                  How to Use
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                      <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Install Extension</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Copy the VS Code extension to your extensions folder or run in development mode.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Sync Project</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Right-click your src folder in VS Code and select "Sync Project to Backend".
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                      <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. View & Search</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse and search your synced files in this web interface.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200/50 dark:border-gray-700/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                VS Code File Sync • Backend: {BACKEND_URL}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Documentation
              </button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                GitHub
              </button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Settings
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;