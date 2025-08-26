import React, { useCallback, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { editorFileTreeNodes } from '@/stores/editorContent'; // Renamed to avoid conflict
import { toggleFolderState } from '@/utils/fileTree';
import { fileService, type FileItem } from '@/services/fileService'; // Assuming FileTreeNode from fileService
import { useToast } from '@/hooks/useToast';
import FileExplorerListView from '@/components/file-explorer/FileExplorerListView';
import { Button } from '@/components/ui/Button'; // Your Button component
import { Modal } from '@/components/ui/Modal'; // The Modal component we just created

interface FilePickerBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (path: string) => void;
  // You might want to pass initial directory or filter options if needed
}

export const FilePickerBrowser: React.FC<FilePickerBrowserProps> = ({
  isOpen,
  onClose,
  onFileSelect,
}) => {
  const { showToast } = useToast();
  // We use local state for the file tree and current directory specific to this modal
  // This prevents the modal's navigation from affecting the main Explorer's state
  const [modalFileTree, setModalFileTree] = useState<FileItem[]>([]);
  const [modalCurrentDirectory, setModalCurrentDirectory] =
    useState<string>('.');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Fetch the file tree for the modal when it opens or directory changes
  useEffect(() => {
    if (isOpen) {
      const fetchFileTreeForModal = async () => {
        try {
          const res = await fileService.list(modalCurrentDirectory); // Assuming fileService.list
          setModalFileTree(res);
        } catch (err: any) {
          showToast(
            `Error fetching file tree for picker: ${err.message || String(err)}`,
            'error',
          );
          setModalFileTree([]); // Clear tree on error
        }
      };
      fetchFileTreeForModal();
    }
  }, [isOpen, showToast, modalCurrentDirectory]);

  const handleSelectFileInPicker = useCallback(
    (path: string) => {
      // A file is selected in the Explorer view within the picker
      // Check if it's actually a file, not a directory
      const fileNode = modalFileTree.find(
        (node) => node.path === path && node.type === 'file',
      );
      if (fileNode) {
        setSelectedFilePath(path);
      } else {
        // If it's a directory, allow toggling or navigating into it
        handleToggleFolderInPicker(path);
      }
    },
    [modalFileTree], // Dependency: modalFileTree to ensure up-to-date node info
  );

  const handleToggleFolderInPicker = useCallback(
    async (path: string) => {
      // This allows navigating deeper into folders within the picker
      const updated = toggleFolderState(path, modalFileTree); // Use modal's own file tree
      setModalFileTree(updated);

      // If the folder is opened and its children are not loaded, fetch them
      const folder = updated.find(
        (f) => f.path === path && f.type === 'folder',
      );
      if (
        folder &&
        folder.isOpen &&
        (!folder.children || folder.children.length === 0)
      ) {
        try {
          const children = await fileService.list(path);
          const updatedWithChildren = toggleFolderState(
            path,
            modalFileTree,
            children,
          ); // Pass children to update
          setModalFileTree(updatedWithChildren);
        } catch (err: any) {
          showToast(`Error loading folder content: ${err.message}`, 'error');
          // Optionally, revert the folder state to closed on error
          const reverted = toggleFolderState(path, modalFileTree);
          setModalFileTree(reverted);
        }
      }
    },
    [modalFileTree, showToast],
  );

  const handleContextMenuInPicker = useCallback(
    (e: React.MouseEvent, node: FileItem) => {
      // Context menu is generally not needed for a simple file picker, or would be very limited.
      // We'll just prevent default to avoid native browser context menu.
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleConfirmSelection = useCallback(() => {
    if (selectedFilePath) {
      onFileSelect(selectedFilePath); // Pass the selected path back to parent
      onClose(); // Close the modal
      setSelectedFilePath(null); // Reset selection
      setModalCurrentDirectory('.'); // Reset directory for next open
    } else {
      showToast('Please select a file.', 'info');
    }
  }, [selectedFilePath, onFileSelect, onClose, showToast]);

  const handleCancelSelection = useCallback(() => {
    onClose();
    setSelectedFilePath(null); // Reset selection
    setModalCurrentDirectory('.'); // Reset directory for next open
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancelSelection}
      title="Open File"
      className="max-w-xl h-4/5"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden border-b pb-2">
          <FileExplorerListView
            nodes={modalFileTree}
            activeFilePath={selectedFilePath} // Highlight the currently selected file in the picker
            onFileSelect={handleSelectFileInPicker} // Use picker-specific select handler
            onToggleFolder={handleToggleFolderInPicker} // Use picker-specific toggle handler
            onContextMenu={handleContextMenuInPicker} // Use picker-specific context menu handler
          />
        </div>
        <div className="modal-footer bg-secondary flex justify-end gap-2 p-4 pt-2  flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancelSelection}
            title="Cancel file selection"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="px-4 py-2 text-md rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirmSelection}
            disabled={!selectedFilePath}
            title="Open selected file"
          >
            Open
          </Button>
        </div>
      </div>
    </Modal>
  );
};
