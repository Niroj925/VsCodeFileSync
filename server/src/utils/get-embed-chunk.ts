import { ChunkData } from "../types";
import { getSavedProject } from "./get-project";
import { qdrant } from "../lib/qdrant";

export async function getChunkBySymbolName(
  chunk: ChunkData
) {
  if (!chunk.symbol?.trim()) return null;

  const project = getSavedProject();
  if (!project) return null;

  const results = await qdrant.scroll(project.name, {
    limit: 20,
    with_payload: true,
    filter: {
      must: [
        { key: "symbol", match: { value: chunk.symbol } },
        { key: "type", match: { value: chunk.type } },
      ],
    },
  });

  return results.points?.length ? results.points : null;
}

export async function getChunkIdsBySymbolName(
  chunk: ChunkData
): Promise<string[]> {
  if (!chunk.symbol?.trim()) return [];

  const project = getSavedProject();
  if (!project?.name) return [];

  const results = await qdrant.scroll(project.name, {
    limit: 20,
    with_payload: false,
    filter: {
      must: [
        { key: "symbol", match: { value: chunk.symbol } },
        { key: "type", match: { value: chunk.type } },
      ],
    },
  });

  if (!results.points?.length) return [];

  return results.points
    .map((p) => String(p.id))
    .filter(Boolean);
}
