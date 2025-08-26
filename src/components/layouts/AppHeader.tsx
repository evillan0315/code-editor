import React, { useCallback, useState } from 'react';
import { useStore } from '@nanostores/react';
import { toggleConfigPanel } from '@/stores/ui';

import {
  toggleLeftSidebar,
  toggleRightSidebar,
  toggleTerminal,
  showLeftSidebar,
  showRightSidebar,
  showTerminal,
} from '@/stores/layout';
import { editorActiveFilePath } from '@/stores/editorContent';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { FilePickerBrowser } from '@/components/file-picker/FilePickerBrowser';
import { truncateFilePath } from '@/utils/pathUtils';
import Logo from '@/components/ui/Logo';

import { useEditorTabs } from '@/hooks/useEditorTabs';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { ProjectModal } from '@/components/projects/ProjectModal'; // Import the new ProjectModal

interface AppHeaderProps {
  logo?: React.ReactNode | string;
  leftColumn?: React.ReactNode;
  middleColumn?: React.ReactNode;
}

export function AppHeader({ logo, childrean }: AppHeaderProps) {
  const $editorActiveFilePath = useStore(editorActiveFilePath);

  const {
    activeFilePath,
    openFiles,
    isCurrentFileUnsaved,
    handleSave,
    handleCloseAllTabs,
    handleSetActiveFile,
  } = useEditorTabs();

  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false); // New state for project modal

  const handleOpenNewFile = useCallback(() => setIsFilePickerOpen(true), []);
  const handleCloseFilePicker = useCallback(
    () => setIsFilePickerOpen(false),
    [],
  );
  const handleFilePickerSelect = useCallback(
    (path: string) => {
      handleSetActiveFile(path);
      setIsFilePickerOpen(false);
    },
    [handleSetActiveFile],
  );

  const displayPath = truncateFilePath(activeFilePath);

  const handleOpenProjectModal = useCallback(() => {
    setIsProjectModalOpen(true);
  }, []);

  const handleCloseProjectModal = useCallback(() => {
    setIsProjectModalOpen(false);
  }, []);

  const handlePathSelected = (selectedPath: string) => {
    console.log('Selected directory path:', selectedPath);
  };

  return (
    <>
      <header
        className="
          app-header
          flex          
          items-center   
          bg-dark
          py-1
          h-14
          opacity-80
          gap-4        
          border-b     
          bg-gray-900    
          text-sm        
          font-semibold  
        "
      >
        <div className="flex-shrink-0 min-w-[20%] font-ligh px-3">
          <div className="flex items-center justify-start gap-4">
            {logo || (
              <div className="flex items-center text-sm font-light">
                <Button
                  variant="secondary"
                  className={`${showLeftSidebar.get() ? 'active' : ''}`}
                  title="Toggle Left Sidebar"
                  onClick={toggleLeftSidebar}
                >
                  <Icon icon="mdi:dock-left" width="2em" height="2em" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between w-full">
              <Logo color="text-sky-500" secondary="text-gray-100" />
              <Button
                variant="secondary"
                title="Create Project"
                onClick={handleOpenProjectModal} // Updated to open project modal
              >
                <Icon icon="mdi:card-plus" width="2em" height="2em" />
                Create Project
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-grow text-center min-w-[calc(50%-100px)]">
          <div className="flex items-center justify-between ">
            <div
              onClick={() => setIsFilePickerOpen((prev) => !prev)}
              title={activeFilePath}
              className="truncate w-[90%] text-center cursor-pointer"
            >
              {displayPath}
            </div>

            <div className="flex items-center gap-0 pr-6"></div>
          </div>
        </div>

        <div className="flex-shrink-1 flex items-center min-w-[calc(30%)] px-3">
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center justify-start gap-4 font-semibold">
              {}
            </div>
            <div className="flex items-center gap-2 justify-end ">
              <div className="flex items-center gap-2 ">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={!activeFilePath || !isCurrentFileUnsaved}
                  title="Save (Ctrl+S)"
                >
                  Save
                  <Icon
                    icon="mdi:content-save"
                    width="2em"
                    height="2em"
                    className="ml-3"
                  />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={toggleConfigPanel}
                  className=""
                  aria-label="Toggle settings panel"
                  title="Toggle settings panel"
                >
                  <Icon icon="mdi:cog" width="2em" height="2em" />
                </Button>

                <ThemeToggleButton />
                <Button
                  variant="secondary"
                  className={`${showTerminal.get() ? 'active' : ''}`}
                  title="Toggle Terminal"
                  onClick={toggleTerminal}
                >
                  <Icon icon="mdi-light:console" width="2em" height="2em" />
                </Button>
                <Button
                  variant="secondary"
                  className={`${showRightSidebar.get() ? 'active' : ''}`}
                  title="Toggle right sidebar"
                  onClick={toggleRightSidebar}
                >
                  <Icon icon="mdi:dock-right" width="2em" height="2em" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <FilePickerBrowser
        isOpen={isFilePickerOpen}
        onClose={handleCloseFilePicker}
        onFileSelect={handleFilePickerSelect}
      />
      {/* Project Modal Integration */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={handleCloseProjectModal}
        size="md"
      />
    </>
  );
}
