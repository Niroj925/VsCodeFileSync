import React from "react";
import { FileText, X, Copy, Check } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import FileViewer from "./FileViewer";
import ChatBox from "../chat/ChatBox";

const FileExplorer: React.FC = () => {
  const {
    selectedFile,
    searchResults,
    copied,
    copyToClipboard,
    setSelectedFile,
  } = useProjectContext();

  return (
    <div className="glass-card rounded-xl flex flex-col h-full overflow-hidden">
      {/* ================= Header ================= */}
      <div
        className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50
                   bg-gray-50/70 dark:bg-gray-800/60 shrink-0"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {selectedFile
                ? selectedFile.filePath
                : `Files ${searchResults.length ? `(${searchResults.length})` : ""}`}
            </h2>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => copyToClipboard(selectedFile.content)}
                className="btn-secondary px-2 py-1 text-xs flex items-center gap-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                className="btn-secondary px-2 py-1 text-xs flex items-center gap-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= Content ================= */}
      <div className="flex-1 overflow-hidden">
        {selectedFile ? (
          <div className="h-full">
            <FileViewer />
          </div>
        ) : (
          // ChatBox handles messages + selected items internally
          <div className="h-full overflow-y-auto">
            <ChatBox />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
