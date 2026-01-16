import type { FileContent, FileItem, SearchResult } from "../types";
import api from "./api";

export const fileService = {

    getProjectFiles: async (projectName: string): Promise<FileItem[]> => {
      const data = await api.get<{ files: FileItem[] }>(
        `/api/file/${projectName}/files`
      );
      return data.files;
    },

  searchFiles: async (query: string, project = ""): Promise<SearchResult[]> => {
    const params: Record<string, string> = { query };
    if (project) params.project = project;

    const data = await api.get<{ results: SearchResult[] }>("/api/search", {
      params,
    });

    return data.results;
  },

  getFileContent: async (
    project: string,
    filePath: string
  ): Promise<FileContent> => {
    const data = await api.get<{ file: FileContent }>("/api/file/content", {
      params: { project, filePath },
    });
    return data.file;
  },

  keepFileContentChange: async (payload: {
    path: string;
    content: string;
  }): Promise<boolean> => {
    const data = await api.post<any>("/api/file/keep-change", payload, {
      timeout: 120000,
    });
    return data.file;
  },
};
