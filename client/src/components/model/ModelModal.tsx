import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { useModelApi } from "../../hooks/useModelApi";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ModelModal: React.FC<Props> = ({ open, onClose }) => {
  const [provider, setProvider] = useState("openai");
  const [modelName, setModelName] = useState("");

  const { saveModel, isLoading, error, clearError } = useModelApi();

  if (!open) return null;

  const handleSave = async () => {
    if (!modelName.trim()) return;

    try {
      await saveModel(provider, modelName);
      setModelName("");
      onClose();
    } catch (err) {
      console.error("Failed to save model:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-xl p-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            Model Management
          </h2>
          <button onClick={onClose}>
            <X className="text-gray-800 hover:text-red-500" size={18} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 rounded-lg flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>
              <X size={14} className="text-gray-800 hover:text-red-500" />
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

        {/* Model Name / Input */}
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Model Name
        </label>
        <input
          type="text"
          placeholder="Enter model name..."
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="input-field mt-1 text-gray-700 dark:text-gray-300"
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

export default ModelModal;
