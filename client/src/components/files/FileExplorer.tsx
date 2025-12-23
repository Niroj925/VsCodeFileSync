import React, { useState } from "react";
import { FileText, X, Copy, Check } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import FileViewer from "./FileViewer";
import ChatBox, { type Message } from "../chat/ChatBox";
import ChatInput from "../chat/ChatInput";

const STATIC_REPLY = "This is a static response from the assistant.";

const FileExplorer: React.FC = () => {
  const { selectedFile, searchResults, copied, copyToClipboard, setSelectedFile, selectedItems } =
    useProjectContext();

  const [messages, setMessages] = useState<Message[]>([]);

  // Send message
  // const handleSend = (text: string) => {
  //   if (!text.trim() && selectedItems.length === 0) return;

  //   const message =
  //     text +
  //     (selectedItems.length
  //       ? "\n\nFiles:\n" + selectedItems.map((i) => `- ${i.path}`).join("\n")
  //       : "");

  //   setMessages((prev) => [
  //     ...prev,
  //     { id: crypto.randomUUID(), role: "user", content: message },
  //     { id: crypto.randomUUID(), role: "assistant", content: STATIC_REPLY },
  //   ]);
  // };
  const handleSend = async (text: string) => {
  if (!text.trim() && selectedItems.length === 0) return;

  const payload = {
    message: text,
    files: selectedItems.map((i) => ({
      path: i.path, // ✅ plain path only
    })),
  };

  // 🔹 Send to backend (fire & forget)
  try {
    await fetch("http://localhost:5001/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Chat send failed:", err);
  }

  // 🔹 Update UI (local)
  setMessages((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      role: "user",
      content:
        text +
        (selectedItems.length
          ? "\n\nFiles:\n" +
            selectedItems.map((i) => `- ${i.path}`).join("\n")
          : ""),
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: STATIC_REPLY,
    },
  ]);
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
          </div>
        )}
    
      </div>

          <div>
              <ChatInput
              onSend={handleSend}
              // onRemoveItem={removeItem}
            />
        </div>
    </div>
  );
};

export default FileExplorer;
