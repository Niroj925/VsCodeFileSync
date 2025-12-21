import React, { useState } from "react";
import { Send, X, Folder, FileText } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";

const ChatInput: React.FC<{ onSend: (text: string) => void }> = ({
  onSend,
}) => {
  const { selectedItems, removeItem, handleFileSelect } = useProjectContext();
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim() && selectedItems.length === 0) return;

    const message =
      input +
      (selectedItems.length
        ? "\n\nFiles:\n" + selectedItems.map((i) => `- ${i.path}`).join("\n")
        : "");

    onSend(message);
    setInput("");
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-900/60 p-3">
      {/* Selected files */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map((item) => (
            <div
              key={`${item.project}-${item.path}`}
              onClick={() => handleFileSelect(item.project, item.path)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-800 hover:cursor-pointer"
            >
              {item.type === "folder" ? (
                <Folder size={12} />
              ) : (
                <FileText size={12} />
              )}
              <span className="truncate max-w-[160px]">{item.path}</span>
              <button onClick={() => removeItem(item)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something…"
          className="flex-1 bg-transparent outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          className="p-2 rounded-lg bg-primary-500 text-white"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
