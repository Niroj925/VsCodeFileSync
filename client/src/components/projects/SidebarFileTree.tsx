import React from "react";
import { useProjectContext } from "../../contexts/ProjectContext";
import TreeNode from "../files/TreeNode";

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
        overflowY: "auto",
      }}
    >
      {Object.values(root.children)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map((node) => (
          <TreeNode key={node.path} node={node} level={0} />
        ))}
    </div>
  );
};

export default SidebarFileTree;

