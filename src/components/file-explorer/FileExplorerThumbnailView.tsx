import React from 'react';
import { FileItem } from '@/types/file-system';
import FileExplorerThumbnailItem from '@/components/file-explorer/FileExplorerThumbnailItem';

interface FileExplorerThumbnailViewProps {
  nodes: FileItem[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onToggleFolder: (path: string) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
}

const FileExplorerThumbnailView: React.FC<FileExplorerThumbnailViewProps> = ({
  nodes,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
  onContextMenu,
}) => {
  const handleClick = async (path: string, type: 'file' | 'folder') => {
    if (type === 'folder') {
      await onToggleFolder(path);
    } else {
      onFileSelect(path);
    }
  };

  return (
    <div className="file-explorer-thumbnail-view grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 p-2">
      {nodes.length === 0 ? (
        <div className="col-span-full text-muted-foreground text-sm py-4 text-center">
          (empty)
        </div>
      ) : (
        nodes.map((node) => (
          <FileExplorerThumbnailItem
            key={node.path}
            node={node}
            isActive={activeFilePath === node.path}
            onClick={(path) => handleClick(path, node.type)}
            onContextMenu={onContextMenu}
          />
        ))
      )}
    </div>
  );
};

export default FileExplorerThumbnailView;
