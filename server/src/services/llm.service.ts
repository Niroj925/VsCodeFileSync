import { ChatBlock, ChatRequest, LLMResponse } from "../types";
import { OpenAIProvider } from "../providers/openai.provider";
import { GeminiProvider } from "../providers/gemini.provider";
import { DeepSeekProvider } from "../providers/deepseek.provider";
import llmConfig from "../config/llm-config";

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

  /**
   * MAIN CHAT ENTRY - Simple and clean
   */
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
      // Use files directly from request
      const filesWithContent = request.files.map(file => ({
        path: file.path,
        content: file.content || ''
      }));

      const prompt = this.formatPrompt(request.query, filesWithContent);

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

  /**
   * SIMPLE PROMPT FORMAT - Just like ChatGPT
   */
  private formatPrompt(
    query: string,
    files: Array<{ path: string; content: string }>
  ): string {
    let prompt = `User Query: ${query}\n\n`;

    if (files.length) {
      prompt += "I'm providing these files for context:\n\n";
      files.forEach(file => {
        prompt += `=== File: ${file.path} ===\n`;
        prompt += `${file.content}\n\n`;
      });
    }

    prompt += `Please analyze the query and provide a helpful response. 
If you're showing code changes, please format them in markdown code blocks and mention which file they belong to.
If you're showing the original files, include them in code blocks with their file paths.`;

    return prompt;
  }

  /**
   * FORMAT RESPONSE - Simple parsing
   */
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

  /**
   * SIMPLE BLOCK PARSER - Prevent duplicate file display
   */
  private parseResponseToBlocks(
    query: string,
    response: string,
    contextFiles: Array<{ path: string; content: string }>
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    // 1. User query block
    blocks.push({
      type: "query",
      content: query,
    });

    // Track which files we've already shown to avoid duplicates
    const shownFilePaths = new Set<string>();

    // 2. Parse LLM response first (this is what the user actually asked for)
    if (!response || response.trim() === '') {
      blocks.push({
        type: "text",
        content: "The LLM provider returned an empty response.",
      });
    } else {
      // Parse the LLM response for code blocks and text
      const parsedBlocks = this.parseLLMResponse(response, contextFiles, shownFilePaths);
      blocks.push(...parsedBlocks);
    }

    // 3. Only show context files that weren't already shown in the LLM response
    const remainingFiles = contextFiles.filter(file => !shownFilePaths.has(file.path));
    if (remainingFiles.length > 0) {
      // Add a separator if we already have LLM response blocks
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

      // Show remaining context files
      remainingFiles.forEach(file => {
        blocks.push({
          type: "code",
          language: this.getLanguageFromPath(file.path),
          filePath: file.path,
          content: file.content || '',
        });
      });
    }

    return blocks;
  }

  /**
   * Parse LLM response into blocks, tracking shown files
   */
  private parseLLMResponse(
    response: string,
    contextFiles: Array<{ path: string; content: string }>,
    shownFilePaths: Set<string>
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    
    // Parse code blocks from response
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      // Add text before this code block
      const textBefore = response.substring(lastIndex, match.index).trim();
      if (textBefore) {
        blocks.push({
          type: "text",
          content: textBefore,
        });
      }
      
      // Add code block
      const language = match[1] || 'text';
      const codeContent = match[2]?.trim() || '';
      
      // Try to find which file this belongs to
      const filePath = this.findFileForCode(codeContent, contextFiles);
      
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
    
    // Add remaining text after last code block
    const textAfter = response.substring(lastIndex).trim();
    if (textAfter) {
      blocks.push({
        type: "text",
        content: textAfter,
      });
    }
    
    // If no blocks were created (no code blocks), add entire response as text
    if (blocks.length === 0) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
    }
    
    return blocks;
  }

  /**
   * Find which file a code snippet belongs to
   */
  private findFileForCode(
    codeContent: string,
    contextFiles: Array<{ path: string; content: string }>
  ): string | null {
    if (!contextFiles.length) return null;

    // 1. Check if code mentions any file path
    for (const file of contextFiles) {
      if (codeContent.includes(file.path)) {
        return file.path;
      }
    }

    // 2. Check for content similarity (simple substring match)
    for (const file of contextFiles) {
      if (file.content && codeContent) {
        // Check if first few lines match
        const fileFirstLines = file.content.split('\n').slice(0, 3).join('\n');
        const codeFirstLines = codeContent.split('\n').slice(0, 3).join('\n');
        
        if (fileFirstLines === codeFirstLines) {
          return file.path;
        }
        
        // Check for significant overlap
        const fileLines = file.content.split('\n');
        const codeLines = codeContent.split('\n');
        
        let matchingLines = 0;
        for (const codeLine of codeLines.slice(0, 10)) {
          if (fileLines.some(fileLine => fileLine.includes(codeLine) && codeLine.length > 10)) {
            matchingLines++;
          }
        }
        
        if (matchingLines >= 2) {
          return file.path;
        }
      }
    }

    return null;
  }

  /**
   * Get language from file path
   */
  private getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'ts': return 'typescript';
      case 'js': return 'javascript';
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'go': return 'go';
      case 'rb': return 'ruby';
      case 'php': return 'php';
      case 'rs': return 'rust';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      default: return 'text';
    }
  }

  /**
   * PROVIDER INFO
   */
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