export function buildEmbeddingText(chunk: any) {
  return `
Symbol: ${chunk.symbol}
Type: ${chunk.type}
File: ${chunk.filePath}
Calls: ${chunk.calls.join(", ")}

${chunk.content}
  `.trim();
}
