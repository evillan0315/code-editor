import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { FileItem } from '@/types/file-system';
import { MdChevronRight, MdExpandMore } from 'react-icons/md';
import { Icon } from '@iconify/react';
import LoadingDots from '@/components/LoadingDots';
import { getFileIcon } from '@/utils/fileIcon';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { editorCurrentDirectory, renamingPath, renamingOriginalName } from '@/stores/editorContent';
import { useStore } from '@nanostores/react';

interface EditorFileExplorerNodeProps {
  node: FileItem;
  level: number;
  activeFilePath: string | null;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
  onRenameSubmit: (oldPath: string, newName: string) => Promise<void>;
}

const EditorExplorerNode: React.FC<EditorFileExplorerNodeProps> = ({
  node,
  level,
  activeFilePath,
  onContextMenu,
  onRenameSubmit,
}) => {
  const { handleFileSelect, handleToggleFolder, fetchAndSetFileTree } = useEditorExplorerActions();

  const $renamingPath = useStore(renamingPath);
  const $renamingOriginalName = useStore(renamingOriginalName);

  const isRenaming = $renamingPath === node.path;
  const [currentName, setCurrentName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    setCurrentName(node.name); // Keep internal state in sync with prop for non-editing mode
  }, [isRenaming, node.name]);

  const handleClick = useCallback(async () => {
    if (isRenaming) return; // Prevent selection when renaming
    // If it's a folder, toggle its expanded state
    if (isFolder) {
      await handleToggleFolder(node.path);
    } else {
      // If it's a file, select it to open in the editor
      await handleFileSelect(node.path);
    }
  }, [isRenaming, isFolder, node.path, handleToggleFolder, handleFileSelect]);

  const handleDoubleClick = useCallback(async () => {
    if (isRenaming) return; // Prevent selection when renaming
    if (isFolder) {
      // If it's a folder and currently closed, toggle to open it
      if (!node.isOpen) {
        await handleToggleFolder(node.path);
      }
      // Set the current directory to this folder's path and refresh the file tree
      editorCurrentDirectory.set(node.path);
      await fetchAndSetFileTree();
    }
  }, [isRenaming, isFolder, node.isOpen, node.path, handleToggleFolder, fetchAndSetFileTree]);

  const handleContextMenu = useCallback(
    async (event: React.MouseEvent) => {
      if (isRenaming) return; // Prevent context menu when renaming
      event.preventDefault();
      await onContextMenu?.(event, node);
    },
    [onContextMenu, node, isRenaming],
  );

  const handleInputBlur = useCallback(async () => {
    if (!isRenaming) return;
    if (currentName.trim() && currentName !== $renamingOriginalName) {
      await onRenameSubmit(node.path, currentName);
    } else {
      // If name is empty or unchanged, just exit renaming mode
      renamingPath.set(null);
      renamingOriginalName.set(null);
    }
  }, [isRenaming, currentName, $renamingOriginalName, node.path, onRenameSubmit]);

  const handleInputKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur(); // Trigger blur to save
      } else if (e.key === 'Escape') {
        setCurrentName($renamingOriginalName || node.name); // Revert to original name
        renamingPath.set(null); // Exit renaming mode
        renamingOriginalName.set(null);
      }
    },
    [$renamingOriginalName, node.name],
  );

  return (
    <div className="explorer-node-container">
      <div
        className={`flex items-center  gap-1 px-2 py-1 hover:bg-neutral-500/10 cursor-pointer select-none ${isActive ? 'active' : ''}
        ${isRenaming ? 'bg-neutral-600/20' : ''}`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title={node.path}
      >
        {isFolder ? (
          isLoadingChildren ? (
            <Icon icon="mdi:loading" className="text-muted-foreground animate-spin" />
          ) : node.isOpen ? (
            <MdExpandMore className="text-muted-foreground" />
          ) : (
            <MdChevronRight className="text-muted-foreground" />
          )
        ) : (
          <span className="w-5 inline-block" />
        )}

        <Icon icon={fileIcon} className="text-lg min-w-[20px]" />
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="flex-grow min-w-0 bg-transparent border border-neutral-500 rounded px-1 py-0.5 text-sm"
            onFocus={(e) => e.target.select()} // Select all text on focus
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </div>

      {isFolder && node.isOpen && (
        <div className="folder-children">
          {isLoadingChildren ? (
            <div
              className="text-muted-foreground text-sm py-1 px-2"
              style={{ paddingLeft: paddingLeft + 16 }}
            >
              <LoadingDots />
            </div>
          ) : hasChildren ? (
            node.children!.map((child) => (
              <EditorExplorerNode
                key={child.path}
                node={child}
                level={level + 1}
                activeFilePath={activeFilePath}
                onContextMenu={onContextMenu}
                onRenameSubmit={onRenameSubmit}
              />
            ))
          ) : (
            <div
              className="text-muted-foreground text-sm py-1 px-2"
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

export default EditorExplorerNode;
