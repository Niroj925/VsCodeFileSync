import { useState, useCallback } from "react";
import { useToast } from "../components/ui/Toast";
import { projectService } from "../services/projectService";
import type { CurrentModel } from "../interface";

export const useModelApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<CurrentModel | null>(null);

  const { showToast } = useToast();

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
        const model = await projectService.saveModel(provider, modelName);
        setCurrentModel(model);
        showToast("success", "Model changed successfully!");
        return model;
      } catch (err: any) {
        const message =
          err?.message || "Failed to save model";

        setError(message);
        showToast("error", message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getCurrentModel = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const model = await projectService.getCurrentModel();
      setCurrentModel(model);
      return model;
    } catch (err: any) {
      const message =
        err?.message || "Failed to load current model";

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
