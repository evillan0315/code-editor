// src/hooks/useEditorTabs.ts
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  editorActiveFilePath,
  editorOpenFiles,
  editorFilesMap,
  activeFileEntry,
  isFileUnsaved,
} from '@/stores/editorContent';
import { useToast } from '@/hooks/useToast';
import { confirm } from '@/stores/modal';
import { fileService } from '@/services/fileService';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions'; // Import to get handleRename

interface UseEditorTabsResult {
  activeFilePath: string;
  openFiles: string[];
  activeIndex: number;
  canGoLeft: boolean;
  canGoRight: boolean;
  isCurrentFileUnsaved: boolean;
  handleSetActiveFile: (path: string) => void;
  handleCloseFile: (path: string) => Promise<void>;
  handleCloseAllTabs: () => Promise<void>;
  handleNavigateLeft: () => void;
  handleNavigateRight: () => void;
  handleSave: () => Promise<void>;
  handleRefresh: () => void;
  handleRename: (oldPath: string, newPath: string) => Promise<void>; // Expose handleRename
  activeTabRef: React.RefObject<HTMLButtonElement>;
}

export function useEditorTabs(): UseEditorTabsResult {
  const { showToast } = useToast();
  const { handleRename } = useEditorExplorerActions(); // Get handleRename from explorer actions

  const $activeFilePath = useStore(editorActiveFilePath);
  const $openFiles = useStore(editorOpenFiles);
  const $filesMap = useStore(editorFilesMap);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current) {
      const tabElement = activeTabRef.current;

      const parent = tabElement.parentElement;

      if (parent) {
        const parentWidth = parent.clientWidth;
        const tabOffsetLeft = tabElement.offsetLeft;
        const tabWidth = tabElement.offsetWidth;

        const scrollTo = tabOffsetLeft + tabWidth / 2 - parentWidth / 2;

        parent.scrollTo({
          left: scrollTo,
          behavior: 'smooth',
        });
      }
    }
  }, [$activeFilePath, $openFiles]);

  const activeIndex = useMemo(
    () => $openFiles.indexOf($activeFilePath),
    [$openFiles, $activeFilePath],
  );

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex >= 0 && activeIndex < $openFiles.length - 1;

  const isCurrentFileUnsaved = useMemo(
    () => isFileUnsaved($activeFilePath),
    [$activeFilePath, $filesMap],
  );

  const handleSetActiveFile = useCallback((path: string) => {
    editorActiveFilePath.set(path);
  }, []);

  const handleCloseFile = useCallback(
    async (path: string) => {
      const entry = $filesMap[path];
      if (entry && entry.unsaved) {
        const confirmed = await confirm(
          `Unsaved changes in '${path.split('/').pop()}'. Close anyway?`,
        );
        if (!confirmed) return;
      }

      const newOpenFiles = $openFiles.filter((p) => p !== path);
      editorOpenFiles.set(newOpenFiles);

      const newFilesMap = { ...$filesMap };
      delete newFilesMap[path];
      editorFilesMap.set(newFilesMap);

      if ($activeFilePath === path) {
        if (newOpenFiles.length > 0) {
          const currentIndexInOldOpenFiles = $openFiles.indexOf(path);

          const nextActivePath =
            newOpenFiles[currentIndexInOldOpenFiles] ||
            newOpenFiles[currentIndexInOldOpenFiles - 1] ||
            newOpenFiles[0];
          editorActiveFilePath.set(nextActivePath || '');
        } else {
          editorActiveFilePath.set('');
        }
      }
    },
    [$openFiles, $filesMap, $activeFilePath, confirm, showToast],
  );

  const handleCloseAllTabs = useCallback(async () => {
    const unsavedFiles = Object.entries($filesMap).filter(([_, entry]) => entry.unsaved);
    if (unsavedFiles.length > 0) {
      const confirmed = await confirm(
        `Unsaved changes in ${unsavedFiles.length} files. Close all anyway?`,
      );
      if (!confirmed) return;
    }
    editorOpenFiles.set([]);
    editorFilesMap.set({});
    editorActiveFilePath.set('');
    showToast('All tabs closed.', 'info');
  }, [$filesMap, confirm, showToast]);

  const handleNavigateLeft = useCallback(() => {
    if (canGoLeft) editorActiveFilePath.set($openFiles[activeIndex - 1]);
  }, [$openFiles, activeIndex, canGoLeft]);

  const handleNavigateRight = useCallback(() => {
    if (canGoRight) editorActiveFilePath.set($openFiles[activeIndex + 1]);
  }, [$openFiles, activeIndex, canGoRight]);

  const handleSave = useCallback(async () => {
    const path = editorActiveFilePath.get();
    const entry = activeFileEntry.get();
    if (!path || !entry) return showToast('No file selected to save.', 'info');
    if (!entry.unsaved) return showToast('No changes to save.', 'info');

    try {
      const result = await fileService.write(path, entry?.content);
      editorFilesMap.set({
        ...editorFilesMap.get(),
        [path]: { ...entry, originalContent: entry.content, unsaved: false },
      });
      showToast(result.message, 'success');
    } catch (err) {
      showToast(`Failed to save file: ${String(err)}`, 'error');
    }
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    const path = editorActiveFilePath.get();
    if (path) {
      editorActiveFilePath.set('');
      setTimeout(() => {
        editorActiveFilePath.set(path);
        showToast('File content refreshed.', 'info');
      }, 0);
    }
  }, [showToast]);

  return {
    activeFilePath: $activeFilePath,
    openFiles: $openFiles,
    activeIndex,
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
    handleRename, // Expose handleRename
    activeTabRef,
  };
}
