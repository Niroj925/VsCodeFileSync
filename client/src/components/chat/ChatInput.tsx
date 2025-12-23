// components/chat/ChatInput.tsx
import { useState } from "react";
import { Send, X, Folder, FileText, Loader2 } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useChatApi } from "../../hooks/useChatApi";

const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const { selectedItems, removeItem } = useProjectContext();
  const [input, setInput] = useState("");
  const { sendMessage, isLoading, error, clearError } = useChatApi();

  const handleSubmit = async () => {
    console.log("🚀 [ChatInput] Submit triggered");
    
    if ((!input.trim() && selectedItems.length === 0) || isLoading) {
      console.log("⏸️ [ChatInput] Validation failed or already loading");
      return;
    }

    try {
      // Make the API call
      const apiResponse = await sendMessage(input, selectedItems);
      
      if (apiResponse) {
        console.log("✅ [ChatInput] API call successful, calling onSend");
        
        // Format the display message for UI
        const displayMessage = input + (selectedItems.length
          ? "\n\nFiles:\n" + selectedItems.map((i) => `- ${i.path}`).join("\n")
          : "");
        
        // Call parent's onSend with the display message
        onSend(displayMessage);
        
        // Clear the input
        setInput("");
      }
    } catch (err) {
      console.error("❌ [ChatInput] Error in handleSubmit:", err);
      // Error is already displayed via the hook's error state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("⌨️ [ChatInput] Enter key pressed");
      handleSubmit();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🖱️ [ChatInput] Send button clicked");
    handleSubmit();
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-900/60 p-3">
      {/* Error Display */}
      {error && (
        <div className="mb-3 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selected Files */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedItems.map((item) => (
            <div
              key={item.path}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-800"
            >
              {item.type === "folder" ? (
                <Folder size={12} />
              ) : (
                <FileText size={12} />
              )}
              <span className="truncate max-w-[160px]">{item.path}</span>
              <button 
                onClick={() => removeItem(item)}
                className="hover:text-red-500"
                disabled={isLoading}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "Sending..." : "Ask something…"}
          disabled={isLoading}
          className="flex-1 bg-transparent outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleButtonClick}
          disabled={isLoading || (!input.trim() && selectedItems.length === 0)}
          className={`p-2 rounded-lg transition-colors ${
            isLoading
              ? "bg-primary-400 cursor-wait"
              : (!input.trim() && selectedItems.length === 0)
              ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
              : "bg-primary-500 hover:bg-primary-600"
          } text-white`}
          title={isLoading ? "Sending..." : "Send message"}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;