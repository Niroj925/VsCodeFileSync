import React from 'react';
import { Zap } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';

const ProjectStats: React.FC = () => {
  const { stats } = useProjectContext();

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Zap className="h-5 w-5 mr-2 text-yellow-500" />
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.totalProjects}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Projects</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {stats.totalFiles}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Files</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl col-span-2">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {stats.formattedSize}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Total Size</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats;