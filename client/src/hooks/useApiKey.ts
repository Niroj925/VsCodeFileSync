import { useState, useRef, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { projectService } from '../services/projectService';

export const useApiKey = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const { showToast } = useToast();

  const saveKey = useCallback(
    async (provider: string, apiKey: string) => {
      // Prevent multiple simultaneous calls
      if (isSavingRef.current) {
        console.warn('⚠️ Already saving, skipping');
        return null;
      }

      if (!provider || !apiKey.trim()) {
        const msg = 'Provider and API key are required';
        setError(msg);
        showToast('error', msg);
        return null;
      }

      isSavingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        await projectService.saveApiKey(provider, apiKey);

        showToast('success', 'API key saved successfully!');
        return true;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save API key';

        setError(message);
        showToast('error', message);
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const clearError = () => setError(null);

  return {
    saveKey,
    isLoading,
    error,
    clearError,
  };
};
