import React from "react";
import { ChevronDown, ChevronRight, FileText, Folder, Plus } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";

interface TreeNodeProps {
  node: any;
  level: number;
}

const sortChildren = (children: Record<string, any>) => {
  return Object.values(children).sort((a: any, b: any) => {
    // folders first
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, level }) => {
  const {
    expandedFolders,
    toggleFolder,
    handleFileSelect,
    selectedFile,
    selectedItems,
    addItem,
  } = useProjectContext();

  const key = `${node.project}/${node.path}`;
  const isOpen = expandedFolders.has(key);
  const isAdded = selectedItems.some(
    (f) => f.project === node.project && f.path === node.path
  );

  if (node.type === "folder") {
    return (
      <div>
        <div
          style={{ paddingLeft: level * 12 }}
          className="group flex items-center gap-1 py-1 cursor-pointer rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
        >
          <div
            className="flex items-center gap-1 flex-1"
            onClick={() => toggleFolder(key)}
          >
            {isOpen ? (
              <ChevronDown size={14} className="text-gray-500 dark:text-gray-300" />
            ) : (
              <ChevronRight size={14} className="text-gray-500 dark:text-gray-300" />
            )}
            <Folder size={14} className="text-yellow-500" />
            <span className="truncate text-gray-700 dark:text-gray-300">{node.name}</span>
          </div>

          {/* Add icon for folder */}
          {!isAdded && (
            <Plus
              onClick={(e) => {
                e.stopPropagation();
                addItem({ type: "folder", project: node.project, path: node.path });
              }}
              className="
                h-4 w-4
                text-gray-600 dark:text-gray-400
                opacity-0
                group-hover:opacity-100
                transition
                hover:text-blue-500
                cursor-pointer
              "
            />
          )}
        </div>

        {isOpen &&
          node.children &&
          sortChildren(node.children).map((child: any) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
      </div>
    );
  }

  // File node
  const isActive =
    selectedFile?.filePath === node.path &&
    selectedFile?.project === node.project;

  return (
    <div
      style={{ paddingLeft: level * 12 + 16 }}
      className={`group flex items-center gap-2 py-1 text-sm cursor-pointer rounded
        ${
          isActive
            ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      onClick={() => handleFileSelect(node.project, node.path)}
    >
      <FileText size={14} className="text-blue-500" />
      <span className="truncate flex-1">{node.name}</span>

      {/* Add icon for file */}
      {!isAdded && (
        <Plus
          onClick={(e) => {
            e.stopPropagation();
            addItem({ type: "file", project: node.project, path: node.path });
          }}
          className="
            h-4 w-4
            opacity-0
            group-hover:opacity-100
            transition
            hover:text-blue-500
            cursor-pointer
          "
        />
      )}
    </div>
  );
};

export default TreeNode;
