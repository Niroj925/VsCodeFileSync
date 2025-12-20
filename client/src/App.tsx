import React, { useEffect } from "react";
import { ProjectProvider, useProjectContext } from "./contexts/ProjectContext";
import { useWebSocket } from "./hooks/useWebSocket";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";
import FileExplorer from "./components/files/FileExplorer";
import type { SocketEvent, SocketEventData } from "./types";

const AppContent: React.FC = () => {
  const {
    selectedFile,
    debouncedLoadProjects,
    debouncedLoadStats,
    setSelectedFile,
  } = useProjectContext();

  // Setup WebSocket
  useWebSocket((event: SocketEvent, data?: SocketEventData) => {
    console.log(`WebSocket Event: ${event}`, data);

    switch (event) {
      case "projectSynced":
        debouncedLoadProjects();
        debouncedLoadStats();
        break;

      case "fileUpdated":
      case "fileCreated":
        // Auto-update open file if it matches
        if (
          selectedFile &&
          data &&
          selectedFile.project === data.project &&
          selectedFile.filePath === data.path
        ) {
          setSelectedFile((prev) => ({
            ...prev!,
            content: data.content || prev!.content,
            size: data.size || prev!.size,
            lastModified: data.lastModified || prev!.lastModified,
          }));
        }
        debouncedLoadProjects();
        debouncedLoadStats();
        break;

      case "fileDeleted":
        // Close currently open file if deleted
        if (
          selectedFile &&
          data &&
          selectedFile.project === data.project &&
          selectedFile.filePath === data.path
        ) {
          setSelectedFile(null);
        }
        debouncedLoadProjects();
        debouncedLoadStats();
        break;

      case "folderCreated":
      case "folderDeleted":
        debouncedLoadProjects();
        debouncedLoadStats();
        break;
    }
  });

  // Load projects on mount
  const { loadProjects } = useProjectContext();
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <div className="max-w-full mx-auto px-2 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />

          {/* <div className="flex-1">
            <SearchBar />
            <FileExplorer />
            {!selectedFile && <Instructions />}
          </div> */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">

            <div className="flex-1 overflow-auto min-h-0">
              <FileExplorer />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;
