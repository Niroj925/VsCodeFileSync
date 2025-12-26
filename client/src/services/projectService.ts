import type { CurrentModel } from '../interface';
import type { FileContent, FileItem, Project, SearchResult } from '../types';
import api from './api';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const data = await api.get<{ projects: Project[] }>('/api/project/all');
    return data.projects;
  },

  getProjectFiles: async (projectName: string): Promise<FileItem[]> => {
    const data = await api.get<{ files: FileItem[] }>(
      `/api/project/${projectName}/files`
    );
    return data.files;
  },

  searchFiles: async (
    query: string,
    project = ''
  ): Promise<SearchResult[]> => {
    const params: Record<string, string> = { query };
    if (project) params.project = project;

    const data = await api.get<{ results: SearchResult[] }>(
      '/api/search',
      { params }
    );

    return data.results;
  },

  getFileContent: async (
    project: string,
    filePath: string
  ): Promise<FileContent> => {
    const data = await api.get<{ file: FileContent }>(
      '/api/file/content',
      { params: { project, filePath } }
    );
    return data.file;
  },

  syncProject: async (projectName: string): Promise<void> => {
    await api.post<void>('/api/project/sync', { projectName });
  },

  getCurrentModel: async (): Promise<CurrentModel | null> => {
    const data = await api.get<{ model: CurrentModel | null }>(
      '/api/project/get-model'
    );
    return data.model ?? null;
  },

  saveModel: async (
    provider: string,
    model: string
  ): Promise<CurrentModel> => {
    const data = await api.post<{ model: CurrentModel }>(
      '/api/project/save-model',
      { provider, model }
    );

    return data.model ?? { provider, model };
  },

    saveApiKey: async (
    provider: string,
    apiKey: string
  ): Promise<void> => {
    await api.post<void>('/api/project/save-key', {
      provider,
      apiKey,
    });
  },
};
