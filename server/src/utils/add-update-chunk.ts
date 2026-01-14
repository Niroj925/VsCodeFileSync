import fs from "fs";
import path from "path";
import { ChunkData, StoredData } from "../types";
import { getChunkIdsBySymbolName } from "./get-embed-chunk";
import { deleteEmbedChunk, embedChunkInsert } from "./embedding";

export async function addUpdateChunk(chunks: ChunkData[]) {
  const rootDir = process.cwd();
  const dataDir = path.resolve(rootDir, "data");
  const dataFile = path.resolve(dataDir, "chunks.json");

  let storedData: StoredData = {
    projectName: "",
    path: "",
    chunks: [],
  };

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, "utf8");
      const parsed = raw ? JSON.parse(raw) : {};

      storedData = {
        projectName: parsed.projectName ?? "",
        path: parsed.path ?? "",
        chunks: parsed.chunks ?? [],
      };
    }

    const existingChunks = storedData.chunks;
    const mutateChunks:ChunkData[]=[]

    const existingMap = new Map<string, number>();
    existingChunks.forEach((chunk, index) => {
      const key = `${chunk.filePath}::${chunk.symbol}`;
      existingMap.set(key, index);
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const newChunk of chunks) {
      const key = `${newChunk.filePath}::${newChunk.symbol}`;
      const existingIndex = existingMap.get(key);

      if (existingIndex === undefined) {
        existingChunks.push(newChunk);
        mutateChunks.push(newChunk)
        createdCount++;
      } else {
        const oldChunk = existingChunks[existingIndex];
        if (oldChunk.content !== newChunk.content) {
          existingChunks[existingIndex] = newChunk;
          mutateChunks.push(newChunk)
          updatedCount++;
        }
      }
    }

    for (const chunk of mutateChunks) {
      const embeddedChunkIds = await getChunkIdsBySymbolName(chunk);
      if (embeddedChunkIds.length > 0) {
        await deleteEmbedChunk(embeddedChunkIds);
      }
      console.log(`chunk ${chunk.symbol} embeded`);
      await embedChunkInsert(chunk);
    }

    storedData.chunks = existingChunks;

    fs.writeFileSync(dataFile, JSON.stringify(storedData, null, 2), "utf8");

    return {
      created: createdCount,
      updated: updatedCount,
      total: existingChunks.length,
    };
  } catch (err) {
    console.error("🔥 Failed to update chunks:", err);
    return null;
  }
}
