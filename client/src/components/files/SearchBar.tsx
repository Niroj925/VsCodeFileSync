import React from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { useProjectContext } from '../../contexts/ProjectContext';
import { QUICK_FILTERS } from '../../utils/constants';

const SearchBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedProject,
    setSelectedProject,
    projects,
    loading,
    handleSearch
  } = useProjectContext();

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files, code, or content..."
                className="input-field pl-12 pr-4 py-3 text-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field py-3 pr-10 appearance-none"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.name} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary px-6 py-3 flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter.query}
            onClick={() => setSearchQuery(filter.query)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;