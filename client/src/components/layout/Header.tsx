import React from 'react';
import { Menu, Code, Upload, Settings, Server, Users } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';

const Header: React.FC = () => {
  const { stats, sidebarOpen, setSidebarOpen, handleSyncProject } = useProjectContext();

  return (
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  VS Code File Sync
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time project file management
                </p>
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
            
            <button 
              onClick={handleSyncProject}
              className="btn-primary flex items-center space-x-2"
            >
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
  );
};

export default Header;