import { v4 as uuid } from "uuid";
import { qdrant } from "../lib/qdrant";
import { buildEmbeddingText } from "../utils/buildEmbeddingText";
import fs from "fs";
import path from "path";
import { ChunkData } from "../types";
import * as dotenv from "dotenv";
import { ensureCodeCollection } from "./createCollection";
import { getSavedProject } from "./get-project";
import { openai } from "../lib/openai";

dotenv.config();

export async function embedProjectChunks() {
  const points = [];
  let stored;
  const dataDir = path.join(process.cwd(), "data");
  const dataFile = path.join(dataDir, "chunks.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dataFile)) {
    try {
      stored = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
      console.warn("Failed to parse chunks.json, recreating...");
    }
  }

  const info = await ensureCodeCollection(stored?.projectName);
  console.log("info:", info);
  // if (!info.created) {
  //   return;
  // }

  const chunks = stored?.chunks;
  let chunkCount = 0;
  console.log("embedding running......");
  for (const chunk of chunks) {
    const text = buildEmbeddingText(chunk);
    chunkCount += 1;
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    points.push({
      id: uuid(),
      vector: embedding.data[0].embedding,
      payload: {
        projectName: stored.projectName,
        symbol: chunk.symbol,
        type: chunk.type,
        filePath: chunk.filePath,
        lineRange: chunk.lineRange,
        calls: chunk.calls,
        content: chunk.content,
      },
    });
    console.log(`chunk ${chunk.symbol} embedded.`);
  }
  await qdrant.upsert(stored?.projectName, {
    wait: true,
    points,
  });

  console.log("successfully embedded the project");
  return points.length;
}

export async function embedChunkInsert(chunk: ChunkData) {
  const project = getSavedProject();
  if (!project?.name) return null;
  const points = [];
  const text = buildEmbeddingText(chunk);
  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  points.push({
    id: uuid(),
    vector: embedding.data[0].embedding,
    payload: {
      projectName: project?.name,
      symbol: chunk.symbol,
      type: chunk.type,
      filePath: chunk.filePath,
      lineRange: chunk.lineRange,
      calls: chunk.calls,
      content: chunk.content,
    },
  });

  await qdrant.upsert(project?.name, {
    wait: true,
    points,
  });

  console.log(`chunk ${chunk.symbol} embedded.`);
}

export async function deleteEmbedChunk(ids: string[]): Promise<boolean | null> {
  try {
    const project = getSavedProject();
    if (!project?.name) return null;

    await qdrant.delete(project.name, {
      points: ids,
    });

    console.log(`Deleted chunk with id: ${ids}`);
    return true;
  } catch (err) {
    console.warn(`Failed to delete chunk id ${ids}:`, err);
    return false;
  }
}
