// llm.service.ts - Updated with correct parsing
import { ChatBlock, ChatRequest, ChunkData, LLMResponse } from "../types";
import { OpenAIProvider } from "../providers/openai.provider";
import { GeminiProvider } from "../providers/gemini.provider";
import { DeepSeekProvider } from "../providers/deepseek.provider";
import llmConfig from "../config/llm-config";
import { formatedPrompt, formatPrompt } from "../utils/prompt.utils";
import { getLanguageFromPath } from "../utils/helpers";
import embeddingService from "./embedding.service";

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
            this.providers.set(
              "deepseek",
              new DeepSeekProvider(providerConfig)
            );
            break;
        }
      } catch (error) {
        console.error(
          `Failed to initialize provider ${providerConfig.name}:`,
          error
        );
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

      // Prepare context files for prompt ONLY (not for output)
      const filesWithContent = request.files.map((file) => ({
        path: file.path,
        content: file.content || "",
      }));

      const prompt = formatPrompt(request.query, filesWithContent);

      const rawResponse: string = await provider.sendMessage({
        prompt,
        model,
        temperature: request.options?.temperature ?? 0.7,
        maxTokens: request.options?.maxTokens ?? 3000, // Increased for better responses
      });

      // console.log('raw response:', rawResponse);

      // Pass ONLY the LLM response, NOT context files
      return this.formatResponse(
        request.query,
        providerName,
        model,
        rawResponse // Only LLM response here
      );
    } catch (error) {
      console.error("LLM processing error:", error);
      throw error;
    }
  }

  async processQuery(query: string): Promise<LLMResponse> {
    try {
      console.log('query:',query)
      const current = llmConfig.getCurrentProvider();
      const providerName = current.provider;
      const model = current.model;
      const provider = this.providers.get(providerName);

      if (!provider) {
        throw new Error(`Provider "${providerName}" is not configured`);
      }

      console.log(`Using LLM Provider: ${providerName} with model ${model}`);

      const relevantChunks = await embeddingService.searchRelevantChunks(query);
      const filesWithContent = relevantChunks.map((chunk) => {
        return {
          symbol: chunk.symbol,
          type: chunk.type,
          score: chunk.score,
          filePath: chunk.filePath,
          content: chunk.content,
        };
      });
      console.log('files content length:',filesWithContent.length)
      const prompt = formatedPrompt(query, filesWithContent);

      const rawResponse: string = await provider.sendMessage({
        prompt,
        model,
      });

      // console.log("raw response:", rawResponse);

      return this.formatResponse(
        query,
        providerName,
        model,
        rawResponse 
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
    llmResponse: string 
  ): LLMResponse {
    const blocks = this.parseResponseToBlocks(query, llmResponse);

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
    response: string 
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    blocks.push({
      type: "query",
      content: query,
    });

    if (!response || response.trim() === "") {
      blocks.push({
        type: "text",
        content: "The LLM provider returned an empty response.",
      });
      return blocks;
    }

    // Parse structured sections from LLM response
    const parsedBlocks = this.parseStructuredResponse(response);
    blocks.push(...parsedBlocks);

    return blocks;
  }

  private parseStructuredResponse(response: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    // Check if it's a "no changes" response
    if (
      response.toLowerCase().includes("no file changes required") ||
      response.toLowerCase().includes("no changes needed") ||
      response.toLowerCase().includes("no file changes are needed")
    ) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
      return blocks;
    }

    // Extract structured sections from LLM response
    const summaryMatch = this.extractSection(
      response,
      /## Summary\s*\n([\s\S]*?)(?=\n## |$)/i
    );
    const analysisMatch = this.extractSection(
      response,
      /## Analysis\s*\n([\s\S]*?)(?=\n## |$)/i
    );
    const summaryChangesMatch = this.extractSection(
      response,
      /## Summary of Changes\s*\n([\s\S]*?)(?=\n## |$)/i
    );
    const changesMatch = this.extractSection(
      response,
      /## Changes\s*\n([\s\S]*?)(?=\n## |$)/i
    );
    const directoryMatch = this.extractSection(
      response,
      /## Directory Structure\s*\n```[^`]*\n([\s\S]*?)```/i
    );
    const fileChangesSection = this.extractSection(
      response,
      /## File Changes\s*\n([\s\S]*?)(?=\n## |$)/i
    );

    // Add directory structure if present
    if (directoryMatch) {
      blocks.push({
        type: "file-structure",
        content: directoryMatch.trim(),
      });
    }

    // Add summary if present
    if (summaryMatch) {
      blocks.push({
        type: "summary",
        content: summaryMatch.trim(),
      });
    }

    // Add analysis if present
    if (analysisMatch) {
      blocks.push({
        type: "analysis",
        content: analysisMatch.trim(),
      });
    }

    // Add changes list if present (multiple possible formats)
    let changesContent = "";
    if (summaryChangesMatch) changesContent = summaryChangesMatch;
    else if (changesMatch) changesContent = changesMatch;

    if (changesContent) {
      const listItems = changesContent
        .trim()
        .split("\n")
        .filter(
          (line) =>
            line.trim().startsWith("-") ||
            line.trim().startsWith("*") ||
            line.trim().match(/^\d+\./)
        );

      if (listItems.length > 0) {
        blocks.push({
          type: "list",
          content: listItems.join("\n"),
        });
      } else {
        // If not a list, add as text
        blocks.push({
          type: "text",
          content: changesContent.trim(),
        });
      }
    }

    // Parse file changes (code blocks) - Check multiple patterns
    let fileBlocks: ChatBlock[] = [];

    if (fileChangesSection) {
      // Parse from structured File Changes section
      fileBlocks =
        this.extractFileBlocksFromStructuredSection(fileChangesSection);
    } else {
      // Try to extract any code blocks from entire response
      fileBlocks = this.extractFileBlocksFromResponse(response);
    }

    // Add warning if we found no file blocks but response indicates changes
    if (
      fileBlocks.length === 0 &&
      (response.toLowerCase().includes("modified file") ||
        response.toLowerCase().includes("new file") ||
        response.toLowerCase().includes("### file:"))
    ) {
      blocks.push({
        type: "warning",
        content:
          "Found references to file changes but couldn't parse them. Please check the response format.",
      });
    } else {
      blocks.push(...fileBlocks);
    }

    // If no blocks were created (no structured format), add entire response as text
    if (blocks.filter((b) => b.type !== "query").length === 0) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
    }

    return blocks;
  }

  private extractSection(response: string, regex: RegExp): string | null {
    const match = response.match(regex);
    return match ? match[1]?.trim() || null : null;
  }

  private extractFileBlocksFromStructuredSection(section: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    // Pattern for: ### MODIFIED FILE: /path/to/file.ext
    const modifiedFileRegex =
      /### MODIFIED FILE:\s*(.+?)\s*\n```(\w+)?\n([\s\S]*?)```/gi;

    // Pattern for: ### NEW FILE: /path/to/file.ext
    const newFileRegex = /### NEW FILE:\s*(.+?)\s*\n```(\w+)?\n([\s\S]*?)```/gi;

    // Also support old format: ### File: /path/to/file.ext
    const fileRegex =
      /### File:\s*(.+?)(?:\s*\[(NEW|MODIFIED)\])?\s*\n```(\w+)?\n([\s\S]*?)```/gi;

    let match;

    // Check for MODIFIED FILE format
    while ((match = modifiedFileRegex.exec(section)) !== null) {
      const filePath = match[1].trim();
      const language =
        match[2]?.toLowerCase() || getLanguageFromPath(filePath) || "text";
      const content = match[3].trim();

      blocks.push({
        type: "code",
        filePath,
        language,
        content: `// MODIFIED\n${content}`,
      });
    }

    // Check for NEW FILE format
    while ((match = newFileRegex.exec(section)) !== null) {
      const filePath = match[1].trim();
      const language =
        match[2]?.toLowerCase() || getLanguageFromPath(filePath) || "text";
      const content = match[3].trim();

      blocks.push({
        type: "code",
        filePath,
        language,
        content: `// NEW FILE\n${content}`,
      });
    }

    // Check for old format
    while ((match = fileRegex.exec(section)) !== null) {
      const filePath = match[1].trim();
      const modificationType = match[2] || "MODIFIED";
      const language =
        match[3]?.toLowerCase() || getLanguageFromPath(filePath) || "text";
      const content = match[4].trim();

      blocks.push({
        type: "code",
        filePath,
        language,
        content: `// ${modificationType.toUpperCase()}\n${content}`,
      });
    }

    return blocks;
  }

  private extractFileBlocksFromResponse(response: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    // Look for any code blocks in the response
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || "text";
      const content = match[2].trim();

      // Try to extract file path from preceding text
      const precedingText = response.substring(0, match.index);
      const fileMatch =
        precedingText.match(/(?:file|path):\s*([^\s\n`]+\.\w+)/i) ||
        precedingText.match(/(?:modified|new) file:\s*([^\s\n`]+\.\w+)/i) ||
        precedingText.match(/###\s*([^\s\n`]+\.\w+)/i);

      const filePath = fileMatch
        ? fileMatch[1]
        : this.guessFilePathFromContent(content, language);

      blocks.push({
        type: "code",
        filePath: filePath || "unknown",
        language,
        content,
      });
    }

    return blocks;
  }

  private guessFilePathFromContent(
    content: string,
    language: string
  ): string | null {
    // Look for common patterns in first 10 lines
    const lines = content.split("\n").slice(0, 10);

    // Check for file path hints in comments or strings
    for (const line of lines) {
      // Look for import/export statements that might indicate file structure
      const importMatch = line.match(
        /(?:import|export|require|from)\s+['"]([^'"]+)['"]/
      );
      if (importMatch && importMatch[1].includes("/")) {
        return importMatch[1];
      }

      // Look for class/interface names that match file patterns
      const classMatch = line.match(
        /(?:class|interface|export\s+class|export\s+interface)\s+(\w+)/
      );
      if (classMatch) {
        const className = classMatch[1];
        const extensions: Record<string, string> = {
          javascript: ".js",
          typescript: ".ts",
          python: ".py",
          java: ".java",
          go: ".go",
          rust: ".rs",
          cpp: ".cpp",
          c: ".c",
          csharp: ".cs",
          php: ".php",
          ruby: ".rb",
          swift: ".swift",
          kotlin: ".kt",
        };
        const ext = extensions[language.toLowerCase()] || ".txt";
        return `${className}${ext}`;
      }
    }

    return null;
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
