import { useState, useCallback } from "react";
import type { FileContent, SearchResult } from "../types";
import { fileService } from "../services/fileService";

interface UseFileSearchReturn {
  searchResults: SearchResult[];
  loading: boolean;
  error: string | null;
  searchFiles: (query: string, project?: string) => Promise<SearchResult[]>;
  keepFileContentChange: (
    filePath: string,
    content: string
  ) => Promise<Boolean>;
  loadFileContent: (project: string, filePath: string) => Promise<FileContent>;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
}

export const useFile = (): UseFileSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchFiles = useCallback(
    async (query: string, project: string = ""): Promise<SearchResult[]> => {
      if (!query.trim()) {
        setSearchResults([]);
        return [];
      }

      try {
        setLoading(true);
        const results = await fileService.searchFiles(query, project);
        setSearchResults(results);
        setError(null);
        return results;
      } catch (err: any) {
        const errorMessage = err.message || "Search failed";
        setError(errorMessage);
        console.error("Search failed:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const keepFileContentChange = useCallback(
    async (path: string, content: string = ""): Promise<Boolean> => {
      try {
        setLoading(true);
        const payload = {
          path,
          content,
        };
        const results = await fileService.keepFileContentChange(payload);
        setError(null);
        return results;
      } catch (err: any) {
        const errorMessage = err.message || "changes not kept";
        setError(errorMessage);
        console.error("changes not kept:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadFileContent = useCallback(
    async (project: string, filePath: string): Promise<FileContent> => {
      try {
        const file = await fileService.getFileContent(project, filePath);
        return file;
      } catch (err: any) {
        console.error("Failed to load file:", err);
        throw err;
      }
    },
    []
  );

  return {
    searchResults,
    loading,
    error,
    searchFiles,
    keepFileContentChange,
    loadFileContent,
    setSearchResults,
  };
};
