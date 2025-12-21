import React, { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STATIC_REPLY =
  "This is a static response from the assistant. Backend integration will be added later.";

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: STATIC_REPLY,
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] text-sm px-4 py-2 rounded-xl
                ${
                  msg.role === "user"
                    ? "bg-primary-500 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatBox;
