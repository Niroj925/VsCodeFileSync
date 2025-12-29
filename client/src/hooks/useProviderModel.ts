import { useState, useRef, useCallback } from "react";
import { useToast } from "../components/ui/Toast";
import { projectService } from "../services/projectService";
import { Award } from "lucide-react";

export const useProviderModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const { showToast } = useToast();

  // Save provider models
  const saveProviderModel = useCallback(
    async (provider: string, models: string[]) => {
      if (isSavingRef.current) {
        console.warn("⚠️ Already saving, skipping");
        return null;
      }

      if (!provider || !models.length) {
        const msg = "Provider and models are required";
        setError(msg);
        showToast("error", msg);
        return null;
      }

      isSavingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Save models via service
        await projectService.saveProviderModel(provider, models);

        showToast("success", "Provider models saved successfully!");
        return true;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to save provider models";

        setError(message);
        showToast("error", message);
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getModelsByProvider = useCallback(async (provider: string) => {
    try {
      const models = await projectService.getProviderModels(provider);
      return models;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch models";
      setError(message);
      throw err;
    }
  }, []);

  const clearError = () => setError(null);

  return {
    saveProviderModel,
    getModelsByProvider,
    isLoading,
    error,
    clearError,
  };
};
