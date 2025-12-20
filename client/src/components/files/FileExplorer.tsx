import React from 'react';
import { FileText, X, Copy, Check } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';
import FileViewer from './FileViewer';
import SearchResults from './SearchResults';

const FileExplorer: React.FC = () => {
  const {
    selectedFile,
    searchResults,
    copied,
    copyToClipboard,
    setSelectedFile
  } = useProjectContext();

  return (
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
      <div className="p-6">
        {selectedFile ? <FileViewer /> : <SearchResults />}
      </div>
    </div>
  );
};

export default FileExplorer;