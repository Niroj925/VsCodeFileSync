import { BaseLLMProvider, LLMRequest } from './base.provider';
import { LLMProviderConfig } from '../config/llm-config';
import OpenAI from 'openai';

export class DeepSeekProvider extends BaseLLMProvider {
  name = 'deepseek';
  apiKey: string;
  baseURL: string;
  
  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseURL = 'https://api.deepseek.com';
    
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }

  async sendMessage(request: LLMRequest): Promise<string> {
    try {
      const truncatedPrompt = this.truncatePrompt(request.prompt, request.maxTokens);
      
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: [
          {
            role: 'system',
            content: `You are CodeBot, an expert software development assistant. You analyze code files and provide:
1. Detailed analysis of issues and solutions
2. Specific file references with exact paths
3. Code examples in markdown code blocks with language tags
4. Clear explanations of complex concepts
5. Practical, actionable recommendations

Always structure your response with clear sections using markdown headers.`
          },
          {
            role: 'user',
            content: truncatedPrompt
          }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';
      return content.trim();
      
    } catch (error: any) {
      console.error('DeepSeek provider error:', error);
      throw new Error(`DeepSeek API error: ${this.formatError(error)}`);
    }
  }
}