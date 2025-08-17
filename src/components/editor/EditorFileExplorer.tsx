// src/components/editor/EditorFileExplorer.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isLoading } from '@/stores/ui';
import {
  editorActiveFilePath,
  editorFileTreeNodes,
} from '@/stores/editorContent';
import { type FileItem, type ContextMenuItem } from '@/types/file-system';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import LoadingDots from '@/components/LoadingDots';
import EditorFileExplorerNode from '@/components/editor/EditorFileExplorerNode';
import EditorFileExplorerHeader from '@/components/editor/EditorFileExplorerHeader';
import { Icon } from '@/components/ui/Icon';

import { FileExplorerContextMenuRenderer } from '@/components/editor/FileExplorerContextMenuRenderer';
import {
  fileExplorerContextMenu,
  hideFileExplorerContextMenu,
  showFileExplorerContextMenu,
} from '@/stores/contextMenu';

import '@/styles/file-manager.css';

const EditorFileExplorer: React.FC = () => {
  //const openFiles = useStore(editorOpenFiles);
  //const filesMap = useStore(editorFilesMap);
  const activeFilePath = useStore(editorActiveFilePath);
  const fileTreeValue = useStore(editorFileTreeNodes);
  const loading = useStore(isLoading);

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
  } = useEditorExplorerActions();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const OpenIcon = useMemo(() => <Icon icon="ion:open-outline" width="1.5em" height="1.5em" />, []);
  const RenameIcon = useMemo(
    () => <Icon icon="mdi:file-edit-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const CopyPathIcon = useMemo(
    () => <Icon icon="mdi:content-copy" width="1.5em" height="1.5em" />,
    [],
  );
  const NewFileIcon = useMemo(
    () => <Icon icon="qlementine-icons:add-file-16" width="1.5em" height="1.5em" />,
    [],
  );
  const NewFolderIcon = useMemo(
    () => <Icon icon="mdi:folder-add-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const DeleteIcon = useMemo(
    () => <Icon icon="streamline:file-delete-alternate" width="1.5em" height="1.5em" />,
    [],
  );

  useEffect(() => {
    fetchAndSetFileTree();
  }, [fetchAndSetFileTree]);
 /*
  const fileItems: FileItem[] = useMemo(() => {
    return openFiles
      .filter((path) => path in filesMap)
      .map((path) => {
        const name = path.split('/').pop() || path;

        const fileContent = filesMap[path];
        return {
          name,
          path,
          type: 'file',
          children: [],
          open: false,
          createdAt: fileContent?.createdAt || new Date().toISOString(),
          updatedAt: fileContent?.updatedAt || new Date().toISOString(),
          size: fileContent?.size || 0,
        };
      });
  }, [openFiles, filesMap]);

 const filteredFiles = useMemo(() => {
    return search.trim()
      ? fileItems.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()))
      : fileItems;
  }, [search, fileItems]);*/

  const renderContextMenuItems = useCallback(
    (node: FileItem): ContextMenuItem[] => {
      const isFile = node.type === 'file';

      const items: ContextMenuItem[] = [
        { type: 'header' },
        { type: 'divider' },
        {
          icon: OpenIcon,
          label: isFile ? 'Open File' : 'Open Folder',
          action: (file) => {
            if (file.type === 'file') {
              handleOpenFile?.(file.path);
            } else {
              handleSelectedPath?.(file.path);
            }
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: CopyPathIcon,
          label: 'Copy Path',
          action: (file) => {
            handleCopyPath?.(file.path);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: DeleteIcon,
          label: `Delete ${isFile ? 'File' : 'Folder'}`,
          className: 'text-red-500 hover:bg-red-900/50',
          action: (file) => {
            handleDelete?.(file.path);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: RenameIcon,
          label: 'Rename',
          action: (file) => {
            handleRename?.(file.path);
            hideFileExplorerContextMenu();
          },
        },
        ...(!isFile
          ? [
              { type: 'divider' },
              {
                icon: NewFileIcon,
                label: 'New File in Folder',
                action: (file) => {
                  handleCreateNewFile?.(file.path);
                  hideFileExplorerContextMenu();
                },
              },
              {
                icon: NewFolderIcon,
                label: 'New Folder in Folder',
                action: (file) => {
                  handleCreateNewFolder?.(file.path);
                  hideFileExplorerContextMenu();
                },
              },
            ]
          : []),
      ];

      return items;
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
      handleSelectedPath
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
    <div className="flex flex-col min-w-full">
      <EditorFileExplorerHeader
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      <div className="flex items-center px-1 gap-4 mt-2 h-4">
        {loading && <LoadingDots color="text-sky-500" />}
      </div>
      {Array.isArray(filteredNodes) &&
        filteredNodes.map((node) => (
          <EditorFileExplorerNode
            key={node.path}
            node={node}
            level={0}
            activeFilePath={activeFilePath}
            onContextMenu={handleNodeContextMenu}
          />
        ))}

      {fileExplorerContextMenuState.visible && <FileExplorerContextMenuRenderer />}
    </div>
  );
};

export default EditorFileExplorer;
