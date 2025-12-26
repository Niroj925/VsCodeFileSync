import React, { useEffect, useState } from "react";
import {
  Menu,
  Code,
  Server,
  KeyRound,
  ChevronDown,
  Save,
} from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useModelApi } from "../../hooks/useModelApi";
const Header: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    socketConnected,
    isOpenApiKeyModal,
    setIsOpenApiKeyModal,
  } = useProjectContext();

  const {saveModel, currentModel, getCurrentModel } = useModelApi();

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState("OpenAI");
  const [model, setModel] = useState("gpt-4o-mini");

  const handleSave = () => {
    if (!model.trim()) return;
    saveModel(provider, model);
    setOpen(false);
  };

useEffect(() => {
  getCurrentModel();
}, []);
  

  return (
    <header className="glass-card sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden mr-2"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-2 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  VS Code File Sync
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time project file management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <div
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm
                    ${
                      socketConnected
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
              >
                <Server className="h-3 w-3" />
                <span>
                  Backend: {socketConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                <Users className="h-3 w-3" />
                <span>{stats.totalProjects} Projects</span>
              </div> */}
              <div className="relative flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-1 gap-4 shadow-sm">
                {/* Left */}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {currentModel ? currentModel?.provider : "No Model"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {currentModel ? currentModel?.model : "N/A"}
                  </span>
                </div>

                {/* Button */}
                <button
                  onClick={() => setOpen(!open)}
                  className="p-1.5 rounded-full
               text-gray-600 dark:text-gray-300
               hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronDown size={18} className="hover:text-primary-500" />
                </button>

                {/* Dropdown */}
                {open && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
                    {/* Provider */}
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Model Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full text-sm px-2 py-1.5 rounded-md
                       bg-gray-100 dark:bg-gray-800
                       text-gray-800 dark:text-gray-200
                       focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="gemini">Gemini</option>
                       <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="gemini">Gemini</option>
                    </select>

                    {/* Model */}
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="w-full text-sm px-2 py-1.5 rounded-md
                       bg-gray-100 dark:bg-gray-800
                       text-gray-800 dark:text-gray-200
                       focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />

                    {/* Save */}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1
                         text-xs font-medium px-2 py-1 rounded-md
                         bg-primary-600 text-white
                         hover:bg-primary-700 transition"
                      >
                        <Save size={12} />
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsOpenApiKeyModal(!isOpenApiKeyModal)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="API Key Management"
            >
              <KeyRound className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-primary-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
