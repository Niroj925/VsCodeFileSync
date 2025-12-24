import React, { useRef, useEffect } from "react";
import { useProjectContext } from "../../contexts/ProjectContext";

const ChatBox: React.FC = () => {
  const { chatResponse } = useProjectContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
console.log('cr:',chatResponse)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatResponse]);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Scrollable chat area - now properly contained */}
      <div 
        ref={containerRef}
        className="flex-1  scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <div className="px-4 py-3 space-y-4 min-h-full">
          {chatResponse && chatResponse.length > 0 ? (
            chatResponse.map((msg, index) => (
              <div key={index} className="flex flex-col max-w-[70%] ml-auto">
                {/* User message */}
                {msg.message && (
                  <div className="px-4 py-1 rounded-lg  text-sm bg-gray-600 text-slate-200 dark:text-slate-200 ml-auto">
                    {msg.message}
                  </div>
                )}

                {/* Files and content */}
                {msg.files &&
                  msg.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
                        {file.path}
                      </div>
                      <pre className="text-xs text-slate-200 dark:text-slate-400 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white whitespace-pre-wrap break-words rounded-lg">
                        {file.content}
                      </pre>
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No messages yet
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;