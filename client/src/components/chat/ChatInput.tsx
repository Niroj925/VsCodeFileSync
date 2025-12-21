import React, { useState } from "react";
import { Send, Paperclip, X, Folder, FileText, Plus } from "lucide-react";
import SidebarSearch from "../files/SideBarSearch";
import SidebarSearchResults from "../files/SideBarSearchResult";

interface Props {
  onSend: (text: string) => void;
}

interface SelectedItem {
  type: "file" | "folder";
  name: string;
}

const ChatInput: React.FC<Props> = ({ onSend }) => {
  const [input, setInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;
    const message = input + (selectedItems.length ? " " + selectedItems.map(i => i.name).join(", ") : "");
    onSend(message);
    setInput("");
    setSelectedItems([]);
  };

  const addItem = (item: SelectedItem) => {
    setSelectedItems(prev =>
      prev.find(i => i.name === item.name && i.type === item.type)
        ? prev
        : [...prev, item]
    );
  };

  const removeItem = (item: SelectedItem) => {
    setSelectedItems(prev =>
      prev.filter(i => !(i.name === item.name && i.type === item.type))
    );
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/70 dark:bg-gray-900/60 p-3">

      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedItems.map(item => (
            <div
              key={`${item.type}-${item.name}`}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md
                         bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              {item.type === "folder" ? <Folder size={12} /> : <FileText size={12} />}
              <span className="truncate max-w-[140px]">{item.name}</span>
              <button onClick={() => removeItem(item)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input + send + picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <Paperclip size={16} />
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask something…"
          className="flex-1 bg-transparent outline-none text-sm
                     text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />

        <button
          onClick={sendMessage}
          className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
        >
          <Send size={16} />
        </button>
      </div>

      {/* File/Folder picker */}
      {showPicker && (
        <div className="mt-2 border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 max-h-60 overflow-y-auto">
          <SidebarSearch />
          <SidebarSearchResults
            onSelectFile={(file:any) => addItem({ type: "file", name: file.path })}
          />

          {/* Folder selection (example, can replace with real folder structure) */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Folders</div>
          {["Folder A", "Folder B", "Folder C"].map(folder => (
            <div
              key={folder}
              className="flex items-center justify-between px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => addItem({ type: "folder", name: folder })}
            >
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-yellow-500" />
                <span>{folder}</span>
              </div>
              <Plus size={14} className="text-gray-500 hover:text-primary-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
