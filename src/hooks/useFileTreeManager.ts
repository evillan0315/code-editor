// src/hooks/useFileTreeManager.ts
import { useCallback } from "react";
import {
  editorCurrentDirectory,
  editorFileTreeNodes,
} from "@/stores/editorContent";
import { isLoading, setIsLoading } from "@/stores/ui";
import { toggleFolderState } from "@/utils/fileTree"; // Assuming this is an existing utility
import { fileService } from "@/services/fileService";
import { useToast } from "@/hooks/useToast";
import { useExplorerNavigation } from "./useExplorerNavigation"; // To use handleSelectedPath

const bdir = `${import.meta.env.BASE_DIR}`;

export function useFileTreeManager() {
  const { showToast } = useToast();
  const { handleSelectedPath } = useExplorerNavigation();

  const fetchAndSetFileTree = useCallback(async () => {
    setIsLoading(true);
    try {
      const dir = editorCurrentDirectory.get();

      const res = await fileService.list(dir);
      // Ensure fetched directories have 'children' as an empty array and 'isOpen: false' if not provided by backend,
      // which is crucial for consistent frontend FileItem structure.
      const processedRes = res.map((item) => ({
        ...item,
        ...(item.type === "dir" && {
          children: item.children || [],
          isOpen: item.isOpen || false,
        }),
      }));
      editorFileTreeNodes.set(processedRes);
    } catch (err) {
      editorFileTreeNodes.set([]);
      editorCurrentDirectory.set(bdir); // Fallback to base directory
      handleSelectedPath(bdir); // Also navigate there
      showToast(`Error fetching file tree: ${String(err)}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectedPath, showToast]);

  const handleToggleFolder = useCallback(async (path: string) => {
    const updated = toggleFolderState(path, editorFileTreeNodes.get());
    editorFileTreeNodes.set(updated);
  }, []);

  return {
    fetchAndSetFileTree,
    handleToggleFolder,
    isLoading, // Export isLoading state
  };
}
