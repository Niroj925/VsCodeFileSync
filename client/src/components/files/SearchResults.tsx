import React from 'react';
import { FileText, Hash, Clock, ChevronRight, Search, Upload, RefreshCw } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { formatFileSize, formatDate } from '../../utils/formatters';

const SearchResults: React.FC = () => {
  const {
    searchResults,
    selectedProject,
    handleFileSelect,
    handleSyncProject,
    loadProjectFiles
  } = useProjectContext();

  if (searchResults.length === 0) {
    return (
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
    );
  }

  return (
    <div className="grid gap-4">
      {searchResults.map((result, index) => (
        <div
          key={`${result.project}-${result.path}-${index}`}
          onClick={() => handleFileSelect(result.project, result.path)}
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
  );
};

export default SearchResults;