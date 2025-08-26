import React, { useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { PathDropdown } from '@/components/ui/PathDropdown';
import SearchToggleInput from '@/components/SearchToggleInput';
import { FileExplorerViewMode } from '@/stores/layout';

interface FileExplorerHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  currentDirectory: string;
  onNewFile: (path?: string) => void;
  onNewFolder: (path?: string) => void;
  onGoUpDirectory: (path: string) => void; // Expects path to navigate up to
  viewMode: FileExplorerViewMode;
  onToggleViewMode: () => void;
  onPathSelect: (path: string) => void; // Expects path to navigate up to
}

const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
  search,
  setSearch,
  showSearch,
  setShowSearch,
  currentDirectory,
  onNewFile,
  onNewFolder,
  onGoUpDirectory,
  viewMode,
  onToggleViewMode,
  onPathSelect,
}) => {
  const handleCreateNewFile = useCallback(() => {
    onNewFile(currentDirectory);
  }, [onNewFile, currentDirectory]);

  const handleCreateNewFolder = useCallback(() => {
    onNewFolder(currentDirectory);
  }, [onNewFolder, currentDirectory]);

  const handleGoUp = useCallback(() => {
    onGoUpDirectory(currentDirectory);
  }, [onGoUpDirectory, currentDirectory]);

  return (
    <div className="explorer-header sticky left-0 top-0 w-full z-50 border-b flex flex-col shadow-md font-light px-1">
      <div className="flex items-center justify-between h-12 gap-1">
        <Button
          variant="secondary"
          onClick={handleGoUp}
          title="Go up directory"
        >
          <Icon icon="mdi-light:chevron-up" width="2em" height="2em" />
        </Button>
        <PathDropdown filePath={currentDirectory} onPathSelect={onPathSelect} />
        <Button
          title="New File"
          variant="secondary"
          onClick={handleCreateNewFile}
        >
          <Icon icon="qlementine-icons:add-file-16" width="2em" height="2em" />
        </Button>
        <Button
          title="New Folder"
          variant="secondary"
          onClick={handleCreateNewFolder}
        >
          <Icon icon="mdi:folder-add-outline" width="2em" height="2em" />
        </Button>
        <Button
          variant="secondary"
          onClick={onToggleViewMode}
          title={
            viewMode === 'list'
              ? 'Switch to Thumbnail View'
              : 'Switch to List View'
          }
        >
          <Icon
            icon={
              viewMode === 'list'
                ? 'mdi:view-grid-outline'
                : 'mdi:view-list-outline'
            }
            width="2em"
            height="2em"
          />
        </Button>
      </div>
      <div className="px-1 pb-2">
        <SearchToggleInput
          value={search}
          onChange={setSearch}
          show={true} // Always show search in header
          onToggle={() => setShowSearch(!showSearch)} // Still provide toggle behavior if needed, e.g., to clear/focus
          placeholder="Search files and folders..."
        />
      </div>
    </div>
  );
};

export default FileExplorerHeader;
