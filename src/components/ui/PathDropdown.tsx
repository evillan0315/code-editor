import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
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
    <div className="flex items-center">
      <Button onClick={handlePathSelect} title="Go up directory">
        <Icon width="1.6em" height="1.6em" icon="mdi-light:chevron-up" />
      </Button>
      <DropdownMenu
        className={`path-dropdown ${className || ''}`}
        direction="down"
        trigger={({ isOpen, toggle, ref }) => (
          <>
            {console.log(isOpen)}
            <Button
              ref={ref}
              className="w-full flex items-center justify-between gap-2 border"
              title={`Current directory: ${currentDisplay}`}
            >
              <div className="flex items-center gap-2 w-full" onClick={toggle}>
                <span className="inline-block truncate max-w-[190px]">{currentDisplay}</span>
                <Icon width="1.6em" height="1.6em" icon="mdi:search" />
              </div>
            </Button>
          </>
        )}
      >
        <div className="max-h-72 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 bg-dark">
          {}
          <div
            className="sticky top-0 z-10 bg-secondary border-b border-gray-700 px-1 flex h-10 items-center justify-between gap-0"
            onClick={() => setShowSearch((prev) => !prev)}
          >
            {}
            <SearchToggleInput
              value={search}
              onChange={setSearch}
              show={showSearch}
              placeholder="Search file and folders..."
            />
          </div>

          {!search && (
            <ul className="m-0 p-0 w-full">
              {displayableParentPaths.length > 0 ? (
                displayableParentPaths.map((item, index) => (
                  <li key={item.fullPath + index}>
                    <Button
                      onClick={() => handlePathSelect(item.fullPath)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-sky-800 hover:text-white justify-start flex gap-3"
                    >
                      <Icon icon="mdi-light:folder" width="1.5em" height="1.5em" />
                      <span className="truncate">{item.name}</span>
                    </Button>
                  </li>
                ))
              ) : (
                <li>
                  <span className="block px-4 py-2 text-sm text-gray-400 italic">
                    No matching directories
                  </span>
                </li>
              )}
            </ul>
          )}
          {filteredPaths.length > 0 && (
            <div className="hidden sticky bottom-0 z-10 bg-secondary border-t border-gray-700 px-2 py-2 flex justify-end gap-2">
              <span className="block px-4 py-2 text-sm text-gray-400 italic">
                Some footer content here
              </span>
            </div>
          )}
        </div>
      </DropdownMenu>
    </div>
  );
}
