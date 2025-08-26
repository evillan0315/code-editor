import React from 'react';
import { PathDropdown } from '@/components/ui/PathDropdown';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { showBottomLeft, toggleBottomLeft } from '@/stores/layout';

interface EditorFileExplorerHeaderProps {
  // Props related to search and toggle are now handled by the parent FileExplorerHeader
  // This component only handles path-related display and navigation up.
}

const EditorFileExplorerHeader: React.FC<
  EditorFileExplorerHeaderProps
> = () => {
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);
  const { handleCreateNewFile, handleCreateNewFolder, handleGoUpDirectory } =
    useEditorExplorerActions();

  return (
    <div className="explorer-header sticky left-0 top-0 w-full z-50 border-b flex items-center h-12 shadow-md justify-between gap-1 font-light px-1">
      <div className="flex-grow text-center">
        <div
          className="flex items-center justify-between font-semibold text-base-content whitespace-nowrap text-ellipsis cursor-pointer"
          title={$editorCurrentDirectory}
        >
          <Button
            variant="secondary"
            onClick={toggleBottomLeft}
            className={`${showBottomLeft.get() ? 'active' : ''}`}
            title="Toggle bottom left sidebar"
          >
            <Icon icon="mdi:dock-top" width="2em" height="2em" />
          </Button>

          <PathDropdown
            filePath={$editorCurrentDirectory}
            onPathSelect={handleGoUpDirectory} // This is for 'go up' functionality now
          />

          <Button title="More options" variant="secondary">
            <Icon icon="mdi:dots-vertical" width="2em" height="2em" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorFileExplorerHeader;
