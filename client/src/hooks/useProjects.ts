import { useState, useCallback } from 'react';
import { projectService } from '../services/projectService';
import type { FileItem, Project } from '../types';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<Project[]>;
  loadProjectFiles: (projectName: string) => Promise<FileItem[]>;
}

export const useProjects = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async (): Promise<Project[]> => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setError(null);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load projects';
      setError(errorMessage);
      console.error('Failed to load projects:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjectFiles = useCallback(async (projectName: string): Promise<FileItem[]> => {
    try {
      setLoading(true);
      const files = await projectService.getProjectFiles(projectName);
      return files;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load project files';
      setError(errorMessage);
      console.error('Failed to load project files:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    error,
    loadProjects,
    loadProjectFiles
  };
};