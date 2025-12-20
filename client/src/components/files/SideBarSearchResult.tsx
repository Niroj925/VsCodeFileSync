import React from 'react';
import { FileText } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';

const SidebarSearchResults: React.FC = () => {
  const {
    searchResults,
    searchQuery,
    handleFileSelect
  } = useProjectContext();

  if (!searchQuery || searchResults.length === 0) return null;

  return (
    <div className="px-2 mb-2">
      <div className="text-xs text-gray-500 mb-1">
        Results
      </div>

      <div className="max-h-32 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {searchResults.slice(0, 6).map((file) => (
          <div
            key={`${file.project}-${file.path}`}
            onClick={() => handleFileSelect(file.project, file.path)}
            className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="truncate text-gray-400">{file.path}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarSearchResults;
