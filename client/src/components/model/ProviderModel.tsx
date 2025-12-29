import React, { useState, useEffect } from "react";
import { X, KeyRound, Save, Plus } from "lucide-react";
import { useProviderModel } from "../../hooks/useProviderModel";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProviderModel: React.FC<Props> = ({ open, onClose }) => {
  const [provider, setProvider] = useState("openai");
  const [modelInput, setModelInput] = useState("");
  const [models, setModels] = useState<string[]>([]);

  const {
    saveProviderModel,
    getModelsByProvider,
    isLoading,
    error,
    clearError,
  } = useProviderModel();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const existing = await getModelsByProvider(provider);
        if (Array.isArray(existing)) setModels(existing);
      } catch (err) {
        console.error("Failed to fetch provider models:", err);
      }
    };
    fetchModels();
  }, [provider, getModelsByProvider]);

  if (!open) return null;

  const handleAddModel = () => {
    const trimmed = modelInput.trim();
    if (!trimmed || models.includes(trimmed)) return;
    setModels([...models, trimmed]);
    setModelInput("");
  };

  const handleRemoveModel = (model: string) => {
    setModels(models.filter((m) => m !== model));
  };

  const handleSave = async () => {
    if (!models.length) return;

    try {
      await saveProviderModel(provider, models);
      onClose();
    } catch (err: any) {
      console.error("Failed to save provider models:", err);
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
              Provider Models Management
            </h2>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-500 hover:text-red-500" />
          </button>
        </div>

        {error && (
          <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 rounded-lg flex justify-between">
            <span>{error}</span>
            <button onClick={clearError}>
              <X size={14} />
            </button>
          </div>
        )}

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

        <label className="text-sm text-gray-600 dark:text-gray-400">
          Add Model
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter model name"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            className="input-field flex-1 text-gray-700 dark:text-gray-300"
          />
          <button
            onClick={handleAddModel}
            className="btn-secondary flex items-center gap-1"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {models.length > 0 && (
          <div className="mb-3 max-h-40 overflow-y-auto">
            {models.map((m) => (
              <div
                key={m}
                className="flex items-center justify-between p-2 mb-1 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 rounded"
              >
                <span className="text-gray-200">{m}</span>
                <button onClick={() => handleRemoveModel(m)}>
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-primary flex gap-2 items-center"
          >
            <Save size={16} />
            {isLoading ? "Saving..." : "Save Models"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderModel;
