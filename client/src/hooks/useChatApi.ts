// hooks/useChatApi.ts
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

export const useChatApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSendingRef = useRef(false);

  const sendMessage = useCallback(async (message: string, files: any[]) => {
    // Prevent multiple simultaneous calls
    if (isSendingRef.current) {
      console.warn('⚠️ Already sending a message, skipping');
      return null;
    }

    if (!message.trim() && files.length === 0) {
      console.warn('⚠️ No message or files to send');
      return null;
    }

    isSendingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        message: message.trim(),
        files: files,
        timestamp: Date.now(),
        requestId: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('📤 [useChatApi] Sending message:', {
        message: payload.message,
        fileCount: payload.files.length,
        requestId: payload.requestId
      });

      const response = await axios.post(
        'http://localhost:5001/api/chat/send',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ [useChatApi] Response received:', {
        requestId: payload.requestId,
        data: response.data
      });
      
      return {
        ...response.data,
        requestId: payload.requestId
      };
    } catch (err: any) {
      console.error('❌ [useChatApi] Send failed:', {
        error: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      if (err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || 'Server error'}`);
      } else if (err.request) {
        setError('Network error: Could not connect to server');
      } else {
        setError(`Error: ${err.message}`);
      }
      
      throw err;
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    sendMessage,
    isLoading,
    error,
    clearError,
  };
};