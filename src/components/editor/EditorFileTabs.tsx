import React, { useCallback, RefObject } from 'react';
import { useToast } from '@/hooks/useToast';
import { confirm } from '@/stores/modal';
import { isFileUnsaved, getFileLanguage } from '@/stores/editorContent';
import { EditorFileTabItem } from '@/components/editor/EditorFileTabItem';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions'; // Import to get handleRename

export interface EditorFileTabsProps {
  openFiles: string[];
  activeFilePath: string;
  handleSetActiveFile: (path: string) => void;
  handleCloseFile: (path: string) => Promise<void>;
  onRenameSubmit: (oldPath: string, newPath: string) => Promise<void>; // Add onRenameSubmit prop
  activeTabRef?: RefObject<HTMLButtonElement>;
}

export function EditorFileTabs({
  openFiles,
  activeFilePath,
  handleSetActiveFile,
  handleCloseFile,
  onRenameSubmit, // Destructure onRenameSubmit
  activeTabRef,
}: EditorFileTabsProps): JSX.Element {
  const { showToast } = useToast();

  const handleTabClick = useCallback(
    (path: string): void => {
      if (!path) return;
      handleSetActiveFile(path);
    },
    [handleSetActiveFile],
  );

  const handleTabClose = useCallback(
    async (path: string): Promise<void> => {
      const unSaved = isFileUnsaved(path);
      if (unSaved) {
        const confirmClose = await confirm(
          `You have unsaved changes in "${path}". Are you sure you want to close it? Your changes will be lost.`,
        );
        if (!confirmClose) {
          showToast(`Closing of "${path}" was cancelled.`, 'info');
          return;
        }
      }
      await handleCloseFile(path);
      showToast(`"${path}" has been closed.`, 'info');
    },
    [confirm, handleCloseFile, showToast],
  );

  return (
    <div className="flex flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide h-full">
      {openFiles.length === 0 ? (
        <div className="flex items-center px-0 flex-shrink-0 pl-4">No tabs open.</div>
      ) : (
        openFiles.map((path) => (
          <EditorFileTabItem
            key={path}
            file={path}
            unSaved={isFileUnsaved(path)}
            language={getFileLanguage(path)}
            isActive={path === activeFilePath}
            onClick={handleTabClick}
            onClose={handleTabClose}
            onRenameSubmit={onRenameSubmit} // Pass the rename submit handler
            ref={path === activeFilePath ? activeTabRef : undefined}
          />
        ))
      )}
    </div>
  );
}
