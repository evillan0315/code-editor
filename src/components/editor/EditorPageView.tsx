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
import { FilePickerBrowser } from '@/components/file-picker/FilePickerBrowser';
import EditorCodeMirror from '@/components/editor/EditorCodeMirror';
import { EditorFileTabs } from '@/components/editor/EditorFileTabs';

import {
  setRightSidebarActiveTab,
  setPreviewContent,
  showRightSidebar,
  PreviewContentType,
} from '@/stores/layout'; // NEW: Import layout store actions

import { getFileExtension, getFileName } from '@/utils/pathUtils';
import { isValidHttpUrl } from '@/utils/urlUtils';

import '@/styles/file-manager.css';

export default function EditorPageView(): JSX.Element {
  const { handleCodeMirrorChange, handleCreateNewFile, handleRename } =
    useEditorExplorerActions();

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
  // const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // Removed: No longer using a modal for preview

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

  const determinePreviewContentType = useCallback(
    (
      fileExtension: string | null | undefined,
      fileContent: string,
    ): PreviewContentType => {
      if (isValidHttpUrl(fileContent.trim())) {
        return 'url';
      }
      if (['md', 'markdown'].includes(fileExtension || '')) {
        return 'markdown';
      }
      if (fileExtension === 'svg') {
        return 'svg';
      }
      if (fileExtension === 'html') {
        return 'html';
      }
      // For other media types (images, audio, video), PreviewPanel currently shows 'Unsupported'
      return null;
    },
    [],
  );
  const currentFileExtension = getFileExtension(
    activeFilePath || '',
  )?.toLowerCase();
  const currentFileContent = getFileContent(activeFilePath || '') || '';
  const handleOpenPreview = useCallback(() => {
    showRightSidebar.set(true); // Ensure right sidebar is visible
    setRightSidebarActiveTab('preview'); // Switch to the preview tab

    const previewType = determinePreviewContentType(
      currentFileExtension,
      currentFileContent,
    );
    setPreviewContent(previewType, currentFileContent); // Set content for the PreviewPanel
  }, [currentFileExtension, currentFileContent, determinePreviewContentType]);

  const memoizedOnContentChange = useCallback(
    (newContent: string) => {
      const currentPath = activeFilePath;
      if (currentPath) {
        handleCodeMirrorChange(currentPath, newContent);
      }
    },
    [activeFilePath, handleCodeMirrorChange],
  );

  const isPreviewSupported =
    activeFilePath &&
    (['md', 'markdown'].includes(currentFileExtension || '') || // Markdown
      ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(
        currentFileExtension || '',
      ) || // Images
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
            <Button
              variant="secondary"
              onClick={handleOpenFilePicker}
              title="Open File"
            >
              <Icon icon="mdi:folder-open-outline" width="2em" height="2em" />
            </Button>
            <Button
              variant="secondary"
              onClick={handleCreateNewFileAction}
              title="Create New File"
            >
              <Icon icon="mdi:plus-box-outline" width="2em" height="2em" />
            </Button>
            {isPreviewSupported && (
              <Button
                variant="secondary"
                onClick={handleOpenPreview}
                title="Preview File"
              >
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
      {/* Removed: Preview Modal and MediaPreviewer as preview now goes to the right sidebar */}
    </>
  );
}
