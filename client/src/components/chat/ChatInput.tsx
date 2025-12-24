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
      const apiResponse = await sendMessage(input, selectedItems);

      if (apiResponse?.data) {
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
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-700 p-3">
      {error && (
        <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 rounded-lg flex justify-between">
          <span>{error}</span>
          <button onClick={clearError}>
            <X size={14} />
          </button>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-500 dark:bg-gray-800"
            >
              {item.type === "folder" ? <Folder size={14} className="text-yellow-500"/> : <FileText size={14} className="text-primary-500"/>}
              <span className="truncate max-w-[160px] text-gray-700 dark:text-gray-300">{item.path}</span>
              <button onClick={() => removeItem(item)}>
                <X className="text-gray-600 dark:text-gray-400 hover:text-red-500 " size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 ">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={isLoading ? "Sending..." : "Ask something…"}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={20} className="text-blue-400"/>}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
