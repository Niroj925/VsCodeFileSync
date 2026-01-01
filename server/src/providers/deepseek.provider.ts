import { BaseLLMProvider, LLMRequest } from "./base.provider";
import { LLMProviderConfig } from "../config/llm-config";
import OpenAI from "openai";
import e from "express";

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

              ### STRICT RULES (MUST FOLLOW):
              1. DO NOT invent or infer project folder structure.
              2. DO NOT show folder trees unless the user EXPLICITLY asks for folder structure.
              3. DO NOT return full file contents unless:
                - the file is NEW, or
                - the file is MODIFIED.
              4. NEVER reprint unchanged files.
              5. When modifying files:
                - Return ONLY the changed file(s).
                - Use exact file paths provided by the user.
              6. If creating new files:
                - Clearly mark them as NEW FILE.
              7. If no file changes are required:
                - Say: "No file changes required."

              ### RESPONSE FORMAT (MANDATORY):
              Use the following structure EXACTLY:

              ## Summary
              Brief explanation of what was done.

              ## Changes
              - List of modified or new files with reasons.

              ## File Changes
              For each file:
              ### File: <exact/path>
              \`\`\`<language>
              <ONLY the new or updated content>
              \`\`\`

              If the user did NOT ask for code changes, do NOT include "File Changes".

              Failure to follow these rules is considered an error.
              `,
          },
          {
            role: "user",
            content: truncatedPrompt,
          },
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || "";
      return content.trim();
    } catch (err: any) {
      // console.error("DeepSeek provider error:", err);
      throw new Error(err.error.message || `DeepSeek API error: ${this.formatError(err)}`);
    }
  }
}
