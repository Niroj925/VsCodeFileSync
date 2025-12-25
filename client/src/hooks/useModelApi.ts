import { useState, useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/ui/Toast";

export interface CurrentModel {
  provider: string;
  model: string;
}

export const useModelApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<CurrentModel | null>(null);

  const { showToast } = useToast();

  /* =======================
   * Save Model
   * ======================= */
  const saveModel = useCallback(
    async (provider: string, modelName: string) => {
      if (!modelName.trim()) {
        const msg = "Model name cannot be empty";
        setError(msg);
        showToast("error", msg);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await axios.post(
          "http://localhost:5001/api/project/save-model",
          {
            provider,
            model: modelName,
          }
        );

        setCurrentModel({ provider, model: modelName });
        showToast("success", "Model saved successfully!");
        return res.data;
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to save model";

        setError(message);
        showToast("error", message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /* =======================
   * Get Current Model
   * ======================= */
  const getCurrentModel = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get(
        "http://localhost:5001/api/project/get-model"
      );

      setCurrentModel(res.data?.model ?? null);
      return res.data?.model ?? null;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load current model";

      setError(message);
      showToast("error", message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const clearError = () => setError(null);

  return {
    saveModel,
    getCurrentModel,
    currentModel,
    isLoading,
    error,
    clearError,
  };
};
