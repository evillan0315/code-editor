import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Icon } from '@iconify/react';
import {
  activeFileEntry,
  editorFilesMap,
  editorActiveFilePath,
  getFileContent,
  editorCurrentDirectory,
} from '@/stores/editorContent';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { useEditorTabs } from '@/hooks/useEditorTabs';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EditorFileTabs } from '@/components/editor/EditorFileTabs';
import { FilePickerBrowser } from '@/components/file-picker/FilePickerBrowser';
import EditorCodeMirror from '@/components/editor/EditorCodeMirror';
import MediaPreviewer from '@/components/MediaPreviewer';

import { getFileExtension, getFileName } from '@/utils/pathUtils';
import { isValidHttpUrl } from '@/utils/urlUtils';

import '@/styles/file-manager.css';

export default function EditorPageView(): JSX.Element {
  const { handleCodeMirrorChange, handleCreateNewFile, handleRename } = useEditorExplorerActions();

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
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);

  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // New state for preview modal

  const handleOpenFilePicker = () => setIsFilePickerOpen(true);
  const handleCloseFilePicker = () => setIsFilePickerOpen(false);
  const handleFilePickerSelect = (path: string) => {
    handleSetActiveFile(path);
    setIsFilePickerOpen(false);
  };

  const handleCreateNewFileAction = useCallback(async () => {
    // handleCreateNewFile from useEditorExplorerActions will prompt for name and use editorCurrentDirectory
    await handleCreateNewFile($editorCurrentDirectory);
  }, [handleCreateNewFile, $editorCurrentDirectory]);

  const handleOpenPreview = () => setIsPreviewModalOpen(true);
  const handleClosePreview = () => setIsPreviewModalOpen(false);

  const memoizedOnContentChange = useCallback(
    (newContent: string) => {
      const currentPath = activeFilePath;
      if (currentPath) {
        handleCodeMirrorChange(currentPath, newContent);
      }
    },
    [activeFilePath, handleCodeMirrorChange],
  );

  const currentFileContent = getFileContent(activeFilePath || '') || '';
  const currentFileExtension = getFileExtension(activeFilePath || '')?.toLowerCase();

  const isPreviewSupported =
    activeFilePath &&
    (['md', 'markdown'].includes(currentFileExtension || '') || // Markdown
      ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(currentFileExtension || '') || // Images
      ['mp4', 'webm', 'ogg', 'mov'].includes(currentFileExtension || '') || // Videos
      ['mp3', 'wav', 'ogg'].includes(currentFileExtension || '') || // Audios
      ['html', 'htm'].includes(currentFileExtension || '') || // HTML
      isValidHttpUrl(currentFileContent.trim())); // Content is a URL

  return (
    <>
      
      <div className="main-content flex flex-col flex-grow min-w-0 h-full text-sm">
        <div className="browser-header h-12 text-gray-500 border-b flex items-center px-1 shadow-xs justify-between flex-shrink-0">
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              onClick={handleCloseAllTabs}
              disabled={openFiles.length === 0}
              title="Close All Tabs"
            >
              <Icon icon="mdi:close-box-multiple-outline" width="2em" height="2em" />
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
            onRenameSubmit={handleRename} // Pass handleRename to EditorFileTabs
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
            <Button variant="secondary" onClick={handleOpenFilePicker} title="Open File">
              <Icon icon="mdi:folder-open-outline" width="2em" height="2em" />
            </Button>
            <Button variant="secondary" onClick={handleCreateNewFileAction} title="Create New File">
              <Icon icon="mdi:plus-box-outline" width="2em" height="2em" />
            </Button>
            {isPreviewSupported && (
              <Button variant="secondary" onClick={handleOpenPreview} title="Preview File">
                <Icon icon="mdi:eye-outline" width="2em" height="2em" />
              </Button>
            )}
          </div>
        </div>

        <div className="h-full overflow-auto flex-grow">
          <EditorCodeMirror
            activeFilePath={$editorActiveFilePath}
            value={getFileContent($editorActiveFilePath) || ''}
            language={$activeFileEntry?.lang || 'plaintext'}
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
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={handleClosePreview}
        title={`Preview: ${getFileName(activeFilePath || '')}`}
        size="fullscreen"
      >
        {activeFilePath && (
          <MediaPreviewer filePath={activeFilePath} fileContent={currentFileContent} />
        )}
      </Modal>
    </>
  );
}
