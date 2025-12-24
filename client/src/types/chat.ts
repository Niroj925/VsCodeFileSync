export interface ChatFile {
  path: string;
  content: string;
}

export interface ChatResponseData {
  message: string;
  files: ChatFile[];
}

export interface ChatApiResponse {
  success: boolean;
  data: ChatResponseData;
  requestId?: string;
}
