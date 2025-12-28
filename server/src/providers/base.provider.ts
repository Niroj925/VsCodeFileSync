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
  
  /**
   * Format error message
   */
  protected formatError(error: any): string {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }
  
  /**
   * Truncate prompt if too long
   */
  protected truncatePrompt(prompt: string, maxTokens: number = 8000): string {
    // Simple truncation - in production you might want smarter truncation
    const maxLength = maxTokens * 4; // Rough estimate: 1 token ≈ 4 characters
    if (prompt.length <= maxLength) return prompt;
    
    return prompt.substring(0, maxLength) + '\n\n[Content truncated due to length]';
  }
}