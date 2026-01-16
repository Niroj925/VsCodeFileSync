import type { CurrentModel } from "../interface";
import type { FileItem, Project } from "../types";
import api from "./api";

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const data = await api.get<{ projects: Project[] }>("/api/project/all");
    return data.projects;
  },

  getProject: async (): Promise<Project> => {
    const data = await api.get<{ project: Project }>("/api/project/unsaved");
    return data.project;
  },

  getSyncedProject: async (): Promise<Project> => {
    const data = await api.get<{ project: Project }>("/api/project");
    return data.project;
  },

  getProjectFiles: async (projectName: string): Promise<FileItem[]> => {
    const data = await api.get<{ files: FileItem[] }>(
      `/api/project/${projectName}/files`
    );
    return data.files;
  },

  syncProject: async (projectName: string): Promise<void> => {
    await api.post<void>("/api/project/sync", { projectName });
  },

  getCurrentModel: async (): Promise<CurrentModel | null> => {
    const data = await api.get<{ model: CurrentModel | null }>(
      "/api/project/get-model"
    );
    return data.model ?? null;
  },

  saveModel: async (provider: string, model: string): Promise<CurrentModel> => {
    const data = await api.post<{ model: CurrentModel }>(
      "/api/project/save-model",
      { provider, model }
    );

    return data.model ?? { provider, model };
  },

  saveApiKey: async (provider: string, apiKey: string): Promise<void> => {
    await api.post<void>("/api/project/save-key", {
      provider,
      apiKey,
    });
  },

  saveProviderModel: async (
    provider: string,
    models: string[]
  ): Promise<void> => {
    await api.post<void>("/api/project/save-provider-models", {
      provider,
      models,
    });
  },

  getProviderModels: async (provider: string): Promise<string[]> => {
    const response = await api.get<{
      success: boolean;
      provider: string;
      models: string[];
    }>(`/api/project/get-provider-models?provider=${provider}`);
    return response.models;
  },
};
