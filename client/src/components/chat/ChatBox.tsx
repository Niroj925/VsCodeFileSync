import React, { useRef, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  messages: Message[];
}

const ChatBox: React.FC<Props> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div className="max-w-[75%] text-sm px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;
