// src/hooks/useFileSystemOperations.ts
import { useCallback } from "react";
import { fileService } from "@/services/fileService";
import { useToast } from "@/hooks/useToast";
import { confirm, prompt } from "@/stores/modal"; // Assuming these are imported from your modal store
import {
  editorCurrentDirectory,
  editorFileTreeNodes,
  editorOpenFiles,
  editorFilesMap,
  editorActiveFilePath,
  type EditorFileEntry,
} from "@/stores/editorContent";
import {
  createNewFileItem,
  getParentPath,
  updateTreeWithNewItem,
  removeItemFromTree,
  updatePathsRecursively,
} from "@/utils/fileTreeUtils";
// Ensure FileItem is imported

// Dependencies for this hook, which are functions provided by other hooks
interface FileSystemOperationDependencies {
  handleFileSelect: (path: string) => Promise<void>;
  handleSelectedPath: (path: string) => void;
  fetchAndSetFileTree: () => Promise<void>;
}

export function useFileSystemOperations({
  handleFileSelect,
  handleSelectedPath,
  fetchAndSetFileTree,
}: FileSystemOperationDependencies) {
  const { showToast } = useToast();

  const handleCreateNewFile = useCallback(
    async (folderPath?: string) => {
      const dir = folderPath || editorCurrentDirectory.get();
      const fileName = await prompt("Enter new file name:");
      if (!fileName) return;

      const filePath = `${dir === "/" ? "" : dir}/${fileName}`;
      try {
        await fileService.createFile(filePath, "");
        showToast(`File "${fileName}" created.`, "success");

        const newFileItem = createNewFileItem(fileName, filePath, "file");
        const currentNodes = editorFileTreeNodes.get();
        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          dir,
          newFileItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);

        await handleFileSelect(filePath);
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error creating file: ${String(err)}`, "error");
        await fetchAndSetFileTree(); // Fallback refresh on error
      }
    },
    [showToast, handleFileSelect, fetchAndSetFileTree],
  );

  const handleCreateNewFolder = useCallback(
    async (folderPath?: string) => {
      const dir = folderPath || editorCurrentDirectory.get();
      const folderName = await prompt("Enter new folder name:");
      if (!folderName) return;

      const fullPath = `${dir === "/" ? "" : dir}/${folderName}`;
      try {
        await fileService.createFolder(fullPath);
        showToast(`Folder "${folderName}" created.`, "success");

        const newFolderItem = createNewFileItem(folderName, fullPath, "dir");
        const currentNodes = editorFileTreeNodes.get();
        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          dir,
          newFolderItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);

        handleSelectedPath(fullPath);
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error creating folder: ${String(err)}`, "error");
        await fetchAndSetFileTree(); // Fallback refresh on error
      }
    },
    [prompt, showToast, handleSelectedPath, fetchAndSetFileTree],
  );

  const handleRename = useCallback(
    async (oldPath: string) => {
      const parts = oldPath.split("/");
      const oldName = parts.pop()!;
      const parentPath = getParentPath(oldPath);

      const newName = await prompt(`Rename "${oldName}" to:`, oldName);
      if (!newName || newName === oldName) return;

      const newPath = `${parentPath === "/" ? "" : parentPath}/${newName}`;

      try {
        await fileService.rename(oldPath, newPath);
        showToast(`Renamed to "${newName}".`, "success");

        const currentNodes = editorFileTreeNodes.get();
        const { updatedNodes: nodesAfterRemoval, removedItem } =
          removeItemFromTree(currentNodes, oldPath);

        if (!removedItem) {
          showToast(
            `Error: Original item not found in tree for rename. Falling back to refresh.`,
            "error",
          );
          await fetchAndSetFileTree();
          return;
        }

        const updatedRemovedItem = updatePathsRecursively(
          removedItem,
          oldPath,
          newPath,
        );

        const finalUpdatedNodes = updateTreeWithNewItem(
          nodesAfterRemoval,
          getParentPath(newPath),
          updatedRemovedItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(finalUpdatedNodes);

        // Update editor states (open files, active file, file content map)
        const updateOpenFiles = (files: string[]) =>
          files.map((p) => {
            if (p === oldPath) return newPath;
            if (p.startsWith(oldPath + "/")) return p.replace(oldPath, newPath);
            return p;
          });
        editorOpenFiles.set(updateOpenFiles(editorOpenFiles.get()));

        const updateEditorMap = (map: Record<string, EditorFileEntry>) => {
          const newMap: Record<string, EditorFileEntry> = {};
          for (const [key, value] of Object.entries(map)) {
            if (key === oldPath) newMap[newPath] = value;
            else if (key.startsWith(oldPath + "/"))
              newMap[key.replace(oldPath, newPath)] = value;
            else newMap[key] = value;
          }
          return newMap;
        };
        editorFilesMap.set(updateEditorMap(editorFilesMap.get()));

        const currentActivePath = editorActiveFilePath.get();
        if (currentActivePath === oldPath) {
          editorActiveFilePath.set(newPath);
        } else if (currentActivePath.startsWith(oldPath + "/")) {
          editorActiveFilePath.set(currentActivePath.replace(oldPath, newPath));
        }
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error renaming: ${String(err)}`, "error");
        await fetchAndSetFileTree();
      }
    },
    [prompt, showToast, fetchAndSetFileTree], // getParentPath is pure, updatePathsRecursively, removeItemFromTree are pure
  );

  const handleDelete = useCallback(
    async (path: string) => {
      const name = path.split("/").pop()!;
      const confirmed = await confirm(`Delete "${name}"?`);
      if (!confirmed) return;

      try {
        await fileService.delete(path);
        showToast(`"${name}" deleted.`, "success");

        const currentNodes = editorFileTreeNodes.get();
        const { updatedNodes: nodesAfterDeletion } = removeItemFromTree(
          currentNodes,
          path,
        );
        editorFileTreeNodes.set(nodesAfterDeletion);

        // Update editor states (open files, active file, file content map)
        editorOpenFiles.set(
          editorOpenFiles.get().filter((p) => !p.startsWith(path)),
        );

        const editorMap = editorFilesMap.get();
        const newEditorMap: Record<string, EditorFileEntry> = {};
        for (const [key, value] of Object.entries(editorMap)) {
          if (!key.startsWith(path)) {
            newEditorMap[key] = value;
          }
        }
        editorFilesMap.set(newEditorMap);

        const currentActivePath = editorActiveFilePath.get();
        if (currentActivePath.startsWith(path)) {
          editorActiveFilePath.set("");
        }
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error deleting: ${String(err)}`, "error");
        await fetchAndSetFileTree();
      }
    },
    [confirm, showToast, fetchAndSetFileTree],
  );

  const handleCopyPath = useCallback(
    async (path: string) => {
      try {
        await navigator.clipboard.writeText(path);
        showToast("Path copied to clipboard.", "success");
      } catch (err) {
        showToast(`Copy failed: ${String(err)}`, "error");
      }
    },
    [showToast],
  );

  return {
    handleCreateNewFile,
    handleCreateNewFolder,
    handleRename,
    handleDelete,
    handleCopyPath,
  };
}
