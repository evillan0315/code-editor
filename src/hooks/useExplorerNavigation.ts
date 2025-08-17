// src/hooks/useExplorerNavigation.ts
import { useCallback } from "react";
import { editorCurrentDirectory } from "@/stores/editorContent";
import { useToast } from "@/hooks/useToast";
import { getParentPath } from "@/utils/fileTreeUtils";

export function useExplorerNavigation() {
  const { showToast } = useToast();

  const handleSelectedPath = useCallback(
    (path: string) => {
      if (path && path !== editorCurrentDirectory.get()) {
        editorCurrentDirectory.set(path);
        showToast(`Navigated to: ${path}`, "info");
      }
    },
    [showToast],
  );

  const handleGoUpDirectory = useCallback(() => {
    const dir = editorCurrentDirectory.get();
    const parentPath = getParentPath(dir);
    editorCurrentDirectory.set(parentPath);
    showToast(`Navigated to: ${parentPath}`, "info");
  }, [showToast]); // getParentPath is pure, no need to be in deps unless it's a memoized fn

  return {
    handleSelectedPath,
    handleGoUpDirectory,
  };
}
