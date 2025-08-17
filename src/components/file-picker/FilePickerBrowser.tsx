// src/components/file-picker/FilePickerBrowser.tsx
import React, { useCallback, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  editorFileTreeNodes,
} from "@/stores/editorContent"; // Renamed to avoid conflict
import { toggleFolderState } from "@/utils/fileTree";
import { fileService, type FileTreeNode } from "@/services/fileService"; // Assuming FileTreeNode from fileService
import { useToast } from "@/hooks/useToast";
import EditorFileExplorer from "@/components/editor/EditorFileExplorer";
import { Button } from "@/components/ui/Button"; // Your Button component
import { Modal } from "@/components/ui/Modal"; // The Modal component we just created

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
  const [modalFileTree, setModalFileTree] = useState<FileTreeNode[]>([]);
  const [modalCurrentDirectory, setModalCurrentDirectory] =
    useState<string>(".");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const $fileTree = useStore(editorFileTreeNodes);

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
            "error",
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
      const fileNode = $fileTree.find(
        (node) => node.path === path && node.type === "file",
      );
      if (fileNode) {
        setSelectedFilePath(path);
      } else {
        // If it's a directory, allow toggling or navigating into it
        handleToggleFolderInPicker(path);
      }
    },
    [$fileTree],
  ); // Dependency: modalFileTree to ensure up-to-date node info

  const handleToggleFolderInPicker = useCallback(
    (path: string) => {
      // This allows navigating deeper into folders within the picker
      const updated = toggleFolderState(path, $fileTree);
      editorFileTreeNodes.set(updated);
    },
    [$fileTree],
  );

  const handleConfirmSelection = useCallback(() => {
    if (selectedFilePath) {
      onFileSelect(selectedFilePath); // Pass the selected path back to parent
      onClose(); // Close the modal
      setSelectedFilePath(null); // Reset selection
      setModalCurrentDirectory("."); // Reset directory for next open
    } else {
      showToast("Please select a file.", "info");
    }
  }, [selectedFilePath, onFileSelect, onClose, showToast]);

  const handleCancelSelection = useCallback(() => {
    onClose();
    setSelectedFilePath(null); // Reset selection
    setModalCurrentDirectory("."); // Reset directory for next open
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
          {/* Re-use your EditorFileExplorer component here */}
          <EditorFileExplorer
            files={modalFileTree}
            activeFilePath={selectedFilePath} // Highlight the currently selected file in the picker
            onSelectFile={handleSelectFileInPicker} // Use picker-specific select handler
            onToggleFolder={handleToggleFolderInPicker} // Use picker-specific toggle handler
            // Don't pass onCreateNewFile/Folder as these actions are not for the picker
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
