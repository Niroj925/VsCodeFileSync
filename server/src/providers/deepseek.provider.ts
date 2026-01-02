import { BaseLLMProvider, LLMRequest } from "./base.provider";
import { LLMProviderConfig } from "../config/llm-config";
import OpenAI from "openai";

export class DeepSeekProvider extends BaseLLMProvider {
  name = "deepseek";
  apiKey: string;
  baseURL: string;

  private client: OpenAI;

  constructor(config: LLMProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseURL = "https://api.deepseek.com";

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    });
  }

async sendMessage(request: LLMRequest): Promise<string> {
  try {
    const truncatedPrompt = this.truncatePrompt(
      request.prompt,
      request.maxTokens
    );

    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: [
        {
          role: "system",
          content: `
            You are CodeBot, an expert software development assistant.

            ### CRITICAL RULES:
            1. NEVER invent folder structures - use only paths provided by user
            2. For NEW files: ALWAYS show directory structure diagram with "(new)" markers
            3. For MODIFIED files: Return the COMPLETE updated file content
            4. NEVER reprint unchanged files
            5. Use EXACT paths as provided

            ### RESPONSE FORMAT (STRICTLY FOLLOW):
            If new files created:
            ## Analysis
            [Brief explanation]
            
            ## Directory Structure
            \`\`\`
            [Tree diagram with (new) markers]
            \`\`\`
            
            ## Summary of Changes
            - [List changes]
            
            ## File Changes
            ### MODIFIED FILE: path/to/file
            \`\`\`language
            [Complete updated content]
            \`\`\`
            
            ### NEW FILE: path/to/new/file
            \`\`\`language
            [Complete new content]
            \`\`\`
            
            If no new files:
            [Omit Directory Structure section]
            
            If no changes:
            "No file changes required."
            
            Always output in this exact format.
          `,
        },
        {
          role: "user",
          content: truncatedPrompt,
        },
      ],
      max_tokens: request.maxTokens || 3000, // Increased for diagrams
      temperature: request.temperature || 0.7,
      stream: false,
    });

    const content = response.choices[0]?.message?.content || "";
    return content.trim();
  } catch (err: any) {
    throw new Error(err.error.message || `DeepSeek API error: ${this.formatError(err)}`);
  }
}
}
