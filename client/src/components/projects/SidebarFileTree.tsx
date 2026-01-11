import React from "react";
import { useProjectContext } from "../../contexts/ProjectContext";
import TreeNode from "../files/TreeNode";

const SidebarFileTree: React.FC = () => {
  const { project, fileTree, searchQuery } =
    useProjectContext();
  if (!project?.name) return null;

  const root = fileTree[project?.name];
  if (!root || !root.children) return null;
  let sh =
    searchQuery.length > 0 ? "calc(100vh - 330px)" : "calc(100vh - 140px)";
  return (
    <div
      className="text-sm flex flex-col"
      style={{
        height: sh,
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
