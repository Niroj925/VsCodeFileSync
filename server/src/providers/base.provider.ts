export interface LLMRequest {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseLLMProvider {
  abstract name: string;
  abstract apiKey: string;
  abstract baseURL?: string;
  
  abstract sendMessage(request: LLMRequest): Promise<string>;
  

  protected formatError(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
  
  protected truncatePrompt(prompt: string, maxTokens: number = 8000): string {
    const maxLength = maxTokens * 4; 
    if (prompt.length <= maxLength) return prompt;
    
    return prompt.substring(0, maxLength) + '\n\n[Content truncated due to length]';
  }
}