
import { useState, useRef, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import { chatService } from '../services/chatServices';

export const useChatApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSendingRef = useRef(false);

  const { showToast } = useToast();

  const sendMessage = useCallback(
    async (message: string, files: any[]) => {
      if (isSendingRef.current) {
        console.warn('⚠️ Already sending a message, skipping');
        return null;
      }

      if (!message.trim() && files.length === 0) {
        const msg = 'No message or files to send';
        setError(msg);
        showToast('error', msg);
        return null;
      }

      isSendingRef.current = true;
      setIsLoading(true);
      setError(null);

      const payload = {
        message: message.trim(),
        files,
        timestamp: Date.now(),
        requestId: `chat-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      try {
        // console.log('📤 [useChatApi] Sending:', {
        //   message: payload.message,
        //   fileCount: files.length,
        //   requestId: payload.requestId,
        // });

        const data = await chatService.sendChatMessage(payload);

        // console.log('✅ [useChatApi] Response received:', {
        //   requestId: payload.requestId,
        //   data,
        // });
        if(data.success === false) {
          const msg = data.error.message || 'Failed to get response from chat service';
          setError(msg);
          showToast('error', msg);
          return
        }

        return {
          ...data,
          requestId: payload.requestId,
        };
      } catch (err: any) {
        console.error('❌ [useChatApi] Send failed:', err);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send message';
console.log('error message:', message);
        setError(message);
        showToast('error', message);
        throw err;
      } finally {
        isSendingRef.current = false;
        setIsLoading(false);
      }
    },
    [showToast]
  );

    const sendQuery = useCallback(
    async (query: string) => {
      if (isSendingRef.current) {
        console.warn('⚠️ Already sending a message, skipping');
        return null;
      }

      if (!query.trim()) {
        const msg = 'No message or files to send';
        setError(msg);
        showToast('error', msg);
        return null;
      }

      isSendingRef.current = true;
      setIsLoading(true);
      setError(null);

      const payload = {
        query: query.trim(),
          timestamp: Date.now(),
        requestId: `chat-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      };

      try {
        const data = await chatService.sendQuery(payload);

        if(data.success === false) {
          const msg = data.error.message || 'Failed to get response from chat service';
          setError(msg);
          showToast('error', msg);
          return
        }

        return {
          ...data,
          requestId: payload.requestId,
        };
      } catch (err: any) {
        console.error('❌ [useChatApi] Send failed:', err);

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to send message';
console.log('error message:', message);
        setError(message);
        showToast('error', message);
        throw err;
      } finally {
        isSendingRef.current = false;
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const clearError = () => setError(null);

  return {
    sendMessage,
    sendQuery,
    isLoading,
    error,
    clearError,
  };
};
