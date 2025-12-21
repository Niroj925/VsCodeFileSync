import React from "react";
import SidebarFileTree from "../projects/SidebarFileTree";
import SidebarSearch from "../files/SideBarSearch";
import SidebarSearchResults from "../files/SideBarSearchResult";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 h-full border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
      <SidebarSearch />

      <SidebarSearchResults />
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarFileTree />
      </div>
    </aside>
  );
};

export default Sidebar;
