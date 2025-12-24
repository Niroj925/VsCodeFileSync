import { useState } from "react";
import { Send, X, Folder, FileText, Loader2 } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useChatApi } from "../../hooks/useChatApi";

const ChatInput: React.FC = () => {
  const { selectedItems, removeItem, addChatResponse } = useProjectContext();
  const [input, setInput] = useState("");
  const { sendMessage, isLoading, error, clearError } = useChatApi();

  const handleSubmit = async () => {
    if ((!input.trim() && selectedItems.length === 0) || isLoading) return;

    try {
      // Add user message to context first
      if (input.trim() || selectedItems.length) {
        const userMessage = {
          message: input,
          files: selectedItems.map((i) => ({ path: i.path, content: "" })),
        };
        addChatResponse({ ...userMessage });
      }

      const apiResponse = await sendMessage(input, selectedItems);

      if (apiResponse?.data) {
        // Extract assistant message
        const assistantData = apiResponse.data as {
          message: string;
          files: { path: string; content: string }[];
        };

        addChatResponse({
          message: assistantData.message,
          files: assistantData.files,
        });

        setInput("");
      }
    } catch (err) {
      console.error("Chat submit error:", err);
    }
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-900/60 p-3">
      {error && (
        <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={clearError}>
            <X size={14} />
          </button>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-800"
            >
              {item.type === "folder" ? <Folder size={12} /> : <FileText size={12} />}
              <span className="truncate max-w-[160px]">{item.path}</span>
              <button onClick={() => removeItem(item)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={isLoading ? "Sending..." : "Ask something…"}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="p-2 rounded-lg bg-primary-500 text-white"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
