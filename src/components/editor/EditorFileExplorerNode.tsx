import React, { useCallback } from 'react';
import type { FileItem } from '@/types/file-system';
import { MdChevronRight, MdExpandMore } from 'react-icons/md';
import { Icon } from '@iconify/react';
import { getFileIcon } from '@/utils/fileIcon';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { editorCurrentDirectory } from '@/stores/editorContent';

interface EditorFileExplorerNodeProps {
  node: FileItem;
  level: number;
  activeFilePath: string | null;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
}

const EditorFileExplorerNode: React.FC<EditorFileExplorerNodeProps> = ({
  node,
  level,
  activeFilePath,
  onContextMenu,
}) => {
  const { handleFileSelect, handleToggleFolder, fetchAndSetFileTree } = useEditorExplorerActions();

  const paddingLeft = level * 16 + 8;
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && Array.isArray(node.children) && node.children.length > 0;
  const isActive = activeFilePath === node.path;
  const isLoadingChildren = isFolder && node.isOpen && node.isLoadingChildren;
  const fileIcon = getFileIcon({
    filename: node.name,
    isDirectory: isFolder,
    isOpen: node.isOpen,
    language: node.lang,
  });

  const handleClick = useCallback(async () => {
    // If it's a folder, toggle its expanded state
    if (isFolder) {
      await handleToggleFolder(node.path);
    } else {
      // If it's a file, select it to open in the editor
      await handleFileSelect(node.path);
    }
  }, [isFolder, node.path, handleToggleFolder, handleFileSelect]);

  const handleDoubleClick = useCallback(async () => {
    if (isFolder) {
      // If it's a folder and currently closed, toggle to open it
      if (!node.isOpen) {
        await handleToggleFolder(node.path);
      }
      // Set the current directory to this folder's path and refresh the file tree
      editorCurrentDirectory.set(node.path);
      await fetchAndSetFileTree();
    }
  }, [isFolder, node.isOpen, node.path, handleToggleFolder, fetchAndSetFileTree]);

  const handleContextMenu = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      await onContextMenu?.(event, node);
    },
    [onContextMenu, node],
  );

  return (
    <div className='explorer-node-container'>
      <div
        className={`flex items-center  gap-1 px-2 py-1 hover:bg-neutral-500/10 cursor-pointer select-none ${
          isActive ? 'active' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title={node.path}
      >
        {isFolder ? (
          isLoadingChildren ? (
            <Icon icon='mdi:loading' className='text-muted-foreground animate-spin' />
          ) : node.isOpen ? (
            <MdExpandMore className='text-muted-foreground' />
          ) : (
            <MdChevronRight className='text-muted-foreground' />
          )
        ) : (
          <span className='w-5 inline-block' />
        )}

        <Icon icon={fileIcon} className='text-lg min-w-[20px]' />
        <span className='truncate'>{node.name}</span>
      </div>

      {isFolder && node.isOpen && (
        <div className='folder-children'>
          {isLoadingChildren ? (
            <div
              className='text-muted-foreground text-sm py-1 px-2 animate-pulse'
              style={{ paddingLeft: paddingLeft + 16 }}
            >
              Loading...
            </div>
          ) : hasChildren ? (
            node.children!.map((child) => (
              <EditorFileExplorerNode
                key={child.path}
                node={child}
                level={level + 1}
                activeFilePath={activeFilePath}
                onContextMenu={onContextMenu}
              />
            ))
          ) : (
            <div
              className='text-muted-foreground text-sm py-1 px-2'
              style={{ paddingLeft: paddingLeft + 16 }}
            >
              (empty)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditorFileExplorerNode;
