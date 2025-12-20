import type { FileContent, FileItem, Project, SearchResult } from '../types';
import api from './api';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const data = await api.get<{ projects: Project[] }>('/api/projects');
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
      '/api/file',
      { params: { project, filePath } }
    );
    return data.file;
  },

  syncProject: async (projectName: string): Promise<void> => {
    await api.post<void>('/api/project/sync', { projectName });
  },
};
