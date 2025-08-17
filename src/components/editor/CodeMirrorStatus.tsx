// src/components/editor/CodeMirrorStatus.tsx
import React from "react";
import { useStore } from "@nanostores/react"; // Import useStore
import { codeMirrorStatus, isFileUnsaved, editorActiveFilePath, getFileContent } from "@/stores/editorContent"; // Import the new store

// Remove the interface and props destructuring
// interface CodeMirrorStatusProps {
//   language: string;
//   line: number;
//   col: number;
//   isUnsaved: boolean;
// }

export const CodeMirrorStatus: React.FC = () => {
  // Use useStore to get the current status from the nanostore
  const { language, line, col } = useStore(codeMirrorStatus);
  const $editorActiveFilePath = useStore(editorActiveFilePath);
  //const hasContent = getFileContent($editorActiveFilePath);
  return (
  <>
    {getFileContent($editorActiveFilePath) ? (
   
      <div className="flex w-full items-center justify-center gap-4 ">
      <div className="flex items-center gap-4 text-center">
        <span className="uppercase">{language}</span>
        <span>
          Ln {line}, Col {col}
        </span>
      </div>
      {isFileUnsaved($editorActiveFilePath) && <span className="text-yellow-400">Unsaved Changes</span>}
    </div>
  
    ) : ''}
    </>
  );
};
