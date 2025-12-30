import { BaseLLMProvider, LLMRequest } from "./base.provider";
import llmConfig, { LLMProviderConfig } from "../config/llm-config";
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider extends BaseLLMProvider {
  name = "gemini";
  apiKey: string;
  baseURL?: string;

  private ai: GoogleGenAI;

  constructor(config: LLMProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    
    this.ai = new GoogleGenAI({
      apiKey: this.apiKey,
    });
  }

  async sendMessage(request: LLMRequest): Promise<string> {
    try {
      console.log(`🤖 Sending request to Gemini (model: ${request.model})`);
      
      const truncatedPrompt = this.truncatePrompt(request.prompt, request.maxTokens);
      
      const response = await this.ai.models.generateContent({
        model: request.model,
        contents: truncatedPrompt,
        config: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 2000,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      console.log(`✅ Received response from Gemini (${text.length} chars)`);
      return text.trim();
      
    } catch (error: any) {
      console.error("❌ Gemini provider error:", error);
      
      let errorMessage = this.formatGeminiError(error);
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }


  private formatGeminiError(error: any): string {
    if (error.status === 401 || error.status === 403) {
      return "Invalid API key. Please check your Gemini API key in the configuration.";
    }
    
    if (error.status === 429) {
      return "Rate limit exceeded. Please try again later or check your quota.";
    }
    
    if (error.message?.includes("not found") || error.message?.includes("model")) {
      return `Model not available. Please check if '${this.getCurrentModel()}' is a valid Gemini model.`;
    }
    
    return this.formatError(error);
  }

  private getCurrentModel(): string {
    const current = llmConfig.getCurrentProvider();
    return current.model || "gemini-2.5-flash";
  }


  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: "Hello, please respond with 'OK' if you are working.",
        config: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      });
      
      return testResponse.text?.includes("OK") || false;
    } catch (error) {
      console.error("Gemini connection test failed:", error);
      return false;
    }
  }
}