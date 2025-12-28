import { BaseLLMProvider, LLMRequest } from './base.provider';
import { LLMProviderConfig } from '../config/llm-config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class GeminiProvider extends BaseLLMProvider {
  name = 'gemini';
  apiKey: string;
  baseURL?: string | undefined;
  
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(config: LLMProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.models?.[0] || 'gemini-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });
  }

  async sendMessage(request: LLMRequest): Promise<string> {
    try {
      const truncatedPrompt = this.truncatePrompt(request.prompt, request.maxTokens);
      
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: truncatedPrompt }]
          }
        ],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000,
        },
      });

      const response = await result.response;
      return response.text().trim();
      
    } catch (error: any) {
      console.error('Gemini provider error:', error);
      throw new Error(`Gemini API error: ${this.formatError(error)}`);
    }
  }
}