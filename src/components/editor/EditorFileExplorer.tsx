import React, { useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { editorActiveFilePath } from '@/stores/editorContent';
import { type FileItem, type ContextMenuItem } from '@/types/file-system';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import EditorFileExplorerNode from '@/components/editor/EditorFileExplorerNode';
import { Icon } from '@/components/ui/Icon';

import {
  hideFileExplorerContextMenu,
  showFileExplorerContextMenu,
} from '@/stores/contextMenu';

import '@/styles/file-manager.css';

interface EditorFileExplorerProps {
  nodes: FileItem[];
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
  onToggleFolder: (path: string) => Promise<void>;
  onContextMenu: (e: React.MouseEvent, node: FileItem) => void;
}

const EditorFileExplorer: React.FC<EditorFileExplorerProps> = ({
  nodes,
  activeFilePath,
  onFileSelect,
  onToggleFolder,
  onContextMenu,
}) => {
  // These actions are now typically handled by the parent `FileExplorer` or `FilePickerBrowser`
  // and passed down via props, rather than directly using the hooks here.
  // However, `useEditorExplorerActions` provides the underlying logic that the parent will use.
  const {
    handleOpenFile,
    handleCopyPath,
    handleDelete,
    handleRename,
    handleCreateNewFile,
    handleCreateNewFolder,
    handleSelectedPath,
  } = useEditorExplorerActions();

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

  // This context menu logic remains here because it's specific to how THIS component's nodes are interacted with
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
              handleOpenFile(file.path);
            } else {
              handleSelectedPath(file.path);
            }
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: CopyPathIcon,
          label: 'Copy Path',
          action: (file) => {
            handleCopyPath(file.path);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: DeleteIcon,
          label: `Delete ${isFile ? 'File' : 'Folder'} `,
          className: 'text-red-500 hover:bg-red-900/50',
          action: (file) => {
            handleDelete(file.path);
            hideFileExplorerContextMenu();
          },
        },
        {
          icon: RenameIcon,
          label: 'Rename',
          action: (file) => {
            handleRename(file.path);
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
                  handleCreateNewFile(file.path);
                  hideFileExplorerContextMenu();
                },
              },
              {
                icon: NewFolderIcon,
                label: 'New Folder in Folder',
                action: (file) => {
                  handleCreateNewFolder(file.path);
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
      handleSelectedPath,
    ],
  );

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
      {nodes.map((node) => (
        <EditorFileExplorerNode
          key={node.path}
          node={node}
          level={0}
          activeFilePath={activeFilePath}
          onFileSelect={onFileSelect}
          onToggleFolder={onToggleFolder}
          onContextMenu={onContextMenu || handleNodeContextMenu} // Use prop or default
        />
      ))}
    </div>
  );
};

export default EditorFileExplorer;
