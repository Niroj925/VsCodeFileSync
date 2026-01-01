// llm.service.ts - Corrected version
import { ChatBlock, ChatRequest, LLMResponse } from "../types";
import { OpenAIProvider } from "../providers/openai.provider";
import { GeminiProvider } from "../providers/gemini.provider";
import { DeepSeekProvider } from "../providers/deepseek.provider";
import llmConfig from "../config/llm-config";
import { formatPrompt } from "../utils/prompt.utils";
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

      // Prepare context files for prompt ONLY (not for output)
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

      // console.log('raw response:', rawResponse);

      // Pass ONLY the LLM response, NOT context files
      return this.formatResponse(
        request.query,
        providerName,
        model,
        rawResponse  // Only LLM response here
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
    llmResponse: string  // Only LLM's response
  ): LLMResponse {
    // Parse ONLY the LLM response
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
    response: string  // Only LLM response
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    // Always include the query
    blocks.push({
      type: "query",
      content: query,
    });

    if (!response || response.trim() === '') {
      blocks.push({
        type: "text",
        content: "The LLM provider returned an empty response.",
      });
      return blocks;
    }

    // Parse structured sections from LLM response
    const parsedBlocks = this.parseStructuredResponse(response);
    blocks.push(...parsedBlocks);

    // REMOVED: All code that shows context files
    
    return blocks;
  }

  private parseStructuredResponse(response: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    
    // Check if it's a "no changes" response
    if (response.toLowerCase().includes('no file changes required') ||
        response.toLowerCase().includes('no changes needed')) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
      return blocks;
    }

    // Extract structured sections from LLM response
    const summaryMatch = this.extractSection(response, /## Summary\s*\n([\s\S]*?)(?=\n## |$)/i);
    const analysisMatch = this.extractSection(response, /## Analysis\s*\n([\s\S]*?)(?=\n## |$)/i);
    const changesMatch = this.extractSection(response, /## Changes\s*\n([\s\S]*?)(?=\n## |$)/i);
    const fileChangesSection = this.extractSection(response, /## File Changes\s*\n([\s\S]*)$/i);

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

    // Add changes list if present
    if (changesMatch) {
      const listItems = changesMatch.trim()
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
      
      if (listItems.length > 0) {
        blocks.push({
          type: "list",
          content: listItems.join('\n'),
        });
      } else {
        // If not a list, add as text
        blocks.push({
          type: "text",
          content: changesMatch.trim(),
        });
      }
    }

    // Parse file changes (code blocks)
    if (fileChangesSection) {
      const fileBlocks = this.extractFileBlocks(fileChangesSection);
      blocks.push(...fileBlocks);
    } else {
      // If no structured file changes, try to extract any code blocks
      const fallbackBlocks = this.extractAllCodeBlocks(response);
      blocks.push(...fallbackBlocks);
    }

    // If no blocks were created (no structured format), add entire response as text
    if (blocks.length === 0) {
      blocks.push({
        type: "text",
        content: response.trim(),
      });
    }

    return blocks;
  }

  private extractSection(response: string, regex: RegExp): string | null {
    const match = response.match(regex);
    return match ? match[1] : null;
  }

  private extractFileBlocks(section: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    
    // Pattern for: ### File: /path/to/file.ext
    const fileRegex = /### File:\s*(.+?)(?:\s*\[(NEW|MODIFIED)\])?\s*\n```(\w+)?\n([\s\S]*?)```/gi;
    
    let match;
    while ((match = fileRegex.exec(section)) !== null) {
      const filePath = match[1].trim();
      const modificationType = match[2] || '';
      const language = match[3]?.toLowerCase() || getLanguageFromPath(filePath) || 'text';
      const content = match[4].trim();
      
      // Add modification type to content if present
      let displayContent = content;
      if (modificationType) {
        displayContent = `// ${modificationType.toUpperCase()}\n${content}`;
      }
      
      blocks.push({
        type: "code",
        filePath,
        language,
        content: displayContent,
      });
    }
    
    return blocks;
  }

  private extractAllCodeBlocks(response: string): ChatBlock[] {
    const blocks: ChatBlock[] = [];
    
    // Pattern for any code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      // Add text before code block
      const textBefore = response.substring(lastIndex, match.index).trim();
      if (textBefore) {
        blocks.push({
          type: "text",
          content: textBefore,
        });
      }
      
      // Extract code block
      const language = match[1] || 'text';
      const content = match[2].trim();
      
      // Try to guess file path from content (optional)
      const filePath = this.guessFilePathFromContent(content, language);
      
      blocks.push({
        type: "code",
        filePath: filePath || "unknown",
        language,
        content,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after last code block
    const textAfter = response.substring(lastIndex).trim();
    if (textAfter) {
      blocks.push({
        type: "text",
        content: textAfter,
      });
    }
    
    return blocks;
  }

  private guessFilePathFromContent(content: string, language: string): string | null {
    // Look for common patterns in first 10 lines
    const lines = content.split('\n').slice(0, 10);
    
    // Check for file path hints in comments or strings
    for (const line of lines) {
      // Look for patterns like: "file: path/to/file.ext"
      const pathMatch = line.match(/(?:file|path|location):\s*['"]?([\w./-]+\.\w{2,4})['"]?/i);
      if (pathMatch) {
        return pathMatch[1];
      }
      
      // Look for import/require statements with file extensions
      const importMatch = line.match(/(?:import|require|from)\s+['"]([\w./-]+\.\w{2,4})['"]/i);
      if (importMatch) {
        return importMatch[1];
      }
      
      // Look for file extensions in the line
      const extMatch = line.match(/\b[\w./-]+\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|cs|php|rb|swift|kt)\b/i);
      if (extMatch) {
        return extMatch[0];
      }
    }
    
    // Default: create a name based on language
    const languageNames: Record<string, string> = {
      'javascript': 'script.js',
      'typescript': 'script.ts',
      'python': 'script.py',
      'java': 'Main.java',
      'go': 'main.go',
      'rust': 'main.rs',
      'cpp': 'main.cpp',
      'c': 'main.c',
      'csharp': 'Program.cs',
      'php': 'script.php',
      'ruby': 'script.rb',
      'swift': 'main.swift',
      'kotlin': 'Main.kt',
    };
    
    return languageNames[language.toLowerCase()] || 'unknown';
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