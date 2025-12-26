import api from "./api";

export const chatService = {
  sendChatMessage: async (payload: {
    message: string;
    files: any[];
    timestamp: number;
    requestId: string;
  }): Promise<any> => {
    const data = await api.post<any>(
      '/api/chat/send',
      payload,
      { timeout: 30000 }
    );

    return data;
  },

}