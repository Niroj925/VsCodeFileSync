import { ChatBlock, ChatRequest, LLMResponse } from "../types";
import { OpenAIProvider } from "../providers/openai.provider";
import { GeminiProvider } from "../providers/gemini.provider";
import { DeepSeekProvider } from "../providers/deepseek.provider";
import llmConfig from "../config/llm-config";
import { formatPrompt } from "../utils/prompt.utils";
import { findFileForCode } from "../utils/file.utils";
import { getLanguageFromPath } from "../utils/helpers";

class LLMService {
  private providers = new Map<string, any>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const config = llmConfig.getConfig();
    const providersList = config.providers || [];

    providersList.forEach((providerConfig) => {
      if (!providerConfig.apiKey) return;

      try {
        switch (providerConfig.name) {
          case "openai":
            this.providers.set("openai", new OpenAIProvider(providerConfig));
            break;
          case "gemini":
            this.providers.set("gemini", new GeminiProvider(providerConfig));
            break;
          case "deepseek":
            this.providers.set("deepseek", new DeepSeekProvider(providerConfig));
            break;
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.name}:`, error);
      }
    });
  }

  async processChat(request: ChatRequest): Promise<LLMResponse> {
    try {
      const current = llmConfig.getCurrentProvider();
      const providerName = current.provider;
      const model = current.model;
      const provider = this.providers.get(providerName);
      if (!provider) {
        throw new Error(`Provider "${providerName}" is not configured`);
      }
console.log(`Using LLM Provider: ${providerName} with model ${model}`);
 
      const filesWithContent = request.files.map(file => ({
        path: file.path,
        content: file.content || ''
      }));

      const prompt = formatPrompt(request.query, filesWithContent);

      const rawResponse: string = await provider.sendMessage({
        prompt,
        model,
        temperature: request.options?.temperature ?? 0.7,
        maxTokens: request.options?.maxTokens ?? 2000,
      });

      return this.formatResponse(
        request.query,
        providerName,
        model,
        rawResponse,
        filesWithContent
      );
    } catch (error) {
      console.error("LLM processing error:", error);
      throw error;
    }
  }

  private formatResponse(
    query: string,
    provider: string,
    model: string,
    llmResponse: string,
    contextFiles: Array<{ path: string; content: string }>
  ): LLMResponse {
    const blocks = this.parseResponseToBlocks(query, llmResponse, contextFiles);
    
    return {
      success: true,
      query,
      provider,
      model,
      blocks,
      timestamp: new Date(),
    };
  }

 
  private parseResponseToBlocks(
    query: string,
    response: string,
    contextFiles: Array<{ path: string; content: string }>
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    blocks.push({
      type: "query",
      content: query,
    });

    const shownFilePaths = new Set<string>();

    if (!response || response.trim() === '') {
      blocks.push({
        type: "text",
        content: "The LLM provider returned an empty response.",
      });
    } else {
      const parsedBlocks = this.parseLLMResponse(response, contextFiles, shownFilePaths);
      blocks.push(...parsedBlocks);
    }

    const remainingFiles = contextFiles.filter(file => !shownFilePaths.has(file.path));
    if (remainingFiles.length > 0) {
      if (blocks.length > 1) {
        blocks.push({
          type: "text",
          content: `---\n\nFor reference, here are the ${remainingFiles.length} file(s) you provided:`,
        });
      } else {
        blocks.push({
          type: "text",
          content: `I'll analyze these ${remainingFiles.length} file(s):`,
        });
      }

      remainingFiles.forEach(file => {
        blocks.push({
          type: "code",
          language: getLanguageFromPath(file.path),
          filePath: file.path,
          content: file.content || '',
        });
      });
    }

    return blocks;
  }


  private parseLLMResponse(
    response: string,
    contextFiles: Array<{ path: string; content: string }>,
    shownFilePaths: Set<string>
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const textBefore = response.substring(lastIndex, match.index).trim();
      if (textBefore) {
        blocks.push({
          type: "text",
          content: textBefore,
        });
      }
      
      const language = match[1] || 'text';
      const codeContent = match[2]?.trim() || '';
      
      const filePath = findFileForCode(codeContent, contextFiles);
      
      if (filePath && filePath !== "unknown") {
        shownFilePaths.add(filePath);
      }
      
      blocks.push({
        type: "code",
        language: language,
        filePath: filePath || "unknown",
        content: codeContent,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    const textAfter = response.substring(lastIndex).trim();
    if (textAfter) {
      blocks.push({
        type: "text",
        content: textAfter,
      });
    }
    
    if (blocks.length === 0) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
    }
    
    return blocks;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getCurrentProviderInfo(): {
    provider: string;
    model: string;
    configured: boolean;
  } {
    const current = llmConfig.getCurrentProvider();
    const providerConfig = llmConfig.getProvider(current.provider);

    return {
      provider: current.provider,
      model: current.model,
      configured: !!providerConfig?.apiKey,
    };
  }
}

export default new LLMService();