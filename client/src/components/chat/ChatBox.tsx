import React, { useRef, useEffect } from "react";
import { useProjectContext } from "../../contexts/ProjectContext";

const ChatBox: React.FC = () => {
  const { chatResponse } = useProjectContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponse]);

  const renderChatBlocks = (blocks: any[]) => {
    return blocks.map((block, blockIndex) => {
      switch (block.type) {
        case "query":
          return (
            <div key={blockIndex} className="flex flex-col max-w-[70%] ml-auto mb-2">
              <div className="px-4 py-2 rounded-lg text-sm bg-gray-600 text-white ml-auto">
                {block.content}
              </div>
            </div>
          );

        case "text":
        case "analysis":
        case "summary":
        case "list":
          return (
            <div key={blockIndex} className="flex flex-col mb-2">
              <div className="px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <div className="whitespace-pre-line">{block.content}</div>
              </div>
            </div>
          );

        case "code":
          return (
            <div key={blockIndex} className="flex flex-col mb-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                {block.filePath && block.filePath !== "unknown" && (
                  <div className="bg-gray-100 dark:bg-gray-800 text-xs px-3 py-2 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
                    {block.filePath}
                    {block.language && block.language !== "text" && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({block.language})
                      </span>
                    )}
                  </div>
                )}
                <pre className={`text-sm p-3 bg-white dark:bg-gray-900 whitespace-pre-wrap break-words rounded-b-lg ${
                  block.filePath ? "rounded-t-none" : "rounded-lg"
                } text-gray-800 dark:text-gray-200`}>
                  {block.content}
                </pre>
              </div>
            </div>
          );

        default:
          return null;
      }
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div 
        ref={containerRef}
        className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <div className="px-4 py-3 space-y-4 min-h-full">
          {chatResponse && chatResponse.length > 0 ? (
            chatResponse.map((msg, index) => {
              if (!msg.llmResponse) return null;
              
              const { llmResponse } = msg;
              
              return (
                <div key={index} className="space-y-4">
                  {/* User query */}
                  <div className="flex flex-col max-w-[70%] ml-auto">
                    <div className="px-4 py-2 rounded-lg text-sm bg-gray-600 text-white ml-auto">
                      {llmResponse.query}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-auto">
                      {formatTimestamp(llmResponse.timestamp)}
                    </div>
                  </div>
                  
                  {/* LLM response blocks (filter out the query block since we already show it) */}
                  <div className="space-y-3">
                    {renderChatBlocks(llmResponse.blocks.filter(b => b.type !== "query"))}
                    
                    {/* Provider info at the bottom of each response */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>Powered by {llmResponse.provider} ({llmResponse.model})</span>
                      <span>•</span>
                      <span>{formatTimestamp(llmResponse.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No messages yet. Start a conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;