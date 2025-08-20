import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { getDirectoryPaths, truncateFilePath } from '@/utils/pathUtils';
import SearchToggleInput from '@/components/SearchToggleInput';
import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';

interface PathDropdownProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  filePath?: string;
  search: string;
  setSearch: (value: string) => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
}

export function PathDropdown({
  //filePath,
  //onNewFile,
  //onNewFolder,
  search,
  setSearch,
  showSearch,
  setShowSearch,
}: PathDropdownProps) {
  const className = '';
  //const width = '200px';
  //const variant = 'secondary';
  const {  fetchAndSetFileTree, handleGoUpDirectory } =
    useEditorExplorerActions();
  const currentDir = useStore(editorCurrentDirectory);
  const allPathSegments = useMemo(() => getDirectoryPaths(currentDir), [currentDir]);

  const currentDisplay = useMemo(() => {
    if (!currentDir) return 'Select Path';
    return truncateFilePath(currentDir);
  }, [currentDir]);

  const displayableParentPaths = useMemo(() => {
    if (currentDir === './' || /^[a-zA-Z]:\\?$/.test(currentDir)) return [];
    return allPathSegments.slice(0, -1);
  }, [allPathSegments, currentDir]);

  const filteredPaths = useMemo(() => {
    if (!search.trim()) return displayableParentPaths;
    const lower = search.toLowerCase();
    return displayableParentPaths.filter((p) => p.name.toLowerCase().includes(lower));
  }, [search, displayableParentPaths]);
  const handlePathSelect = useCallback(async () => {
    await handleGoUpDirectory();
    fetchAndSetFileTree();
  }, [fetchAndSetFileTree, handleGoUpDirectory]);

  return (
    <div className="flex items-center justify-between w-full ">
      <Button onClick={handlePathSelect} title="Go up directory">
      <div className="flex items-center" >
        <Icon width="1.6em" height="1.6em" icon="mdi-light:chevron-up" />
        </div>
      </Button>

              <div className="flex items-center" onClick={() => setShowSearch((prev) => !prev)}>
             <SearchToggleInput
              value={search}
              onChange={setSearch}
              show={showSearch}
              placeholder="Search file and folders..."
            />
              </div>
           

      
      
        
    
    </div>
    
  );
}
