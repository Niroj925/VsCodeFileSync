import fs from "fs";
import path from "path";
import { extractChunksFromFiles } from "./extract.chunks";
import { ChunkData, StoredData, UpdateFileChunkInput } from "../types";

function isSameChunkContent(a: ChunkData, b: ChunkData): boolean {
  return a.content === b.content;
}

export function updateFileChunks({
  projectName,
  srcFolder,
  filePath,
  relativePath,
  content,
}: UpdateFileChunkInput): void {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "chunks.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let stored: StoredData = {
    projectName,
    path:filePath,
    chunks: [],
  };

  if (fs.existsSync(dataFile)) {
    try {
      stored = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
      console.warn("Failed to parse chunks.json, recreating...");
    }
  }

  const newFileChunks = extractChunksFromFiles(
    [{ path: relativePath, content }],
    srcFolder,
    projectName
  );

  for (const newChunk of newFileChunks) {
    const existingIndex = stored.chunks.findIndex(
      (c: ChunkData) => c.symbol === newChunk.symbol && c.type === newChunk.type
    );

    if (existingIndex !== -1) {
      const existingChunk = stored.chunks[existingIndex];
      const isChunkContentSame = isSameChunkContent(existingChunk, newChunk);

      if (!isChunkContentSame) {
        stored.chunks.splice(existingIndex, 1, newChunk);
      }
    } else {
      stored.chunks.push(newChunk);
    }
  }

  fs.writeFileSync(dataFile, JSON.stringify(stored, null, 2), "utf8");
}
