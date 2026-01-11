import { useState, useCallback } from 'react';
import { projectService } from '../services/projectService';
import type { FileItem, Project } from '../types';

interface UseProjectsReturn {
  project: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<Project[]>;
  loadProjectFiles: (projectName: string) => Promise<FileItem[]>;
}

export const useProject = (): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async ()=> {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      const syncedData = await projectService.getSyncedProject();
      setProject(syncedData);
      setProjects(data);
      setError(null);
      return data;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load projects';
      setError(errorMessage);
      console.error('Failed to load projects:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjectFiles = useCallback(
    async (projectName: string): Promise<FileItem[]> => {
      try {
        setLoading(true);
        const files = await projectService.getProjectFiles(projectName);
        setError(null);
        return files;
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to load project files';
        setError(errorMessage);
        console.error('Failed to load project files:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    project,
    projects,
    loading,
    error,
    loadProjects,
    loadProjectFiles,
  };
};
