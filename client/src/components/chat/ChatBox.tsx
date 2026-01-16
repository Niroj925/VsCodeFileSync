import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useFile } from "../../hooks/useFile";

const ChatBox: React.FC = () => {

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [copiedBlocks, setCopiedBlocks] = useState<Record<string, boolean>>({});
  const [usedBlocks, setUsedBlocks] = useState<Record<string, boolean>>({});

    const { chatResponse } = useProjectContext();
  const {keepFileContentChange}=useFile()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponse]);

  const handleCopyCode = async (content: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(content);

      setCopiedBlocks((prev) => ({
        ...prev,
        [blockId]: true,
      }));

      setTimeout(() => {
        setCopiedBlocks((prev) => ({
          ...prev,
          [blockId]: false,
        }));
      }, 3000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleUseBlock = async (payload: {
    content: string;
    filePath: string;
    blockId: string;
  }) => {
    const { content, filePath, blockId } = payload;
    console.log("payload:", payload);
    keepFileContentChange(filePath,content)
    setUsedBlocks((prev) => ({
      ...prev,
      [blockId]: true,
    }));

    setTimeout(() => {
      setUsedBlocks((prev) => ({
        ...prev,
        [blockId]: false,
      }));
    }, 3000);
  };
  const renderChatBlocks = (blocks: any[], messageIndex: number) => {
    return blocks.map((block, blockIndex) => {
      const blockId = `msg-${messageIndex}-block-${blockIndex}`;
      const isCopied = copiedBlocks[blockId] || false;

      switch (block.type) {
        case "text":
        case "analysis":
        case "summary":
        case "list":
          return (
            <div key={blockId} className="flex flex-col mb-2">
              <div className="px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                <div className="whitespace-pre-line">{block.content}</div>
              </div>
            </div>
          );

        case "code": {
          const isUsed = usedBlocks[blockId] || false;

          return (
            <div key={blockId} className="flex flex-col mb-2 relative">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                {block.filePath && block.filePath !== "unknown" && (
                  <div className="bg-gray-100 dark:bg-gray-800 text-xs px-3 py-2 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 rounded-t-lg flex justify-between items-center">
                    <div>
                      {block.filePath}
                      {block.language && block.language !== "text" && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({block.language})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(block.content, blockId)}
                        className={`p-1 rounded transition-colors ${
                          isCopied
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                        title={isCopied ? "Copied!" : "Copy code"}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      <button
                        disabled={isUsed}
                        onClick={() =>
                          handleUseBlock({
                            content: block.content,
                            filePath: block.filePath,
                            blockId,
                          })
                        }
                        className={`px-2 py-0.5 text-xs rounded transition ${
                          isUsed
                            ? "bg-blue-900 text-white cursor-not-allowed"
                            : "bg-blue-100 text-blue-900 hover:bg-blue-900 hover:text-white"
                        }`}
                      >
                        {/* {isUsed ? "kept" : "keep"} */}
                        keep
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <pre
                    className={`text-sm p-3 bg-white dark:bg-gray-900 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 ${
                      block.filePath ? "rounded-b-lg" : "rounded-lg"
                    }`}
                  >
                    {block.content}
                  </pre>
                </div>
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    });
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div
        ref={containerRef}
        className="flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <div className="px-4 py-3 space-y-4 min-h-full">
          {chatResponse?.length ? (
            chatResponse.map((msg, messageIndex) => {
              if (!msg.llmResponse) return null;

              const { llmResponse } = msg;

              return (
                <div key={messageIndex} className="space-y-4">
                  {/* User Query */}
                  <div className="flex flex-col max-w-[70%] ml-auto">
                    <div className="px-4 py-2 rounded-lg text-sm bg-gray-600 text-white ml-auto">
                      {llmResponse.query}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-auto">
                      {formatTimestamp(llmResponse.timestamp)}
                    </div>
                  </div>

                  {/* LLM Blocks */}
                  <div className="space-y-3">
                    {renderChatBlocks(
                      llmResponse.blocks.filter((b) => b.type !== "query"),
                      messageIndex
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>
                        Powered by {llmResponse.provider} ({llmResponse.model})
                      </span>
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
