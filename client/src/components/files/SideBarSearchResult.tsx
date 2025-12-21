import React from "react";
import { FileText, Plus } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";

const SidebarSearchResults: React.FC = () => {
  const { searchResults, searchQuery, addItem, selectedItems, handleFileSelect } =
    useProjectContext();

  if (!searchQuery || searchResults.length === 0) return null;

  return (
    <div className="px-2 mb-2">
      <div className="text-xs text-gray-500 mb-1">Results</div>

      <div
        className="max-h-40 overflow-y-auto rounded-md
                   border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800"
      >
        {searchResults.slice(0, 8).map((file) => {
          const isAdded = selectedItems.some(
            (f) => f.project === file.project && f.path === file.path
          );

          return (
            <div
              key={`${file.project}-${file.path}`}
              onClick={() => handleFileSelect(file.project, file.path)}
              className="group flex items-center gap-2 px-2 py-1.5 text-sm
                         cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />

              <span className="truncate text-gray-400 flex-1">{file.path}</span>

              {/* Add icon */}
              {!isAdded && (
                <Plus
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem({
                      type: "file",
                      project: file.project,
                      path: file.path,
                    });
                  }}
                  className="
                    h-4 w-4
                    opacity-0 scale-75
                    text-gray-400
                    transition-all duration-200
                    group-hover:opacity-100
                    hover:text-blue-500
                    hover:scale-125
                    cursor-pointer
                  "
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarSearchResults;
