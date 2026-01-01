export function formatPrompt(
  query: string,
  files: Array<{ path: string; content: string }>
): string {
  let prompt = `User Request:\n${query}\n\n`;

  if (files.length) {
    prompt += `
                  The following files are provided STRICTLY as CONTEXT.
                  They MUST NOT be reprinted unless modified.

                  --- CONTEXT FILES ---
                  `;

                      files.forEach((file) => {
                        prompt += `
                  [CONTEXT FILE] ${file.path}
                  ${file.content}
                  `;
                      });

                      prompt += `
                  --- END CONTEXT ---
                  `;
                    }

                    prompt += `
                  IMPORTANT INSTRUCTIONS:
                  - Do NOT output file trees unless explicitly requested.
                  - Do NOT repeat context files unless modified.
                  - Only output NEW or MODIFIED files.
                  - If no file changes are needed, say so clearly.
                  `;

  return prompt;
}
