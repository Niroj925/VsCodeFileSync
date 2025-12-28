export class PromptUtils {
  /**
   * Format prompt for LLM with files context
   */
  static formatPrompt(query: string, files: Array<{ path: string; content: string }>): string {
    let prompt = `# User Query\n${query}\n\n`;
    
    if (files.length > 0) {
      prompt += "# Relevant Files\n\n";
      files.forEach((file, index) => {
        prompt += `## File ${index + 1}: ${file.path}\n`;
        prompt += `\`\`\`\n${file.content}\n\`\`\`\n\n`;
      });
    }
    
    prompt += `# Instructions\n
1. Analyze the user's query in the context of provided files
2. Provide clear, actionable advice
3. Reference specific file paths when suggesting changes
4. Format code examples in markdown code blocks with proper language tags
5. Structure your response with:
   - Analysis/Explanation
   - File-specific recommendations (if any files provided)
   - Code examples (if applicable)
   - Summary/Next steps

Format your response using markdown for better readability.`;

    return prompt;
  }

  /**
   * Parse LLM response into structured format
   */
  static parseResponse(
    response: string, 
    originalFiles: Array<{ path: string; content: string }>
  ): {
    message: string;
    files?: Array<{
      path: string;
      description: string;
      code?: string;
      suggestions?: string[];
    }>;
    summary?: string;
  } {
    // Extract main message/analysis
    let message = response.trim();
    
    // Try to extract file-specific sections
    const fileSections: Array<{
      path: string;
      description: string;
      code?: string;
      suggestions?: string[];
    }> = [];

    // Look for file references in response
    originalFiles.forEach(file => {
      if (response.toLowerCase().includes(file.path.toLowerCase())) {
        // Try to extract context around the file reference
        const fileRegex = new RegExp(`(.{0,200}${file.path}.{0,200})`, 'i');
        const match = response.match(fileRegex);
        
        if (match) {
          let description = match[0];
          
          // Extract code blocks that might be related to this file
          const codeBlocks: string[] = [];
          const codeRegex = /```[\s\S]*?```/g;
          let codeMatch;
          
          while ((codeMatch = codeRegex.exec(response)) !== null) {
            if (codeMatch[0].toLowerCase().includes(file.path.toLowerCase())) {
              codeBlocks.push(codeMatch[0]);
            }
          }

          fileSections.push({
            path: file.path,
            description: description,
            code: codeBlocks.length > 0 ? codeBlocks.join('\n\n') : undefined,
            suggestions: this.extractSuggestions(response, file.path)
          });
        }
      }
    });

    // Extract summary if present
    let summary = '';
    const summaryRegex = /(?:summary|conclusion|next steps)[:\s]*([\s\S]*?)(?=\n#|\n##|$)/i;
    const summaryMatch = response.match(summaryRegex);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
      // Remove summary from main message
      message = message.replace(summaryMatch[0], '').trim();
    }

    return {
      message,
      files: fileSections.length > 0 ? fileSections : undefined,
      summary: summary || undefined
    };
  }

  /**
   * Extract suggestions for a specific file
   */
  private static extractSuggestions(response: string, filePath: string): string[] {
    const suggestions: string[] = [];
    const suggestionKeywords = ['should', 'recommend', 'suggest', 'consider', 'improve', 'fix'];
    
    // Look for lines that mention the file and contain suggestion keywords
    const lines = response.split('\n');
    let inFileContext = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (line.includes(filePath.toLowerCase())) {
        inFileContext = true;
      }
      
      if (inFileContext && suggestionKeywords.some(keyword => line.includes(keyword))) {
        suggestions.push(lines[i].trim());
        // Look ahead a few lines for more context
        for (let j = 1; j <= 3 && i + j < lines.length; j++) {
          if (lines[i + j].trim() && !lines[i + j].trim().startsWith('#')) {
            suggestions[suggestions.length - 1] += ' ' + lines[i + j].trim();
          } else {
            break;
          }
        }
      }
      
      // Reset context if we hit a new section
      if (line.startsWith('#') && i > 0) {
        inFileContext = false;
      }
    }
    
    return suggestions.length > 0 ? suggestions : [];
  }

  /**
   * Truncate content for context window
   */
  static truncateContent(content: string, maxLines: number = 50): string {
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    
    return lines.slice(0, maxLines).join('\n') + '\n... [content truncated]';
  }
}