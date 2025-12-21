import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
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
  const { expandedFolders, toggleFolder, handleFileSelect, selectedFile } =
    useProjectContext();

  const key = `${node.project}/${node.path}`;
  const isOpen = expandedFolders.has(key);

  if (node.type === "folder") {
    return (
      <div>
        <div
          onClick={() => toggleFolder(key)}
          style={{ paddingLeft: level * 12 }}
          className="flex items-center gap-1 py-1 cursor-pointer rounded
                     hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
        >
          {isOpen ? (
            <ChevronDown size={14} className="text-gray-500 dark:text-gray-300" />
          ) : (
            <ChevronRight size={14} className="text-gray-500 dark:text-gray-300" />
          )}
          <Folder size={14} className="text-yellow-500" />
          <span className="truncate text-gray-700 dark:text-gray-300">{node.name}</span>
        </div>

        {isOpen &&
          node.children &&
          sortChildren(node.children).map((child: any) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
      </div>
    );
  }

  const isActive =
    selectedFile?.filePath === node.path &&
    selectedFile?.project === node.project;

  return (
    <div
      onClick={() => handleFileSelect(node.project, node.path)}
      style={{ paddingLeft: level * 12 + 16 }}
      className={`flex items-center gap-2 py-1 text-sm cursor-pointer rounded
        ${
          isActive
            ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
    >
      <FileText size={14} className="text-blue-500" />
      <span className="truncate">{node.name}</span>
    </div>
  );
};

const SidebarFileTree: React.FC = () => {
  const { selectedProject, fileTree } = useProjectContext();

  if (!selectedProject) return null;

  const root = fileTree[selectedProject];
  if (!root || !root.children) return null;

  return (
    <div
      className="text-sm flex flex-col"
      style={{
        height: `calc(100vh - 140px)`, 
        overflowY: 'auto',
      }}
    >
      {sortChildren(root.children).map((node: any) => (
        <TreeNode key={node.path} node={node} level={0} />
      ))}
    </div>
  );
};

export default SidebarFileTree;
