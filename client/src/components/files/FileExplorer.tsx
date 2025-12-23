// components/FileExplorer.tsx
import React, { useState } from "react";
import { FileText, X, Copy, Check } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import FileViewer from "./FileViewer";
import ChatBox, { type Message } from "../chat/ChatBox";
import ChatInput from "../chat/ChatInput";
import { useChatApi } from "../../hooks/useChatApi";

const STATIC_REPLY = "This is a static response from the assistant.";

const FileExplorer: React.FC = () => {
  const { selectedFile, searchResults, copied, copyToClipboard, setSelectedFile } =
    useProjectContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const { isLoading: isApiLoading } = useChatApi(); // Get loading state from hook

  // Handle sending - ONLY updates UI, NO API calls here
  const handleSend = (text: string) => {
    console.log("📝 [FileExplorer] handleSend called with text:", text);
    
    if (!text.trim()) {
      console.log("⏸️ [FileExplorer] Empty text, skipping");
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    // Add static assistant response (immediate)
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: STATIC_REPLY,
    };

    console.log("💬 [FileExplorer] Adding messages to chat");
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

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
          <FileViewer />
        ) : (
          <div className="h-full flex flex-col">
            <ChatBox messages={messages} />
            {isApiLoading && (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Sending message...
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= Chat Input ================= */}
      <div>
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default FileExplorer;