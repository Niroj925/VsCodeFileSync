import React from "react";
import { Search, X } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";

const SidebarSearch: React.FC = () => {
  const { searchQuery, setSearchQuery, handleSearch, loading } = useProjectContext();

  return (
    <form onSubmit={handleSearch} className="px-2 mb-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-8 pr-7 py-1.5 text-sm text-gray-200 rounded-md
                     bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     focus:outline-none focus:ring-1 focus:ring-primary-500"
        />

        {searchQuery && !loading && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SidebarSearch;
