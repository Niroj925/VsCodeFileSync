import { useState, useCallback } from 'react';
import { formatFileSize } from '../utils/formatters';
import type { Project, ProjectStats } from '../types';

interface UseStatsReturn {
  stats: ProjectStats;
  calculateStats: () => void;
}

export const useStats = (projects: Project[]): UseStatsReturn => {
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    totalFiles: 0,
    totalSize: 0,
    formattedSize: '0 Bytes'
  });

  const calculateStats = useCallback(() => {
    const totalProjects = projects.length;
    const totalFiles = projects.reduce((sum, project) => sum + (project.fileCount || 0), 0);
    const totalSize = projects.reduce((sum, project) => sum + (project.size || 0), 0);
    
    setStats({
      totalProjects,
      totalFiles,
      totalSize,
      formattedSize: formatFileSize(totalSize)
    });
  }, [projects]);

  return {
    stats,
    calculateStats
  };
};