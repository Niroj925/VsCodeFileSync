import React from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';
import ProjectList from '../projects/ProjectList';
import ProjectStats from '../projects/ProjectStats';

const Sidebar: React.FC = () => {
  const { sidebarOpen } = useProjectContext();
  if (!sidebarOpen) return null;

  return (
    <div className="lg:w-80 flex-shrink-0">
      <ProjectList />
      <ProjectStats />
    </div>
  );
};

export default Sidebar;