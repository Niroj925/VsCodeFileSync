import OpenAI from "openai";
import { v4 as uuid } from "uuid";
import { qdrant } from "../lib/qdrant";
import { buildEmbeddingText } from "../utils/buildEmbeddingText";
import fs from "fs";
import path from "path";
import { StoredData } from "../types";
import * as dotenv from "dotenv";
import { ensureCodeCollection } from "./createCollection";

dotenv.config();

export async function embedProjectChunks() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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
  if (!info.created) {
    return;
  }

  const chunks = stored?.chunks;
  for (const chunk of chunks) {
    const text = buildEmbeddingText(chunk);
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
  }
  console.log("points:", points);
  await qdrant.upsert("code_chunks", {
    wait: true,
    points,
  });

  console.log("successfully embedded the project");

  return points.length;
}
