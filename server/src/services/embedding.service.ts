import { embedQuery } from "../utils/embed-query";
import { ChunkData, KeywordExtraction, SearchRelevantChunkResult } from "../types";
import { qdrant } from "../lib/qdrant";
import { v4 as uuid } from 'uuid';
import { buildEmbeddingText } from "../utils/buildEmbeddingText";
import fs from "fs";
import path from "path";
import { openai } from "../lib/openai";
import { ensureCodeCollection } from "../utils/createCollection";
import { extractKeywordsWithLLM } from "../utils/extract-query";
import { getSavedProject } from "../utils/get-project";

class EmbeddingService {
  async embedProjectChunks() {
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
    await qdrant.upsert(stored?.projectName, {
      wait: true,
      points,
    });

    console.log("successfully embedded the project");

    return points.length;
  }

  async searchChunksWithFilters(
    query: string,
    filters: {
      projectName?: string;
      filePath?: string;
      type?: string;
      symbol?: string;
    } = {},
    limit = 10
  ) {
    try {
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });

      const filterConditions: any[] = [];

      if (filters.projectName) {
        filterConditions.push({
          key: "projectName",
          match: { value: filters.projectName },
        });
      }

      if (filters.filePath) {
        filterConditions.push({
          key: "filePath",
          match: { value: filters.filePath },
        });
      }

      if (filters.type) {
        filterConditions.push({
          key: "type",
          match: { value: filters.type },
        });
      }

      if (filters.symbol) {
        filterConditions.push({
          key: "symbol",
          match: { value: filters.symbol },
        });
      }

      const filter =
        filterConditions.length > 0
          ? {
              must: filterConditions,
            }
          : undefined;

      // Search with filters
      const searchResult = await qdrant.search(filters?.projectName as string, {
        vector: queryEmbedding.data[0].embedding,
        limit,
        with_payload: true,
        with_vector: false,
        filter,
      });

      return {
        chunks: searchResult.map((result) => ({
          id: result.id,
          similarityScore: result.score,
          ...(result.payload ?? {}),
        })),
        query,
        filters,
        totalResults: searchResult.length,
      };
    } catch (error) {
      console.error("Error searching with filters:", error);
      throw error;
    }
  }

  async hybridSearchChunks(query: string, keyword?: string, limit = 10) {
    try {
       const project=getSavedProject()
      if(!project?.name) return null;

      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });

      const filter = keyword
        ? {
            should: [
              {
                key: "content",
                match: { text: keyword },
              },
              {
                key: "symbol",
                match: { value: keyword },
              },
            ],
          }
        : undefined;

      const searchResult = await qdrant.search(project.name, {
        vector: queryEmbedding.data[0].embedding,
        limit,
        with_payload: true,
        with_vector: false,
        filter,
      });

      return {
        chunks: searchResult.map((result) => ({
          id: result.id,
          similarityScore: result.score,
          ...(result.payload ?? {}),
        })),
        query,
        keyword,
        totalResults: searchResult.length,
      };
    } catch (error) {
      console.error("Error in hybrid search:", error);
      throw error;
    }
  }

  async getServerChunks(limit = 10, offset?: string) {
    try {
      const project = getSavedProject();
      if (!project?.name) return null;
      const res = await qdrant.scroll(project?.name, {
        limit,
        offset,
        with_payload: true,
        with_vector: false,
      });
      if (!res.points || res.points.length === 0) {
        console.log("No points found in collection 'server'");
        return {
          chunks: [],
          nextOffset: null,
        };
      }
      return {
        chunks: res.points.map((p) => ({
          id: p.id,
          ...(p.payload ?? {}),
        })),
        nextOffset: res.next_page_offset,
      };
    } catch (error) {
      console.error("Error fetching chunks from Qdrant:", error);
      throw error;
    }
  }

  async countPoints() {
    try {
      const project = getSavedProject();
      if (!project?.name) return null;
      const count = await qdrant.count(project?.name);
      console.log("Points in code_chunks:", count.count);
      return count;
    } catch (error) {
      console.error("Error counting points:", error);
    }
  }

  async deleteCollection(collectionName: string): Promise<boolean> {
    if (!collectionName) {
      throw new Error("Collection name is required");
    }

    try {
      // Check if collection exists first (safe guard)
      const collections = await qdrant.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === collectionName
      );

      if (!exists) {
        console.warn(`Collection "${collectionName}" does not exist`);
        return false;
      }

      // Delete collection
      await qdrant.deleteCollection(collectionName);

      console.log(`✅ Collection "${collectionName}" deleted successfully`);
      return true;
    } catch (error) {
      console.error(
        `❌ Failed to delete collection "${collectionName}":`,
        error
      );
      throw error;
    }
  }

async searchRelevantChunks(query: string):Promise<SearchRelevantChunkResult[]> {
  if (!query) return [];
  const project = getSavedProject();
  if (!project) return [];

  const keywords = await extractKeywordsWithLLM(query);

  const enhancedQuery = this.buildEnhancedQuery(query, keywords);
  const vector = await embedQuery(enhancedQuery);

  const results = await qdrant.search(project?.name, {
    vector,
    limit: 50,
    with_payload: true,
    with_vector: false,
  });

  const reranked = this.rerankBySymbolMatch(results, keywords, query);

  const normalized = await this.normalizeScores(reranked);

  return normalized.filter((r) => r.score >= 0.5);
}


  private buildEnhancedQuery(
    originalQuery: string,
    keywords: KeywordExtraction
  ): string {
    const { primary, secondary, codePatterns } = keywords;

    const boosted = [
      originalQuery,
      ...primary.flatMap((k: any) => [k, k, k]),
      ...secondary.flatMap((k: any) => [k, k]),
      ...codePatterns.flatMap((k: any) => [k, k, k, k]),
    ];

    return boosted.join(" ");
  }

  private rerankBySymbolMatch(
    results: any[],
    keywords: KeywordExtraction,
    originalQuery: string
  ) {
    const scored = results.map((result) => {
      const symbol = (result.payload?.symbol || "").toLowerCase();
      const filePath = (result.payload?.filePath || "").toLowerCase();
      const type = result.payload?.type || "";

      let score = result.score || 0; // Base vector similarity score
      let matchReason: string[] = [];

      // 1. EXACT symbol match with code patterns (HIGHEST PRIORITY)
      keywords.codePatterns.forEach((pattern: any) => {
        const lowerPattern = pattern.toLowerCase();
        if (symbol === lowerPattern) {
          score *= 3.0;
          matchReason.push(`Exact symbol match: ${pattern}`);
        } else if (symbol.includes(lowerPattern)) {
          score *= 2.5;
          matchReason.push(`Symbol contains: ${pattern}`);
        }
      });

      // 2. Primary keyword in symbol (HIGH PRIORITY)
      keywords.primary.forEach((keyword: any) => {
        if (symbol.includes(keyword)) {
          score *= 2.0;
          matchReason.push(`Primary keyword in symbol: ${keyword}`);
        }
      });

      // 3. Split symbol by camelCase and match parts
      const symbolParts = this.splitSymbolName(symbol);
      const primaryMatches = keywords.primary.filter((k: any) =>
        symbolParts.some((part) => part.includes(k) || k.includes(part))
      );

      if (primaryMatches.length > 0) {
        score *= 1.5 * primaryMatches.length;
        matchReason.push(`Symbol parts match: ${primaryMatches.join(", ")}`);
      }

      // 4. Secondary keywords in symbol
      keywords.secondary.forEach((keyword: any) => {
        if (symbol.includes(keyword)) {
          score *= 1.3;
          matchReason.push(`Secondary keyword: ${keyword}`);
        }
      });

      // 5. Action verbs in symbol (e.g., "show", "format", "change")
      keywords.actions.forEach((action: any) => {
        if (symbol.includes(action)) {
          score *= 1.4;
          matchReason.push(`Action in symbol: ${action}`);
        }
      });

      // 6. File path relevance
      [...keywords.primary, ...keywords.secondary].forEach((keyword: any) => {
        if (filePath.includes(keyword)) {
          score *= 1.2;
          matchReason.push(`Keyword in path: ${keyword}`);
        }
      });

      // 7. Prefer certain types for UI queries
      const uiKeywords = [
        "toast",
        "modal",
        "dialog",
        "button",
        "form",
        "component",
      ];
      const isUIQuery = keywords.primary.some((k: any) =>
        uiKeywords.includes(k.toLowerCase())
      );

      if (
        isUIQuery &&
        (type === "component" ||
          type === "class-method" ||
          filePath.includes("component"))
      ) {
        score *= 1.3;
        matchReason.push("UI-related type");
      }

      // 8. Penalize generic utility functions unless highly relevant
      const genericPatterns = ["format", "parse", "validate", "convert"];
      const isGenericSymbol = genericPatterns.some((p) => symbol === p);
      if (isGenericSymbol && matchReason.length === 0) {
        score *= 0.5;
      }

      return {
        id: result.id,
        score,
        matchReason,
        ...(result.payload as any),
      };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  private splitSymbolName(symbol: string): string[] {
    return symbol
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // PascalCase
      .replace(/[._-]/g, " ") // snake_case, kebab-case
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }

  async normalizeScores(scoredResults: any[]) {
    if (scoredResults.length === 0) return [];

    const scores = scoredResults.map((r) => r.score);
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    return scoredResults.map((r) => {
      let normalizedScore = 0;

      if (max !== min) {
        normalizedScore = (r.score - min) / (max - min);
      } else {
        normalizedScore = 1; // all equal
      }

      return {
        ...r,
        score: Number(normalizedScore.toFixed(4)), // FINAL 0–1 score
      };
    });
  }
}

export default new EmbeddingService();
