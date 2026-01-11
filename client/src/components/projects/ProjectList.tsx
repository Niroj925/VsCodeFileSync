import React from 'react';
import { Folder, Code, ChevronRight, Clock} from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { formatDate } from '../../utils/formatters';

const ProjectList: React.FC = () => {
  const {
    projects,
    selectedProject,
    handleProjectSelect,
  } = useProjectContext();

  console.log('selected project:',selectedProject)

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Folder className="h-5 w-5 mr-2 text-primary-500" />
          Projects
        </h2>
        <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {projects.length}
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {projects.map((project) => (
          <div
            key={project.name}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
              selectedProject === project.name
                ? 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800'
                : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleProjectSelect(project.name)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  selectedProject === project.name
                    ? 'bg-primary-100 dark:bg-primary-900'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <Code className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.fileCount} files
                  </p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                selectedProject === project.name ? 'rotate-90' : ''
              }`} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(project.lastSynced)}
              </span>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default ProjectList;