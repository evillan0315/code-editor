// src/components/editor/EditorFileView.tsx
import { useState, useCallback } from "react";
import { useStore } from "@nanostores/react";
import { Icon } from "@iconify/react";
// FIX: Import confirm, prompt, alert directly from the Nanostore file
// Corrected import path for modal Nanostore
import {
  activeFileEntry,
  editorFilesMap,
  editorActiveFilePath,
} from "@/stores/editorContent";
import { useEditorExplorerActions } from "@/hooks/useEditorExplorerActions";
// REMOVED: No longer need to import useModal
// import { useModal } from "@/hooks/useModal"; // Removed this line
import { useEditorTabs } from "@/hooks/useEditorTabs";

import { Button } from "@/components/ui/Button";

import { EditorFileTabs } from "@/components/editor/EditorFileTabs";
import { FilePickerBrowser } from "@/components/file-picker/FilePickerBrowser";
import EditorCodeMirror from "@/components/editor/EditorCodeMirror";

import "@/styles/file-manager.css";


export default function EditorFileView(): JSX.Element {
  // REMOVED: No longer need to call useModal hook
  // const { confirm } = useModal(); // Removed this line

  const { handleCodeMirrorChange } = useEditorExplorerActions();

  const {
    activeFilePath,
    openFiles,
    canGoLeft,
    canGoRight,
    isCurrentFileUnsaved,
    handleSetActiveFile,
    handleCloseFile,
    handleCloseAllTabs,
    handleNavigateLeft,
    handleNavigateRight,
    handleSave,
    handleRefresh,
    activeTabRef,
  } = useEditorTabs();

  const $activeFileEntry = useStore(activeFileEntry);
  const $editorFilesMap = useStore(editorFilesMap);
  const $editorActiveFilePath = useStore(editorActiveFilePath);

  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  const handleOpenNewFile = () => setIsFilePickerOpen(true);
  const handleCloseFilePicker = () => setIsFilePickerOpen(false);
  const handleFilePickerSelect = (path: string) => {
    handleSetActiveFile(path);
    setIsFilePickerOpen(false);
  };

  const memoizedOnContentChange = useCallback(
    (newContent: string) => {
      const currentPath = activeFilePath;
      if (currentPath) {
        handleCodeMirrorChange(currentPath, newContent);
      }
    },

    [activeFilePath, handleCodeMirrorChange],
  );

  return (
    <>
      <div className="main-content flex flex-col flex-grow min-w-0 h-full text-sm">
        <div className="browser-header h-12 text-gray-500 border-b flex items-center px-1 shadow-md justify-between flex-shrink-0">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              onClick={handleCloseAllTabs}
              disabled={openFiles.length === 0}
              title="Close All Tabs"
            >
              <Icon
                icon="mdi:close-box-multiple-outline"
                width="2em"
                height="2em"
              />
            </Button>

            <Button
              variant="secondary"
              onClick={handleNavigateLeft}
              disabled={!canGoLeft}
              title="Previous tab"
            >
              <Icon icon="mdi:chevron-left" width="2em" height="2em" />
            </Button>
          </div>
          <EditorFileTabs
            openFiles={openFiles}
            activeFilePath={activeFilePath}
            handleSetActiveFile={handleSetActiveFile}
            handleCloseFile={handleCloseFile}
            activeTabRef={activeTabRef}
            className="bg-secondary"
          />
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              onClick={handleNavigateRight}
              disabled={!canGoRight}
              title="Next tab"
            >
              <Icon icon="mdi:chevron-right" width="2em" height="2em" />
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenNewFile}
              title="Open File"
            >
              <Icon icon="mdi:plus-box-outline" width="2em" height="2em" />
            </Button>
          </div>
        </div>

        <div className="h-full overflow-auto flex-grow">
          <EditorCodeMirror
            activeFilePath={$editorActiveFilePath}
            value={$activeFileEntry?.content || ""}
            language={$activeFileEntry?.lang || "plaintext"}
            onContentChange={memoizedOnContentChange}
            readOnly={false}
          />
        </div>
      </div>

      <FilePickerBrowser
        isOpen={isFilePickerOpen}
        onClose={handleCloseFilePicker}
        onFileSelect={handleFilePickerSelect}
      />
    </>
  );
}
