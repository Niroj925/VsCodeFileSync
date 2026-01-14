import { FileData } from "../types";

type IncomingFileUpdate = {
  content: string;
  size: number;
  lastModified: Date;
};

export function hasFileChanged(
  existingFile: FileData,
  incoming: IncomingFileUpdate
): boolean {
  const oldNormalized = normalizeContent(existingFile.content);
  const newNormalized = normalizeContent(incoming.content);
  
  if (oldNormalized === newNormalized) {
    return false; 
  }
  
  return true;
}

function normalizeContent(content: string): string {
  let normalized = content;
  
  normalized = normalized.replace(/\/\/.*$/gm, "");
  normalized = normalized.replace(/#.*$/gm, "");
  
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, "");
  
  normalized = normalized.replace(
    /console\s*\.\s*(log|debug|info|warn|error|trace|table|dir|dirxml|group|groupEnd|time|timeEnd|assert|count|clear)\s*\([^)]*\)\s*;?/g,
    ""
  );
  
  normalized = normalized.replace(/\b(print|printf|println|debugger)\s*\([^)]*\)\s*;?/g, "");
  normalized = normalized.replace(/System\s*\.\s*out\s*\.\s*println\s*\([^)]*\)\s*;?/g, "");
  
  normalized = normalized.replace(/\s+/g, "");
  
  normalized = normalized.replace(/[;,]\s*$/gm, "");
  
  return normalized;
}