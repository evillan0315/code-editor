import { useCallback } from 'react';
import { editorCurrentDirectory, editorFileTreeNodes } from '@/stores/editorContent';
import { isLoading, setIsLoading } from '@/stores/ui';
import { updateFolderStateRecursive, findFileByPath, ensureFolderDefaults } from '@/utils/fileTree'; // Updated import
import { fileService } from '@/services/fileService';
import { useToast } from '@/hooks/useToast';
import { useExplorerNavigation } from './useExplorerNavigation'; // To use handleSelectedPath

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
      const processedRes = ensureFolderDefaults(res); // Use the new utility
      editorFileTreeNodes.set(processedRes);
    } catch (err) {
      editorFileTreeNodes.set([]);
      editorCurrentDirectory.set(bdir); // Fallback to base directory
      handleSelectedPath(bdir); // Also navigate there
      showToast(`Error fetching file tree: ${String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectedPath, showToast]);

  const handleToggleFolder = useCallback(
    async (path: string) => {
      const currentTree = editorFileTreeNodes.get();
      const folderNode = findFileByPath(path, currentTree);

      if (!folderNode || folderNode.type !== 'folder') {
        console.warn(`Attempted to toggle non-folder or non-existent path: ${path}`);
        return;
      }

      const newIsOpenState = !folderNode.isOpen;

      if (newIsOpenState) {
        // Folder is opening
        if (!folderNode.children || folderNode.children.length === 0) {
          // Only fetch if children are not already loaded or are empty
          let updatedTree = updateFolderStateRecursive(path, currentTree, {
            isLoadingChildren: true,
          });
          editorFileTreeNodes.set(updatedTree); // Show loading state immediately

          try {
            const children = await fileService.list(path);
            const processedChildren = ensureFolderDefaults(children); // Process new children

            updatedTree = updateFolderStateRecursive(path, editorFileTreeNodes.get(), {
              isOpen: true,
              isLoadingChildren: false,
              children: processedChildren,
            });
            editorFileTreeNodes.set(updatedTree);
          } catch (err) {
            showToast(`Error fetching children for ${folderNode.name}: ${String(err)}`, 'error');
            // Revert to closed state and remove loading state on error
            updatedTree = updateFolderStateRecursive(path, editorFileTreeNodes.get(), {
              isOpen: false,
              isLoadingChildren: false,
            });
            editorFileTreeNodes.set(updatedTree);
          }
        } else {
          // Children already exist, just toggle isOpen state
          const updatedTree = updateFolderStateRecursive(path, currentTree, { isOpen: true });
          editorFileTreeNodes.set(updatedTree);
        }
      } else {
        // Folder is closing, just toggle isOpen state
        const updatedTree = updateFolderStateRecursive(path, currentTree, { isOpen: false });
        editorFileTreeNodes.set(updatedTree);
      }
    },
    [showToast],
  );

  return {
    fetchAndSetFileTree,
    handleToggleFolder,
    isLoading, // Export isLoading state
  };
}
