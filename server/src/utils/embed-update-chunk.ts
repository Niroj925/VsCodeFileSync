import { ChunkData } from "../types";
import { getChunkIdsBySymbolName } from "./get-embed-chunk";
import { deleteEmbedChunk, embedChunkInsert } from "./embedding";
import { getSavedProject } from "./get-project";
import { qdrant } from "../lib/qdrant";

export async function EmbedUpdateChunk(chunks: ChunkData[]) {
  try {
    const project = getSavedProject();
    if (!project?.name) return null;

    console.log("📦 Active project:", project.name);

    // Count existing points
    const collection = await qdrant.count(project.name);
    console.log(`🔢 Points in ${project.name}:`, collection.count);

    // Scroll all embedded chunks
    const scrollResult = await qdrant.scroll(project.name, {
      limit: collection.count,
      with_payload: true,
    });

    // Map Qdrant points to EmbeddedChunk
    const embeddedChunks: (ChunkData & { id: string })[] =
      scrollResult.points.map((point: any) => ({
        id: point.id,
        ...(point.payload as ChunkData),
      }));

    console.log("🧠 Embedded chunks:", embeddedChunks.length);
    console.log("📄 Payload chunks:", chunks.length);

    // Build lookup map for embedded chunks
    const embeddedMap = new Map<string, ChunkData & { id: string }>();
    for (const chunk of embeddedChunks) {
      const key = `${project.name}::${chunk.symbol}`;
      embeddedMap.set(key, chunk);
    }

    if (embeddedChunks.length > chunks.length) {
      for (const chunk of embeddedChunks) {
      }
    }
    // Build lookup map for payload chunks
    const payloadMap = new Map<string, ChunkData>();
    for (const chunk of chunks) {
      const key = `${project.name}::${chunk.symbol}`;
      payloadMap.set(key, chunk);
    }

    // Separate chunks into created, updated, unchanged
    const created: ChunkData[] = [];
    const updated: ChunkData[] = [];
    const deletedIds: string[] = [];

    for (const chunk of chunks) {
      const key = `${project.name}::${chunk.symbol}`;
      const embedded = embeddedMap.get(key);

      if (!embedded) {
        created.push(chunk);
      } else if (embedded.content !== chunk.content) {
        updated.push(chunk);
      }
    }

    for (const embedded of embeddedChunks) {
      const key = `${project.name}::${embedded.symbol}`;
      if (!payloadMap.has(key)) {
        deletedIds.push(embedded.id);
      }
    }

    deletedIds.length > 0 && (await deleteEmbedChunk(deletedIds));

    for (const chunk of updated) {
      const ids = await getChunkIdsBySymbolName(chunk);
      await deleteEmbedChunk(ids);
      await embedChunkInsert(chunk);
      console.log(`chunk ${chunk.symbol} embeded`);
    }

    for (const chunk of created) {
      await embedChunkInsert(chunk);
      console.log(`chunk ${chunk.symbol} embeded`);
    }

    return {
      updated: updated.length,
      created: created.length,
    };
  } catch (err) {
    console.error("🔥 Failed to update chunks:", err);
    return null;
  }
}
