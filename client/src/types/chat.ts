export interface ChatFile {
  path: string;
  content: string;
}

export interface ChatApiResponse {
  success: boolean;
  data: ChatResponseData;
  requestId?: string;
}

export type ChatBlockType =
  | "query"
  | "summary"
  | "analysis"
  | "text"
  | "list"
  | "code"
  | "warning";

export interface ChatBlock {
  type: ChatBlockType;
  content?: string;
  filePath?: string;
  language?: string;
}

export interface LLMResponse {
  success: boolean;
  query: string;
  provider: string;
  model: string;
  blocks: ChatBlock[];
  timestamp: Date;
}

export interface ChatResponseData {
  llmResponse?: LLMResponse; 
}