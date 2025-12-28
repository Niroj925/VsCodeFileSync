import { ChatBlock, ChatRequest, LLMResponse } from "../types";
import { OpenAIProvider } from "../providers/openai.provider";
import { GeminiProvider } from "../providers/gemini.provider";
import { DeepSeekProvider } from "../providers/deepseek.provider";
import llmConfig from "../config/llm-config";
import fileService from "./file.service";

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
          default:
            console.warn(`Unknown provider: ${providerConfig.name}`);
        }
      } catch (error) {
        console.error(
          `Failed to initialize provider ${providerConfig.name}:`,
          error
        );
      }
    });
  }

  /**
   * MAIN CHAT ENTRY
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

      const filesWithContent = await this.collectFileContents(request);
      console.log('files with content:', filesWithContent);
      const prompt = this.formatPrompt(request.query, filesWithContent);
console.log('formatted prompt:', prompt);

      const rawResponse: string = await provider.sendMessage({
        prompt,
        model,
        temperature: request.options?.temperature ?? 0.7,
        maxTokens: request.options?.maxTokens ?? 2000,
        files: filesWithContent,
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
   * FILE COLLECTION
   */
  private async collectFileContents(
    request: ChatRequest
  ): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = [];

    for (const file of request.files || []) {
      try {
        let content = "";

        if (file.content) {
          content = file.content;
        } else if (request.projectName && file.path) {
          const fileData = fileService.getFile(
            request.projectName,
            file.path
          );
          if (fileData) content = fileData.content;
        }

        if (content) {
          results.push({
            path: file.path,
            content: this.truncateContent(content, 1200),
          });
        }
      } catch (err) {
        console.error(`Failed reading file ${file.path}`, err);
      }
    }

    return results;
  }

  /**
   * PROMPT FORMAT (STRICT)
   */
  private formatPrompt(
    query: string,
    files: Array<{ path: string; content: string }>
  ): string {
    let prompt = `User Query:\n${query}\n\n`;

    if (files.length) {
      prompt += `Context Files:\n`;
      for (const file of files) {
        prompt += `\n=== File: ${file.path} ===\n`;
        prompt += `${file.content}\n`;
      }
    }

    prompt += `
INSTRUCTIONS (IMPORTANT):
- Respond in structured markdown
- Use clear section headers
- ALWAYS include file paths when showing code
- Code blocks MUST be markdown
- Be concise and actionable

FORMAT:

## Analysis
Explain reasoning.

## Code Changes
For each file:
- Mention file path
- Provide full updated code

## Summary
Short final summary.
`;

    return prompt;
  }

  /**
   * FINAL RESPONSE FORMAT
   */
  private formatResponse(
    query: string,
    provider: string,
    model: string,
    llmResponse: string,
    files: Array<{ path: string; content: string }>
  ): LLMResponse {
    const blocks = this.parseLLMResponseToBlocks(
      query,
      llmResponse,
      files
    );

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
   * BLOCK PARSER (CHATGPT STYLE)
   */
  private parseLLMResponseToBlocks(
    query: string,
    response: string,
    contextFiles: Array<{ path: string; content: string }>
  ): ChatBlock[] {
    const blocks: ChatBlock[] = [];

    /** USER QUERY */
    blocks.push({
      type: "query",
      content: query,
    });

    /** ANALYSIS */
    const analysis = this.extractSection(response, "Analysis");
    if (analysis) {
      blocks.push({
        type: "analysis",
        content: analysis,
      });
    }

    /** TEXT / DETAILS */
    const details = this.extractSection(response, "Details");
    if (details) {
      blocks.push({
        type: "text",
        content: details,
      });
    }

    /** CODE BLOCKS */
    const codeRegex = /```(\w+)?\n(?:\/\/\s*path:\s*(.+)\n)?([\s\S]*?)```/g;

    let match;
    while ((match = codeRegex.exec(response)) !== null) {
      const language = match[1] || "text";
      const explicitPath = match[2];
      const rawContent = match[3].trim();

      // If the code block itself contains multiple files (common LLM output), split them
      const splitFiles = this.splitCombinedFiles(rawContent);

      if (splitFiles && splitFiles.length > 0) {
        for (const sf of splitFiles) {
          const filePath = sf.filePath || explicitPath || this.findMatchingFilePath(sf.content, contextFiles) || "unknown";
          blocks.push({
            type: "code",
            language: language,
            filePath,
            content: sf.content.trim(),
          });
        }
      } else {
        const filePath = explicitPath || this.findMatchingFilePath(rawContent, contextFiles) || "unknown";
        blocks.push({
          type: "code",
          language,
          filePath,
          content: rawContent,
        });
      }
    }

    /** SUMMARY */
    const summary = this.extractSection(response, "Summary");
    if (summary) {
      blocks.push({
        type: "summary",
        content: summary,
      });
    }

    /** FALLBACK */
    if (blocks.length <= 1) {
      blocks.push({
        type: "text",
        content: response,
      });
    }

    return blocks;
  }

  /**
   * Try to find which file a code snippet belongs to by substring matching.
   */
  private findMatchingFilePath(
    snippet: string,
    contextFiles: Array<{ path: string; content: string }>
  ): string | null {
    if (!contextFiles || contextFiles.length === 0) return null;

    if (contextFiles.length === 1) return contextFiles[0].path;

    const snippetSample = snippet.slice(0, 200).trim();

    for (const f of contextFiles) {
      if (!f.content) continue;
      if (f.content.includes(snippetSample)) return f.path;
    }

    const lines = snippet.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const f of contextFiles) {
      let matches = 0;
      for (const line of lines.slice(0, 10)) {
        if (line.length < 5) continue;
        if (f.content.includes(line)) matches++;
      }
      if (matches >= Math.min(3, lines.length)) return f.path;
    }

    return null;
  }

  /**
   * Split a code block that contains multiple files into individual file snippets.
   * Recognizes separators like "=== File: <path> ===" and returns an array
   * of { filePath, content } entries. If no separators are found, returns []
   * (meaning treat as a single block).
   */
  private splitCombinedFiles(
    content: string
  ): Array<{ filePath?: string; content: string }> {
    const fileHeaderRegex = /^===\s*File:\s*(.+?)\s*===\s*$/gim;
    const matches = [...content.matchAll(fileHeaderRegex)];
    if (matches.length === 0) return [];

    const parts: Array<{ filePath?: string; content: string }> = [];

    // Find indices of headers
    const headers: { index: number; path: string }[] = matches.map((m) => ({ index: (m.index || 0), path: m[1].trim() }));

    for (let i = 0; i < headers.length; i++) {
      const start = headers[i].index! + matches[i][0].length;
      const end = i + 1 < headers.length ? headers[i + 1].index! : content.length;
      const snippet = content.slice(start, end).trim();
      parts.push({ filePath: headers[i].path, content: snippet });
    }

    return parts;
  }

  /**
   * SECTION EXTRACTOR
   */
  private extractSection(text: string, title: string): string | null {
    const regex = new RegExp(
      `##\\s*${title}[\\s\\S]*?(?=##|$)`,
      "i"
    );
    const match = text.match(regex);
    return match
      ? match[0].replace(new RegExp(`##\\s*${title}`, "i"), "").trim()
      : null;
  }

  /**
   * CONTENT TRUNCATION
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    return (
      content.slice(0, maxLength) +
      "\n\n... [content truncated for context]"
    );
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
