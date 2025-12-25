import React from "react";
import { X, Copy, Check, FileText } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import FileViewer from "./FileViewer";
import ChatInput from "../chat/ChatInput";
import ChatBox from "../chat/ChatBox";

const FileExplorer: React.FC = () => {
  const { selectedFile, copied, copyToClipboard, setSelectedFile } =
    useProjectContext();

  return (
    <div className="glass-card rounded-xl flex flex-col h-full min-h-[calc(100vh-80px)]">
 {selectedFile && (
  <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-800/60 shrink-0">
    <div className="flex items-center justify-between gap-3">
      
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={16} className="text-blue-500 shrink-0" />
        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
          {selectedFile.filePath}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => copyToClipboard(selectedFile.content)}
          className="btn-secondary px-2 py-1 text-xs flex items-center gap-1"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>

        <button
          onClick={() => setSelectedFile(null)}
          className="btn-secondary px-2 py-1 text-xs"
        >
          <X size={14} />
        </button>
      </div>

    </div>
  </div>
)}


      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {selectedFile ? <FileViewer /> : <ChatBox />}
        </div>

        <div className="shrink-0 border-t border-gray-200/50 dark:border-gray-700/50">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
