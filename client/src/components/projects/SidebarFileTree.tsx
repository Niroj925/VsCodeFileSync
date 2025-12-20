
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useProjectContext } from "../../contexts/ProjectContext";

const TreeNode = ({ node, level }: any) => {
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
          className="flex items-center gap-1 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {isOpen ? <ChevronDown size={14} className="text-gray-500 dark:text-white" /> : <ChevronRight size={14} className="text-gray-500" />}
          <Folder size={14} className="text-gray-500" />
          <span className="text-gray-400">{node.name}</span>
        </div>

        {isOpen &&
          Object.values(node.children || {}).map((child: any) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))}
      </div>
    );
  }

  const active =
    selectedFile?.filePath === node.path &&
    selectedFile?.project === node.project;

  return (
    <div
      onClick={() => handleFileSelect(node.project, node.path)}
      style={{ paddingLeft: level * 12 + 16 }}
      className={`flex items-center gap-2 py-1 text-gray-400 cursor-pointer ${
        active ? "bg-gray-200 dark:bg-gray-800" : "hover:bg-gray-500"
      }`}
    >
      <FileText className="text-gray-400" size={14} />
      {node.name}
    </div>
  );
};

const SidebarFileTree = () => {
  const { selectedProject, fileTree } = useProjectContext();

  if (!selectedProject) return null;

  const root = fileTree[selectedProject];
  if (!root) return null;

  return (
    <div>
      {Object.values(root.children || {}).map((node: any) => (
        <TreeNode key={node.path} node={node} level={0} />
      ))}
    </div>
  );
};

export default SidebarFileTree;
