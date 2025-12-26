import React, { useRef } from "react";
import { useProjectContext } from "../../contexts/ProjectContext";

const FileViewer: React.FC = () => {
  const { selectedFile } = useProjectContext();
console.log('Selected File in FileViewer:', selectedFile);
  const fileContentRef = useRef<HTMLDivElement>(null);

  if (!selectedFile) return null;

  return (
    <div className="space-y-2   max-h-[calc(100vh-225px)] overflow-y-auto overflow-x-auto m-2" ref={fileContentRef}>
      <div className="relative">
        <pre
          className="code-block mt-0 text-sm leading-relaxed "
        >
          <code className="font-mono whitespace-pre">
            {selectedFile.content}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default FileViewer;
