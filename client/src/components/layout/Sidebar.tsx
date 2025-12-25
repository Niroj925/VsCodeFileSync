import React from "react";
import SidebarFileTree from "../projects/SidebarFileTree";
import SidebarSearch from "../files/SideBarSearch";
import SidebarSearchResults from "../files/SideBarSearchResult";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-72 h-full min-h-[calc(100vh-80px)] border-r border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 flex flex-col rounded-lg">
      <SidebarSearch />

      <SidebarSearchResults />
      <div className="px-3 py-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Explorer
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <SidebarFileTree />
      </div>
    </aside>
  );
};

export default Sidebar;
