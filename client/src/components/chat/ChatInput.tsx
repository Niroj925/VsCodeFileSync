import { useState } from "react";
import { Send, X, Folder, FileText, Loader2 } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useChatApi } from "../../hooks/useChatApi";

const ChatInput: React.FC = () => {
  const {
    selectedItems,
    removeItem,
    addChatResponse,
    clearSelectedItems,
    setSelectedFile,
  } = useProjectContext();
  const [input, setInput] = useState("");
  const { sendMessage, sendQuery, isLoading } = useChatApi();

  const handleSubmit = async () => {
    if ((!input.trim() && selectedItems.length === 0) || isLoading) return;

    try {
      const apiResponse =
        selectedItems.length > 0
          ? await sendMessage(input, selectedItems)
          : await sendQuery(input);
      if (apiResponse?.success) {
        addChatResponse({
          llmResponse: apiResponse,
        });
      }
      clearSelectedItems();
      setSelectedFile(null);
      setInput("");
    } catch (err) {
      console.error("Chat submit error:", err);
      addChatResponse({
        llmResponse: {
          success: false,
          query: input,
          provider: "system",
          model: "error",
          timestamp: new Date(),
          blocks: [
            {
              type: "text",
              content: "Error: Failed to get response from the assistant.",
            },
          ],
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-700 p-3 rounded-2xl m-2">
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-500 dark:bg-gray-800"
            >
              {item.type === "folder" ? (
                <Folder size={14} className="text-yellow-500" />
              ) : (
                <FileText size={14} className="text-primary-500" />
              )}
              <span className="truncate max-w-[160px] text-gray-700 dark:text-gray-300">
                {item.path}
              </span>
              <button
                onClick={() => removeItem(item)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Sending..." : "Ask something…"}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!input.trim() && selectedItems.length === 0)}
          className={`p-2 rounded-full transition-colors ${
            isLoading || (!input.trim() && selectedItems.length === 0)
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={20} className="text-blue-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
