import fs from "fs";
import path from "path";
import { extractChunksFromFiles } from "./extract.chunks";
import { ChunkData, StoredData, UpdateFileChunkInput } from "../types";
import {
  getChunkIdsBySymbolName,
} from "./get-embed-chunk";
import { deleteEmbedChunk, embedChunkInsert } from "./embedding";

function isSameChunkContent(a: ChunkData, b: ChunkData): boolean {
  return a.content === b.content;
}

export async function updateFileChunks({
  projectName,
  srcFolder,
  filePath,
  relativePath,
  content,
}: UpdateFileChunkInput) {
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "chunks.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let stored: StoredData = {
    projectName,
    path: filePath,
    chunks: [],
  };

  if (fs.existsSync(dataFile)) {
    try {
      stored = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
      console.warn("Failed to parse chunks.json, recreating...");
    }
  }

  const newFileChunks =await extractChunksFromFiles(
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
    const embeddedChunkIds = await getChunkIdsBySymbolName(newChunk);
    console.log("Existing embedded chunk IDs:", embeddedChunkIds);

    if (embeddedChunkIds.length > 0) {
      await deleteEmbedChunk(embeddedChunkIds);
    }

    stored.chunks.splice(existingIndex, 1, newChunk);

    await embedChunkInsert(newChunk);
  }
} else {
  stored.chunks.push(newChunk);
  await embedChunkInsert(newChunk);
}

  }

  fs.writeFileSync(dataFile, JSON.stringify(stored, null, 2), "utf8");
}
