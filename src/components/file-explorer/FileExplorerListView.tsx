import React from 'react';
import { FileItem } from '@/types/file-system';
import EditorFileExplorerNode from '@/components/editor/EditorFileExplorerNode';

interface FileExplorerListViewProps {
  nodes: FileItem[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onToggleFolder: (path: string) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
}

const FileExplorerListView: React.FC<FileExplorerListViewProps> = ({
  nodes,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
  onContextMenu,
}) => {
  return (
    <div className="file-explorer-list-view flex flex-col min-w-full">
      {nodes.length === 0 ? (
        <div className="text-muted-foreground text-sm py-4 px-2 text-center">
          (empty)
        </div>
      ) : (
        nodes.map((node) => (
          <EditorFileExplorerNode
            key={node.path}
            node={node}
            level={0} // Always top-level for the initial render
            activeFilePath={activeFilePath}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
            onContextMenu={onContextMenu}
          />
        ))
      )}
    </div>
  );
};

export default FileExplorerListView;
