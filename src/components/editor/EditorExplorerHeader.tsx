import React, { useEffect } from 'react';
import { PathDropdown } from '@/components/ui/PathDropdown';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { showBottomLeft, toggleBottomLeft } from '@/stores/layout';
import SearchToggleInput from '@/components/SearchToggleInput';
interface EditorFileExplorerHeaderProps {
  search: string;
  setSearch: (value: string) => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  onPathSelect?: (path: string) => void;
}

const EditorExplorerHeader: React.FC<EditorFileExplorerHeaderProps> = ({
  search,
  setSearch,
  showSearch,
  setShowSearch,
  onPathSelect,
}) => {
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);
  const {
    handleCreateNewFile,
    handleCreateNewFolder,
    fetchAndSetFileTree,
    handleGoUpDirectory,
  } = useEditorExplorerActions();
  useEffect(() => {
    if ($editorCurrentDirectory) {
      fetchAndSetFileTree();
    }
  }, [$editorCurrentDirectory, fetchAndSetFileTree, handleGoUpDirectory]);
  return (
    <div className="explorer-header sticky left-0 top-0 w-full z-50 border-b flex items-center h-12 shadow-md justify-between gap-1 font-light px-1">
      <div className="flex-grow text-center">
        <div
          className="flex items-center justify-between font-semibold text-base-content whitespace-nowrap text-ellipsis cursor-pointer"
          title={$editorCurrentDirectory}
        >
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              onClick={toggleBottomLeft}
              className={`${showBottomLeft.get() ? 'active' : ''} `}
              title="Toggle bottom left sidebar"
            >
              <Icon icon="mdi:dock-top" width="2em" height="2em" />
            </Button>
            <Button
              variant="secondary"
              onClick={handleGoUpDirectory}
              title="Go up directory"
            >
              <Icon icon="mdi-light:chevron-up" width="2em" height="2em" />
            </Button>
          </div>
          <div className="flex items-center ">
            <div
              className="flex items-center "
              onClick={() => setShowSearch((prev) => !prev)}
            >
              <SearchToggleInput
                value={search}
                onChange={setSearch}
                show={showSearch}
                placeholder="Search file and folders..."
              />
            </div>
            <Button title="More options" variant="secondary">
              <Icon icon="mdi:dots-vertical" width="2em" height="2em" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorExplorerHeader;
