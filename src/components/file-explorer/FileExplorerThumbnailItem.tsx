import React, { useCallback } from 'react';
import type { FileItem } from '@/types/file-system';
import { FileIcon } from '@/components/FileIcon';

interface FileExplorerThumbnailItemProps {
  node: FileItem;
  isActive: boolean;
  onClick: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
}

const FileExplorerThumbnailItem: React.FC<FileExplorerThumbnailItemProps> = ({
  node,
  isActive,
  onClick,
  onContextMenu,
}) => {
  const isFolder = node.type === 'folder';

  const handleClick = useCallback(() => {
    onClick(node.path);
  }, [onClick, node.path]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      onContextMenu(event, node);
    },
    [onContextMenu, node],
  );

  return (
    <div
      className={`file-explorer-thumbnail-item flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-colors duration-100 ease-in-out
        ${isActive ? 'bg-sky-700 text-white' : 'hover:bg-neutral-500/10'}
        ${isFolder ? 'font-semibold' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={node.path}
    >
      <FileIcon
        filename={node.name}
        isDirectory={isFolder}
        isOpen={node.isOpen}
        language={node.lang}
        className="w-12 h-12 mb-1"
      />
      <span className="text-xs text-center truncate w-full px-1">
        {node.name}
      </span>
    </div>
  );
};

export default FileExplorerThumbnailItem;
