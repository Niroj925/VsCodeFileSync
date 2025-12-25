import React, { useState } from "react";
import { X, KeyRound, Save } from "lucide-react";
import { useApiKey } from "../../hooks/useApiKey";
import { useToast } from "../ui/Toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<Props> = ({ open, onClose }) => {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");

  const { saveKey, isLoading, error, clearError } = useApiKey();
  const { showToast } = useToast();

  if (!open) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    try {
      await saveKey(provider, apiKey);
      setApiKey("");
      onClose();
      showToast("success", "API key saved successfully!");
    } catch (err: any) {
      console.error("Failed to save API key:", err);
      showToast("error", err.message || "Failed to save API key");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-xl p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="text-primary-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              API Key Management
            </h2>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-red-500" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 rounded-lg flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Provider */}
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Model Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="input-field mt-1 mb-3 text-gray-700 dark:text-gray-300"
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="gemini">Gemini</option>
        </select>

        {/* API Key (always text) */}
        <label className="text-sm text-gray-600 dark:text-gray-400">
          API Key
        </label>
        <input
          type="text"
          placeholder="sk-xxxx..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="input-field mt-1 mb-3 text-gray-700 dark:text-gray-300"
        />

        {/* Actions */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex gap-2 items-center"
          >
            <Save size={16} />
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
