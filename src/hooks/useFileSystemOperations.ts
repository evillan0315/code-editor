import { useCallback } from 'react';
import { fileService } from '@/services/fileService';
import { useToast } from '@/hooks/useToast';
import { confirm, prompt } from '@/stores/modal';
import {
  editorCurrentDirectory,
  editorFileTreeNodes,
  editorOpenFiles,
  editorFilesMap,
  editorActiveFilePath,
  renamingPath,
  renamingOriginalName,
  type EditorFileEntry,
} from '@/stores/editorContent';
import {
  createNewFileItem,
  getParentPath,
  updateTreeWithNewItem,
  updateTreeWithRemoveItem,
  // removeItemFromTree is not directly needed here anymore for handleRename,
  // as updateTreeWithRemoveItem wraps it. It might be useful elsewhere.
  updatePathsRecursively,
  findFileByPath,
} from '@/utils/fileTree';
import { isLoading, setIsLoading } from '@/stores/ui';
import type {
  FileWriteRequest, // Not used in this snippet
  FileItem, // Not used in this snippet, but FileItem type from file-system is inferred
  FileUploadRequest, // Not used in this snippet
  FileMoveRequest, // Used in handleMove
  FileRenameRequest, // Used in handleRename
  FileCopyRequest, // Used in handleCopy
} from '@/types/file-system';

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
      setIsLoading(true);
      const dir = folderPath || editorCurrentDirectory.get();
      const fileName = await prompt('Enter new file name:');
      if (!fileName) {
        setIsLoading(false);
        return;
      }

      const filePath = `${dir === '/' ? '' : dir}/${fileName}`;
      try {
        await fileService.createFile(filePath, '');
        showToast(`File '${fileName}' created.`, 'success');

        const newFileItem = createNewFileItem(fileName, filePath, 'file');
        const currentNodes = editorFileTreeNodes.get();
        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          dir,
          newFileItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);

        await handleFileSelect(filePath);
      } catch (err) {
        showToast(`Error creating file: ${String(err)}`, 'error');
        await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, handleFileSelect, fetchAndSetFileTree],
  );

  const handleCreateNewFolder = useCallback(
    async (folderPath?: string) => {
      setIsLoading(true);
      const dir = folderPath || editorCurrentDirectory.get();
      const folderName = await prompt('Enter new folder name:');
      if (!folderName) {
        setIsLoading(false);
        return;
      }

      const fullPath = `${dir === '/' ? '' : dir}/${folderName}`;
      try {
        await fileService.createFolder(fullPath);
        showToast(`Folder '${folderName}' created.`, 'success');

        const newFolderItem = createNewFileItem(folderName, fullPath, 'folder');
        const currentNodes = editorFileTreeNodes.get();
        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          dir,
          newFolderItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);
      } catch (err) {
        showToast(`Error creating folder: ${String(err)}`, 'error');
        await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, fetchAndSetFileTree],
  );

  const handleRename = useCallback(
    async (data: FileRenameRequest) => {
      // data: { oldPath: string; newPath: string }
      setIsLoading(true);
      const { oldPath, newPath } = data; // Destructure oldPath and newPath from the data object
      const oldName = oldPath.split('/').pop()!;
      const newName = newPath.split('/').pop()!; // New name is the last segment of the new full path

      if (!newName || newName === oldName) {
        renamingPath.set(null);
        renamingOriginalName.set(null);
        setIsLoading(false);
        return;
      }

      try {
        const currentNodes = editorFileTreeNodes.get();

        // Step 1: Find the item's original state from the current tree.
        // We need this 'removedItem' to reconstruct it with its new path.
        const removedItem = findFileByPath(oldPath, currentNodes);

        if (!removedItem) {
          showToast(
            `Error: Original item not found in tree for rename. Falling back to refresh.`,
            'error',
          );
          await fetchAndSetFileTree(); // If UI is inconsistent, refresh.
          return;
        }

        // --- Call the service BEFORE updating the UI (optimistic update strategy) ---
        await fileService.rename(data); // Pass the FileRenameRequest object directly
        showToast(`Renamed to '${newName}'.`, 'success');

        // --- LOCAL UI UPDATES ---
        // Step 2: Get the tree *without* the old item using `updateTreeWithRemoveItem`
        const nodesAfterRemoval = updateTreeWithRemoveItem(
          currentNodes,
          oldPath,
        );

        // Step 3: Update paths of the original item recursively to its new path
        const updatedRemovedItem = updatePathsRecursively(
          removedItem,
          oldPath,
          newPath,
        );

        // Step 4: Insert the item with its updated path back into the tree
        const finalUpdatedNodes = updateTreeWithNewItem(
          nodesAfterRemoval, // The tree state after the old item was removed
          getParentPath(newPath), // The parent directory of the item's new location
          updatedRemovedItem, // The item with its new path and name
          editorCurrentDirectory.get(), // The root path of the explorer for context
        );
        editorFileTreeNodes.set(finalUpdatedNodes);

        // --- Update other editor-related stores for consistency ---

        // Update open files: if any open file was the oldPath or a child of it, update its path
        const updateOpenFiles = (files: string[]) =>
          files.map((p) => {
            if (p === oldPath) return newPath;
            if (p.startsWith(oldPath + '/')) return p.replace(oldPath, newPath);
            return p;
          });
        editorOpenFiles.set(updateOpenFiles(editorOpenFiles.get()));

        // Update editor files map: change keys from old paths to new paths
        const updateEditorMap = (map: Record<string, EditorFileEntry>) => {
          const newMap: Record<string, EditorFileEntry> = {};
          for (const [key, value] of Object.entries(map)) {
            if (key === oldPath) newMap[newPath] = value;
            else if (key.startsWith(oldPath + '/')) {
              newMap[key.replace(oldPath, newPath)] = value;
            } else {
              newMap[key] = value;
            }
          }
          return newMap;
        };
        editorFilesMap.set(updateEditorMap(editorFilesMap.get()));

        // Update active file path: if the active file was the oldPath or a child, update it
        const currentActivePath = editorActiveFilePath.get();
        if (currentActivePath === oldPath) {
          editorActiveFilePath.set(newPath);
        } else if (currentActivePath.startsWith(oldPath + '/')) {
          editorActiveFilePath.set(currentActivePath.replace(oldPath, newPath));
        }
      } catch (err) {
        showToast(`Error renaming: ${String(err)}`, 'error');
        await fetchAndSetFileTree(); // Fallback to full refresh on API error
      } finally {
        setIsLoading(false);
        // Always reset renaming state regardless of success or failure
        renamingPath.set(null);
        renamingOriginalName.set(null);
      }
    },
    [showToast, fetchAndSetFileTree], // Dependencies updated to only what's used
  );

  const handleDelete = useCallback(
    async (path: string) => {
      setIsLoading(true);
      const name = path.split('/').pop()!;
      const confirmed = await confirm(`Delete '${name}'?`);
      if (!confirmed) {
        setIsLoading(false);
        return;
      }

      try {
        await fileService.delete(path);
        showToast(`'${name}' deleted.`, 'success');

        // --- LOCAL UI UPDATES ---
        const currentNodes = editorFileTreeNodes.get();
        const nodesAfterDeletion = updateTreeWithRemoveItem(currentNodes, path);
        editorFileTreeNodes.set(nodesAfterDeletion); // Update the file tree immediately

        // Also update other editor state for consistency
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
          editorActiveFilePath.set('');
        }
        // --- END LOCAL UI UPDATES ---
      } catch (err) {
        showToast(`Error deleting: ${String(err)}`, 'error');
        await fetchAndSetFileTree(); // FALLBACK: Fetch entire tree on error
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, fetchAndSetFileTree],
  );

  const handleCopyPath = useCallback(
    async (path: string) => {
      try {
        await navigator.clipboard.writeText(path);
        showToast('Path copied to clipboard.', 'success');
      } catch (err) {
        showToast(`Copy failed: ${String(err)}`, 'error');
      }
    },
    [showToast],
  );

  const handleCopy = useCallback(
    async (sourcePath: string) => {
      setIsLoading(true);
      const sourceName = sourcePath.split('/').pop()!;
      const parentOfSource = getParentPath(sourcePath);

      // Determine a sensible default for the destination prompt
      const defaultDestinationName = `copy_of_${sourceName}`;
      const defaultDestinationPath = `${parentOfSource === '/' ? '' : parentOfSource}/${defaultDestinationName}`;

      const destinationPathInput = await prompt(
        `Copy '${sourceName}' to (enter full new path for the copy, e.g., /new/folder/${defaultDestinationName}):`,
        defaultDestinationPath,
      );

      if (!destinationPathInput) {
        // User cancelled the prompt
        setIsLoading(false);
        return;
      }

      const destinationPath = destinationPathInput;

      // Basic validation for invalid copies
      if (destinationPath === sourcePath) {
        showToast(
          'Invalid destination: Cannot copy an item to its current location.',
          'error',
        );
        setIsLoading(false);
        return;
      }
      // If copying a folder into itself (e.g., /my_folder copied to /my_folder/copy_of_my_folder)
      if (sourcePath.endsWith('/') && destinationPath.startsWith(sourcePath)) {
        showToast(
          'Invalid destination: Cannot copy a folder into itself.',
          'error',
        );
        setIsLoading(false);
        return;
      } else if (
        !sourcePath.endsWith('/') &&
        destinationPath.startsWith(sourcePath + '/')
      ) {
        showToast(
          'Invalid destination: Cannot copy a file/folder into itself.',
          'error',
        );
        setIsLoading(false);
        return;
      }

      // Construct the complete FileCopyRequest object
      const copyRequest: FileCopyRequest = { sourcePath, destinationPath };
      const copiedItemName = destinationPath.split('/').pop()!; // The name of the newly copied item

      showToast(
        `'${sourceName}' started copying to '${copiedItemName}'.`,
        'info',
      );

      try {
        const currentNodes = editorFileTreeNodes.get();

        // Step 1: Find the item's original state from the current tree.
        // We need this 'removedItem' to reconstruct it with its new path.
        const sourceItem = findFileByPath(sourcePath, currentNodes);
        console.log(sourceItem, 'sourceItem');
        if (!sourceItem) {
          showToast(
            `Error: Source item not found in tree for copy. Falling back to refresh.`,
            'error',
          );
          await fetchAndSetFileTree(); // If UI is inconsistent, refresh.
          return;
        }

        await fileService.copy(copyRequest); // Pass the fully constructed copyRequest
        showToast(`'${sourceName}' copied to '${copiedItemName}'.`, 'success');
        const newCopyItem = createNewFileItem(
          copiedItemName,
          destinationPath,
          sourceItem.type,
        );
        // A full refresh is generally safe and simple for copy operations,
        // as the structure can change significantly with new items.

        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          getParentPath(destinationPath),
          newCopyItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);
        //await fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error copying '${sourceName}': ${String(err)}`, 'error'); // Corrected error message
        await fetchAndSetFileTree(); // Fallback to full refresh on error
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, fetchAndSetFileTree],
  );

  const handleMove = useCallback(
    async (sourcePath: string) => {
      // Accepts just the sourcePath (fromPath)
      setIsLoading(true);
      const fromName = sourcePath.split('/').pop()!;
      const parentPath = getParentPath(sourcePath);
      // Determine a sensible default for the prompt: the current parent directory
      const defaultDestination = parentPath === '/' ? '/' : `${parentPath}/`;

      const destinationPath = await prompt(
        `Move '${fromName}' to (enter new full path for the item, e.g., /new/folder/${fromName} or /new/folder/ if moving a folder):`,
        sourcePath,
      );

      if (!destinationPath) {
        // User cancelled the prompt
        setIsLoading(false);
        return;
      }

      // Basic validation for invalid moves
      if (
        destinationPath === sourcePath ||
        destinationPath.startsWith(sourcePath + '/')
      ) {
        showToast(
          'Invalid destination path: Cannot move an item to its current location or into itself.',
          'error',
        );
        setIsLoading(false);
        return;
      }

      // Construct the complete FileMoveRequest object
      const moveRequest: FileMoveRequest = { sourcePath, destinationPath };
      const toName = destinationPath.split('/').pop()!; // Get the last segment of the destination path for the toast

      try {
        const currentNodes = editorFileTreeNodes.get();

        // Step 1: Find the item's original state from the current tree.
        // We need this 'removedItem' to reconstruct it with its new path.
        const removedItem = findFileByPath(sourcePath, currentNodes);
        if (!removedItem) {
          showToast(
            `Error: Original item not found in tree for rename. Falling back to refresh.`,
            'error',
          );
          await fetchAndSetFileTree(); // If UI is inconsistent, refresh.
          return;
        }
        await fileService.move(moveRequest); // Pass the fully constructed moveRequest
        showToast(`'${fromName}' moved to '${toName}'.`, 'success');
        // For move, a full refresh is often simpler than complex local tree manipulation,
        // especially if item types (file/folder) or deeply nested changes are involved.
        // --- LOCAL UI UPDATES ---
        // Step 2: Get the tree *without* the old item using `updateTreeWithRemoveItem`
        const nodesAfterRemoval = updateTreeWithRemoveItem(
          currentNodes,
          sourcePath,
        );

        // Step 3: Update paths of the original item recursively to its new path
        const updatedRemovedItem = updatePathsRecursively(
          removedItem,
          sourcePath,
          destinationPath,
        );

        // Step 4: Insert the item with its updated path back into the tree
        const finalUpdatedNodes = updateTreeWithNewItem(
          nodesAfterRemoval, // The tree state after the old item was removed
          getParentPath(destinationPath), // The parent directory of the item's new location
          updatedRemovedItem, // The item with its new path and name
          editorCurrentDirectory.get(), // The root path of the explorer for context
        );
        editorFileTreeNodes.set(finalUpdatedNodes);
        //await fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error moving '${fromName}': ${String(err)}`, 'error');
        await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, fetchAndSetFileTree],
  );

  return {
    handleCreateNewFile,
    handleCreateNewFolder,
    handleRename,
    handleDelete,
    handleCopyPath,
    handleCopy,
    handleMove,
  };
}
