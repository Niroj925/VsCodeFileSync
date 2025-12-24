import React from "react";
import { FileText, X, Copy, Check } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import FileViewer from "./FileViewer";
import ChatInput from "../chat/ChatInput";

const FileExplorer: React.FC = () => {
  const { selectedFile, searchResults, copied, copyToClipboard, setSelectedFile, chatResponse } =
    useProjectContext();

  return (
    <div className="glass-card rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-800/60 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold truncate">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {selectedFile ? (
          <FileViewer />
        ) : chatResponse && chatResponse.length > 0 ? (
          chatResponse.map((msg, index) => (
            <div key={index} className="flex flex-col max-w-[70%] ml-auto">
              {/* Message (API "message") */}
              {msg.message && (
                <div className="px-4 py-2 rounded-xl text-sm bg-primary-500 text-white ml-auto">
                  {msg.message}
                </div>
              )}

              {/* Files (API "files") */}
              {msg.files &&
                msg.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 font-medium">
                      {file.path}
                    </div>
                    <pre className="text-xs p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-auto">
                      {file.content}
                    </pre>
                  </div>
                ))}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">No messages yet</div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput />
    </div>
  );
};

export default FileExplorer;
