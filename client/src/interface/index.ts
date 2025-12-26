import type { ProjectStats } from "../types";

export interface CurrentModel {
  provider: string;
  model: string;
}


export interface UseStatsReturn {
  stats: ProjectStats;
  calculateStats: () => void;
}