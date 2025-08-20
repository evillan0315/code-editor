import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  editorActiveFilePath,
  editorFileTreeNodes,
  editorCurrentDirectory,
} from '@/stores/editorContent';
import { isLoading } from '@/stores/ui';
import { FileItem } from '@/types/file-system';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import LoadingDots from '@/components/LoadingDots';
import { FileExplorerContextMenuRenderer } from '@/components/editor/FileExplorerContextMenuRenderer';
import { fileExplorerContextMenu, showFileExplorerContextMenu } from '@/stores/contextMenu';
import { Icon } from '@/components/ui/Icon';
import FileExplorerListView from '@/components/file-explorer/FileExplorerListView';
import FileExplorerThumbnailView from '@/components/file-explorer/FileExplorerThumbnailView';
import FileExplorerHeader from '@/components/file-explorer/FileExplorerHeader';
import { fileExplorerViewMode, toggleFileExplorerViewMode } from '@/stores/layout';

import '@/styles/file-manager.css';

const FileExplorer: React.FC = () => {
  const activeFilePath = useStore(editorActiveFilePath);
  const fileTreeValue = useStore(editorFileTreeNodes);
  const currentDirectory = useStore(editorCurrentDirectory);
  const loading = useStore(isLoading);
  const $fileExplorerViewMode = useStore(fileExplorerViewMode);

  const fileExplorerContextMenuState = useStore(fileExplorerContextMenu);

  const {
    handleFileSelect,
    handleToggleFolder,
    handleCreateNewFile,
    handleCreateNewFolder,
    handleRename,
    handleDelete,
    handleCopyPath,
    handleOpenFile,
    fetchAndSetFileTree,
    handleSelectedPath,
    handleGoUpDirectory
  } = useEditorExplorerActions();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const OpenIcon = useMemo(() => <Icon icon='ion:open-outline' width='1.5em' height='1.5em' />, []);
  const RenameIcon = useMemo(
    () => <Icon icon='mdi:file-edit-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const CopyPathIcon = useMemo(
    () => <Icon icon='mdi:content-copy' width='1.5em' height='1.5em' />,
    [],
  );
  const NewFileIcon = useMemo(
    () => <Icon icon='qlementine-icons:add-file-16' width='1.5em' height='1.5em' />,
    [],
  );
  const NewFolderIcon = useMemo(
    () => <Icon icon='mdi:folder-add-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const DeleteIcon = useMemo(
    () => <Icon icon='streamline:file-delete-alternate' width='1.5em' height='1.5em' />,
    [],
  );

  useEffect(() => {
    fetchAndSetFileTree();
  }, [fetchAndSetFileTree]);

  const renderContextMenuItems = useCallback(
    (node: FileItem) => {
      const isFile = node.type === 'file';

      return [
        { type: 'header' },
        { type: 'divider' },
        {
          icon: OpenIcon,
          label: isFile ? 'Open File' : 'Open Folder',
          action: (file) => {
            if (file.type === 'file') {
              handleOpenFile(file.path);
            } else {
              handleSelectedPath(file.path);
            }
          },
        },
        {
          icon: CopyPathIcon,
          label: 'Copy Path',
          action: (file) => {
            handleCopyPath(file.path);
          },
        },
        {
          icon: DeleteIcon,
          label: `Delete ${isFile ? 'File' : 'Folder'} `,
          className: 'text-red-500 hover:bg-red-900/50',
          action: (file) => {
            handleDelete(file.path);
          },
        },
        {
          icon: RenameIcon,
          label: 'Rename',
          action: (file) => {
            handleRename(file.path);
          },
        },
        ...(!isFile
          ? [
              { type: 'divider' },
              {
                icon: NewFileIcon,
                label: 'New File in Folder',
                action: (file) => {
                  handleCreateNewFile(file.path);
                },
              },
              {
                icon: NewFolderIcon,
                label: 'New Folder in Folder',
                action: (file) => {
                  handleCreateNewFolder(file.path);
                },
              },
            ]
          : []),
      ];
    },
    [
      OpenIcon,
      RenameIcon,
      CopyPathIcon,
      NewFileIcon,
      NewFolderIcon,
      DeleteIcon,
      handleOpenFile,
      handleCopyPath,
      handleDelete,
      handleRename,
      handleCreateNewFile,
      handleCreateNewFolder,
      handleSelectedPath,
    ],
  );

  const filteredNodes = useMemo(() => {
    if (!showSearch || !search.trim()) {
      return fileTreeValue;
    }

    const lowerCaseSearchTerm = search.toLowerCase();
    const matchingItems: FileItem[] = [];

    const traverseAndFilter = (nodes: FileItem[]) => {
      nodes.forEach((node) => {
        if (node.name.toLowerCase().includes(lowerCaseSearchTerm)) {
          matchingItems.push(node);
        }

        if (node.type === 'folder' && node.children && node.children.length > 0) {
          traverseAndFilter(node.children);
        }
      });
    };

    traverseAndFilter(fileTreeValue);
    return matchingItems;
  }, [search, fileTreeValue, showSearch]);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FileItem) => {
      event.preventDefault();
      event.stopPropagation();

      showFileExplorerContextMenu(
        true,
        event.clientX,
        event.clientY,
        renderContextMenuItems(node),
        node,
      );
    },
    [renderContextMenuItems],
  );

  return (
    <div className='flex flex-col min-w-full h-full'>
      <FileExplorerHeader
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        currentDirectory={currentDirectory}
        onNewFile={handleCreateNewFile}
        onNewFolder={handleCreateNewFolder}
        onGoUpDirectory={handleGoUpDirectory}
        viewMode={$fileExplorerViewMode}
        onToggleViewMode={toggleFileExplorerViewMode}
        onPathSelect={handleSelectedPath}
      />
      <div className='flex items-center px-1 gap-4 mt-2 h-4'>
        {loading && <LoadingDots color='text-sky-500' />}
      </div>
      <div className='flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'>
        {$fileExplorerViewMode === 'list' ? (
          <FileExplorerListView
            nodes={filteredNodes}
            activeFilePath={activeFilePath}
            onFileSelect={handleFileSelect}
            onToggleFolder={handleToggleFolder}
            onContextMenu={handleNodeContextMenu}
          />
        ) : (
          <FileExplorerThumbnailView
            nodes={filteredNodes}
            activeFilePath={activeFilePath}
            onFileSelect={handleFileSelect}
            onToggleFolder={handleToggleFolder}
            onContextMenu={handleNodeContextMenu}
          />
        )}
      </div>

      {fileExplorerContextMenuState.visible && <FileExplorerContextMenuRenderer />}
    </div>
  );
};

export default FileExplorer;
