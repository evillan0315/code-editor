import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isLoading } from '@/stores/ui';
import {
  editorActiveFilePath,
  editorFileTreeNodes,
  editorCurrentDirectory,
  renamingPath,
  renamingOriginalName,
} from '@/stores/editorContent';
import {
  type FileItem,
  type ContextMenuItem,
  FileMoveRequest,
} from '@/types/file-system';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import LoadingDots from '@/components/LoadingDots';
import LoadingIndicator from '@/components/LoadingIndicator';
import EditorExplorerNode from '@/components/editor/EditorExplorerNode';
import EditorExplorerHeader from '@/components/editor/EditorExplorerHeader';
import { Icon } from '@/components/ui/Icon';

import {
  fileExplorerContextMenu,
  hideFileExplorerContextMenu,
  showFileExplorerContextMenu,
} from '@/stores/contextMenu';
import { FileExplorerContextMenuRenderer } from '@/components/editor/FileExplorerContextMenuRenderer';
import { showTerminal, activeTerminal } from '@/stores/layout'; // Import terminal stores
import { getParentPath } from '@/utils/fileTree';
import '@/styles/file-manager.css';

const EditorExplorer: React.FC = () => {
  const editorCurrentDir = useStore(editorCurrentDirectory);
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
    handleCopy,
    handleMove,
    handleOpenFile,
    fetchAndSetFileTree,
    handleSelectedPath,
  } = useEditorExplorerActions();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const OpenIcon = useMemo(
    () => <Icon icon="ion:open-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const RenameIcon = useMemo(
    () => <Icon icon="mdi:file-edit-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const CopyPathIcon = useMemo(
    () => <Icon icon="mdi:content-copy" width="1.5em" height="1.5em" />,
    [],
  );
  const NewFileIcon = useMemo(
    () => (
      <Icon icon="qlementine-icons:add-file-16" width="1.5em" height="1.5em" />
    ),
    [],
  );
  const NewFolderIcon = useMemo(
    () => <Icon icon="mdi:folder-add-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const DeleteIcon = useMemo(
    () => (
      <Icon
        icon="streamline:file-delete-alternate"
        width="1.5em"
        height="1.5em"
      />
    ),
    [],
  );
  const CopyIcon = useMemo(
    () => <Icon icon="mdi:content-copy" width="1.5em" height="1.5em" />,
    [],
  );
  const MoveIcon = useMemo(
    () => <Icon icon="mdi:file-move-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const OpenTerminalIcon = useMemo(
    () => <Icon icon="mdi:console" width="1.5em" height="1.5em" />,
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
        { type: 'divider' },
        {
          icon: RenameIcon,
          label: 'Rename',
          action: (file) => {
            // Trigger inline edit mode for the specific node
            renamingPath.set(file.path);
            renamingOriginalName.set(file.name);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: CopyIcon,
          label: `Copy ${isFile ? 'File' : 'Folder'}`, // Keep Copy option
          action: (file) => {
            handleCopy?.(file.path);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: MoveIcon,
          label: `Move ${isFile ? 'File' : 'Folder'}`, // Keep Move option
          action: (file) => {
            handleMove?.(file.path);
            hideFileExplorerContextMenu();
          },
        },
        { type: 'divider' },
        {
          icon: DeleteIcon,
          label: `Delete ${isFile ? 'File' : 'Folder'}`, // Keep Delete option
          className: 'text-red-500 hover:bg-red-900/50',
          action: (file) => {
            handleDelete?.(file.path);
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
              { type: 'divider' }, // Add divider before terminal options
              {
                icon: OpenTerminalIcon,
                label: 'Open Terminal Here',
                action: (file) => {
                  showTerminal.set(true); // Open the terminal panel
                  activeTerminal.set('local'); // Ensure local terminal is active
                  editorCurrentDirectory.set(file.path); // Set terminal CWD to folder path
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
      CopyIcon,
      MoveIcon,
      OpenTerminalIcon, // Add OpenTerminalIcon to dependency array
      handleOpenFile,
      handleCopyPath,
      handleDelete,
      handleCopy,
      handleMove,
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

        if (
          node.type === 'folder' &&
          node.children &&
          node.children.length > 0
        ) {
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

  const handleRenameSubmit = useCallback(
    async (oldPath: string, newName: string) => {
      const newPath = `${getParentPath(oldPath)}/${newName}`;
      await handleRename({ oldPath, newPath });
      renamingPath.set(null); // Exit rename mode
      renamingOriginalName.set(null);
    },
    [handleRename],
  );

  return (
    <div className="flex flex-col min-w-full min-h-0 ">
      <EditorExplorerHeader
        search={search}
        setSearch={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onPathSelect={handleSelectedPath}
      />

      {loading && <LoadingIndicator color="text-sky-500" />}
      <div className="py-2 px-1 ">
        {Array.isArray(filteredNodes) &&
          filteredNodes.map((node) => (
            <EditorExplorerNode
              key={node.path}
              node={node}
              level={0}
              activeFilePath={activeFilePath}
              onContextMenu={handleNodeContextMenu}
              onRenameSubmit={handleRenameSubmit} // Pass rename submit handler
            />
          ))}
      </div>
      {fileExplorerContextMenuState.visible && (
        <FileExplorerContextMenuRenderer />
      )}
    </div>
  );
};

export default EditorExplorer;
