import { useState, useCallback } from 'react';
import { projectService } from '../services/projectService';
import type { FileContent, SearchResult } from '../types';

interface UseFileSearchReturn {
  searchResults: SearchResult[];
  loading: boolean;
  error: string | null;
  searchFiles: (query: string, project?: string) => Promise<SearchResult[]>;
  loadFileContent: (project: string, filePath: string) => Promise<FileContent>;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResult[]>>;
}

export const useFileSearch = (): UseFileSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchFiles = useCallback(async (query: string, project: string = ''): Promise<SearchResult[]> => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    try {
      setLoading(true);
      const results = await projectService.searchFiles(query, project);
      setSearchResults(results);
      setError(null);
      return results;
    } catch (err: any) {
      const errorMessage = err.message || 'Search failed';
      setError(errorMessage);
      console.error('Search failed:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFileContent = useCallback(async (project: string, filePath: string): Promise<FileContent> => {
    try {
      const file = await projectService.getFileContent(project, filePath);
      return file;
    } catch (err: any) {
      console.error('Failed to load file:', err);
      throw err;
    }
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchFiles,
    loadFileContent,
    setSearchResults
  };
};