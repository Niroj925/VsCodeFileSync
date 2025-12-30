export function formatPrompt(
  query: string,
  files: Array<{ path: string; content: string }>
): string {
  let prompt = `User Query: ${query}\n\n`;

  if (files.length) {
    prompt += "I'm providing these files for context:\n\n";
    files.forEach((file) => {
      prompt += `=== File: ${file.path} ===\n`;
      prompt += `${file.content}\n\n`;
    });
  }

  prompt += `Please analyze the query and provide a helpful response. 
If you're showing code changes, please format them in markdown code blocks and mention which file they belong to.
If you're showing the original files, include them in code blocks with their file paths.`;

  return prompt;
}
