import React, { useRef } from 'react';
import { useProjectContext } from '../../contexts/ProjectContext';

const FileViewer: React.FC = () => {
  const {
    selectedFile,
  } = useProjectContext();

  const fileContentRef = useRef<HTMLDivElement>(null);


  if (!selectedFile) return null;

  return (
    <div className="space-y-2" ref={fileContentRef}>
      <div className="relative">
     <pre className="code-block mt-0 text-sm leading-relaxed
               max-h-[calc(100vh-115px)] overflow-y-auto overflow-x-auto">
  <code className="font-mono whitespace-pre">
    {selectedFile.content}
  </code>
</pre>

      </div>
    </div>
  );
};

export default FileViewer;