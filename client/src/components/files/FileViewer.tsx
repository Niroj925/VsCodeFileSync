import React, { useRef } from 'react';
import { Hash, Clock, Folder, Copy, Check } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { getFileIcon } from '../../utils/fileUtils';

const FileViewer: React.FC = () => {
  const {
    selectedFile,
    copied,
    copyToClipboard
  } = useProjectContext();

  const fileContentRef = useRef<HTMLDivElement>(null);


  if (!selectedFile) return null;

  return (
    <div className="space-y-6" ref={fileContentRef}>
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
  );
};

export default FileViewer;