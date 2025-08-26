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
  removeItemFromTree,
  updatePathsRecursively,
} from '@/utils/fileTree';
import { isLoading, setIsLoading } from '@/stores/ui';

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
        //fetchAndSetFileTree();
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

        const newFolderItem = createNewFileItem(folderName, fullPath, 'dir');
        const currentNodes = editorFileTreeNodes.get();
        const updatedNodes = updateTreeWithNewItem(
          currentNodes,
          dir,
          newFolderItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(updatedNodes);

        //handleSelectedPath(fullPath);
        //fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error creating folder: ${String(err)}`, 'error');
        //await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
      }
    },
    [showToast],
  );

  const handleRename = useCallback(
    async (oldPath: string, newPath: string) => {
      setIsLoading(true);
      const oldName = oldPath.split('/').pop()!;
      const newName = newPath.split('/').pop()!;

      if (!newName || newName === oldName) {
        // Exit renaming mode if name is empty or unchanged
        renamingPath.set(null);
        renamingOriginalName.set(null);
        setIsLoading(false);
        return;
      }

      try {
        await fileService.rename(oldPath, newPath);
        showToast(`Renamed to '${newName}'.`, 'success');

        const currentNodes = editorFileTreeNodes.get();
        const { updatedNodes: nodesAfterRemoval, removedItem } = removeItemFromTree(
          currentNodes,
          oldPath,
        );

        if (!removedItem) {
          showToast(
            `Error: Original item not found in tree for rename. Falling back to refresh.`,
            'error',
          );
          await fetchAndSetFileTree();
          return;
        }

        const updatedRemovedItem = updatePathsRecursively(removedItem, oldPath, newPath);

        const finalUpdatedNodes = updateTreeWithNewItem(
          nodesAfterRemoval,
          getParentPath(newPath),
          updatedRemovedItem,
          editorCurrentDirectory.get(),
        );
        editorFileTreeNodes.set(finalUpdatedNodes);

        const updateOpenFiles = (files: string[]) =>
          files.map((p) => {
            if (p === oldPath) return newPath;
            if (p.startsWith(oldPath + '/')) return p.replace(oldPath, newPath);
            return p;
          });
        editorOpenFiles.set(updateOpenFiles(editorOpenFiles.get()));

        const updateEditorMap = (map: Record<string, EditorFileEntry>) => {
          const newMap: Record<string, EditorFileEntry> = {};
          for (const [key, value] of Object.entries(map)) {
            if (key === oldPath) newMap[newPath] = value;
            else if (key.startsWith(oldPath + '/')) newMap[key.replace(oldPath, newPath)] = value;
            else newMap[key] = value;
          }
          return newMap;
        };
        editorFilesMap.set(updateEditorMap(editorFilesMap.get()));

        const currentActivePath = editorActiveFilePath.get();
        if (currentActivePath === oldPath) {
          editorActiveFilePath.set(newPath);
        } else if (currentActivePath.startsWith(oldPath + '/')) {
          editorActiveFilePath.set(currentActivePath.replace(oldPath, newPath));
        }
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error renaming: ${String(err)}`, 'error');
        await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
        // Always reset renaming state regardless of success or failure
        renamingPath.set(null);
        renamingOriginalName.set(null);
      }
    },
    [showToast, fetchAndSetFileTree, handleFileSelect],
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

        const currentNodes = editorFileTreeNodes.get();
        const { updatedNodes: nodesAfterDeletion } = removeItemFromTree(currentNodes, path);
        editorFileTreeNodes.set(nodesAfterDeletion);

        editorOpenFiles.set(editorOpenFiles.get().filter((p) => !p.startsWith(path)));

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
        fetchAndSetFileTree();
      } catch (err) {
        showToast(`Error deleting: ${String(err)}`, 'error');
        await fetchAndSetFileTree();
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
      const parentPath = getParentPath(sourcePath);
      const defaultDestination = `${parentPath === '/' ? '' : parentPath}/copy_of_${sourceName}`;

      const destinationPath = await prompt(`Copy '${sourceName}' to:`, defaultDestination);

      if (!destinationPath || destinationPath === sourcePath) {
        setIsLoading(false);
        return;
      }
      showToast(`'${sourceName}' started copying to '${destinationPath}'.`, 'info');
      try {
        await fileService.copy({ sourcePath, destinationPath });
        showToast(`'${sourceName}' copied to '${destinationPath}'.`, 'success');
        await fetchAndSetFileTree(); // Full refresh for simplicity
      } catch (err) {
        showToast(`Error copying '${sourceName}': ${String(err)}`, 'error');
        await fetchAndSetFileTree();
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, fetchAndSetFileTree],
  );

  const handleMove = useCallback(
    async (fromPath: string) => {
      const fromName = fromPath.split('/').pop()!;
      const parentPath = getParentPath(fromPath);

      const toPath = await prompt(`Move '${fromName}' to:`, parentPath);

      if (!toPath || toPath === fromPath) return;

      try {
        await fileService.move({ fromPath, toPath: toPath });
        showToast(`'${fromName}' moved to '${toPath}'.`, 'success');
        await fetchAndSetFileTree(); // Full refresh for simplicity
      } catch (err) {
        showToast(`Error moving '${fromName}': ${String(err)}`, 'error');
        await fetchAndSetFileTree();
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
