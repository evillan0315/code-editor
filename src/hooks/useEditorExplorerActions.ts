// src/hooks/useEditorExplorerActions.ts
import { useExplorerNavigation } from '@/hooks/useExplorerNavigation';
import { useFileTreeManager } from '@/hooks/useFileTreeManager';
import { useEditorFileContent } from '@/hooks/useEditorFileContent';
import { useFileSystemOperations } from '@/hooks/useFileSystemOperations';

export function useEditorExplorerActions() {
  const { handleSelectedPath, handleGoUpDirectory } = useExplorerNavigation();

  const { fetchAndSetFileTree, handleToggleFolder, isLoading } = useFileTreeManager();

  const { handleFileSelect, handleCodeMirrorChange } = useEditorFileContent();

  const { handleCreateNewFile, handleCreateNewFolder, handleRename, handleDelete, handleCopyPath } =
    useFileSystemOperations({
      handleFileSelect,
      handleSelectedPath,
      fetchAndSetFileTree,
    });

  const handleOpenFile = handleFileSelect;
  return {
    handleFileSelect,
    handleToggleFolder,
    handleCreateNewFile,
    handleCreateNewFolder,
    handleGoUpDirectory,
    handleSelectedPath,
    handleRename,
    handleDelete,
    handleCopyPath,
    handleOpenFile,
    fetchAndSetFileTree,
    handleCodeMirrorChange,
    isLoading,
  };
}
