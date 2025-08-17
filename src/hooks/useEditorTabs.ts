// src/hooks/useEditorTabs.ts
import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
  editorActiveFilePath,
  editorOpenFiles,
  editorFilesMap,
  activeFileEntry,
  isFileUnsaved,
} from "@/stores/editorContent";
import { useToast } from "@/hooks/useToast";
import { confirm } from "@/stores/modal";
import { fileService } from "@/services/fileService";
// Assuming fileService is globally available or imported in a setup file.
// If not, you'd need to import it here or pass it into the hook.

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
  activeTabRef: React.RefObject<HTMLButtonElement>; // Ref for the active tab button
}

export function useEditorTabs(): UseEditorTabsResult {
  const { showToast } = useToast();
  //const { confirm } = useModal();
  //const { handleFileSelect } = useEditorExplorerActions();

  const $activeFilePath = useStore(editorActiveFilePath);
  const $openFiles = useStore(editorOpenFiles);
  const $filesMap = useStore(editorFilesMap); // Needed for unsaved checks and file map manipulations
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Effect to ensure file content is loaded when the active path changes (e.g., initial load or tab switch)
  // useEffect(() => {
  //  if ($activeFilePath) {
  //    void handleFileSelect($activeFilePath);
  //  }
  //}, [$activeFilePath, handleFileSelect]);

  // Effect to scroll the active tab into the middle of its viewport
  useEffect(() => {
    if (activeTabRef.current) {
      const tabElement = activeTabRef.current;
      // The parent element of the tab buttons is the scrollable container in EditorFileTabs
      const parent = tabElement.parentElement;

      if (parent) {
        const parentWidth = parent.clientWidth;
        const tabOffsetLeft = tabElement.offsetLeft;
        const tabWidth = tabElement.offsetWidth;

        // Calculate the scroll position to center the tab
        // New scrollLeft = tab's left edge + half its width - half parent's width
        const scrollTo = tabOffsetLeft + tabWidth / 2 - parentWidth / 2;

        parent.scrollTo({
          left: scrollTo,
          behavior: "smooth",
        });
      }
    }
  }, [$activeFilePath, $openFiles]); // Re-run when active path changes or open files array changes

  const activeIndex = useMemo(
    () => $openFiles.indexOf($activeFilePath),
    [$openFiles, $activeFilePath],
  );

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex >= 0 && activeIndex < $openFiles.length - 1;

  const isCurrentFileUnsaved = useMemo(
    () => isFileUnsaved($activeFilePath),
    [$activeFilePath, $filesMap], // $filesMap is included for reactivity if isFileUnsaved depends on it
  );

  const handleSetActiveFile = useCallback((path: string) => {
    editorActiveFilePath.set(path);
  }, []);

  const handleCloseFile = useCallback(
    async (path: string) => {
      const entry = $filesMap[path];
      if (entry && entry.unsaved) {
        const confirmed = await confirm(
          `Unsaved changes in "${path.split("/").pop()}". Close anyway?`,
        );
        if (!confirmed) return;
      }

      // Remove from open files
      const newOpenFiles = $openFiles.filter((p) => p !== path);
      editorOpenFiles.set(newOpenFiles);

      // Remove from files map
      const newFilesMap = { ...$filesMap };
      delete newFilesMap[path];
      editorFilesMap.set(newFilesMap);

      // If the closed file was the active one, activate another or clear active path
      if ($activeFilePath === path) {
        if (newOpenFiles.length > 0) {
          const currentIndexInOldOpenFiles = $openFiles.indexOf(path);
          // Try to activate the tab at the same index in the new array,
          // or the previous one if it was the last, or the first one available.
          const nextActivePath =
            newOpenFiles[currentIndexInOldOpenFiles] ||
            newOpenFiles[currentIndexInOldOpenFiles - 1] ||
            newOpenFiles[0];
          editorActiveFilePath.set(nextActivePath || "");
        } else {
          editorActiveFilePath.set("");
        }
      }
      //showToast(`Closed ${path.split("/").pop()}`, "info");
    },
    [$openFiles, $filesMap, $activeFilePath, confirm, showToast],
  );

  const handleCloseAllTabs = useCallback(async () => {
    const unsavedFiles = Object.entries($filesMap).filter(
      ([_, entry]) => entry.unsaved,
    );
    if (unsavedFiles.length > 0) {
      const confirmed = await confirm(
        `Unsaved changes in ${unsavedFiles.length} files. Close all anyway?`,
      );
      if (!confirmed) return;
    }
    editorOpenFiles.set([]);
    editorFilesMap.set({});
    editorActiveFilePath.set("");
    showToast("All tabs closed.", "info");
  }, [$filesMap, confirm, showToast]);

  const handleNavigateLeft = useCallback(() => {
    if (canGoLeft) editorActiveFilePath.set($openFiles[activeIndex - 1]);
  }, [$openFiles, activeIndex, canGoLeft]);

  const handleNavigateRight = useCallback(() => {
    if (canGoRight) editorActiveFilePath.set($openFiles[activeIndex + 1]);
  }, [$openFiles, activeIndex, canGoRight]);

  const handleSave = useCallback(async () => {
    const path = editorActiveFilePath.get();
    const entry = activeFileEntry.get(); // getActiveFileEntry reads from editorFilesMap.get()
    if (!path || !entry) return showToast("No file selected to save.", "info");
    if (!entry.unsaved) return showToast("No changes to save.", "info");

    try {
      const result = await fileService.write(path, entry?.content);
      editorFilesMap.set({
        ...editorFilesMap.get(),
        [path]: { ...entry, originalContent: entry.content, unsaved: false },
      });
      showToast(result.message, "success");
    } catch (err) {
      showToast(`Failed to save file: ${String(err)}`, "error");
    }
  }, [showToast]);

  const handleRefresh = useCallback(() => {
    const path = editorActiveFilePath.get();
    if (path) {
      // Simulate a change to trigger `useEffect` above and re-fetch content
      editorActiveFilePath.set("");
      setTimeout(() => {
        editorActiveFilePath.set(path);
        showToast("File content refreshed.", "info");
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
    activeTabRef,
  };
}
