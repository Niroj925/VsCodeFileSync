import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

export const useApiKey = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const saveKey = useCallback(async (provider: string, apiKey: string) => {
    // Prevent multiple simultaneous calls
    if (isSavingRef.current) {
      console.warn('⚠️ Already saving, skipping');
      return null;
    }

    if (!provider || !apiKey.trim()) {
      console.warn('⚠️ Provider and API key are required');
      return null;
    }

    isSavingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const payload = { provider, apiKey };

      console.log('📤 [useApiKey] Saving key:', payload);

      const response = await axios.post('http://localhost:5001/api/project/save-key', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      console.log('✅ [useApiKey] Saved:', response.data);

      return response.data;
    } catch (err: any) {
      console.error('❌ [useApiKey] Save failed:', err);

      if (err.response) {
        setError(
          `Error: ${err.response.status} - ${err.response.data?.message || 'Server error'}`
        );
      } else if (err.request) {
        setError('Network error: Could not connect to server');
      } else {
        setError(`Error: ${err.message}`);
      }

      throw err;
    } finally {
      isSavingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    saveKey,
    isLoading,
    error,
    clearError,
  };
};
