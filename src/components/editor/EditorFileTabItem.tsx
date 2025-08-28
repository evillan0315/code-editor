import React, {
  memo,
  useCallback,
  useMemo,
  forwardRef,
  type MouseEvent,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Icon } from '@/components/ui/Icon';
import { FileIcon } from '@/components/FileIcon';
import { FileRenameRequest } from '@/types/file-system';
export interface EditorFileTabItemProps {
  file: string;
  language?: string;
  isActive: boolean;
  unSaved: boolean;
  onClick: (path: string, unSaved: boolean) => void;
  onClose: (path: string, unSaved: boolean) => void;
  onRenameSubmit: (data: FileRenameRequest) => Promise<void>;
}

export const EditorFileTabItem = memo(
  forwardRef<HTMLButtonElement, EditorFileTabItemProps>(
    (
      { file, isActive, onClick, onClose, language, unSaved, onRenameSubmit },
      ref,
    ) => {
      const filename = useMemo(() => file.split('/').pop() || '', [file]);
      const [isRenaming, setIsRenaming] = useState(false);
      const [currentName, setCurrentName] = useState(filename);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        if (isRenaming && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
        setCurrentName(filename); // Keep internal state in sync with prop for non-editing mode
      }, [isRenaming, filename]);

      const handleCloseClick = useCallback(
        (e: MouseEvent): void => {
          e.stopPropagation();
          onClose(file, unSaved);
        },
        [onClose, file, unSaved],
      );

      const handleTabClick = useCallback(() => {
        if (isRenaming) return; // Prevent tab change when renaming
        onClick(file, unSaved);
      }, [onClick, file, unSaved, isRenaming]);

      const handleTabDoubleClick = useCallback(() => {
        setIsRenaming(true);
      }, []);

      const handleInputBlur = useCallback(async () => {
        if (!isRenaming) return;
        if (currentName.trim() && currentName !== filename) {
          const parentPath = file.substring(0, file.lastIndexOf('/') + 1);
          const newPath = `${parentPath}${currentName}`;
          await onRenameSubmit({ oldPath: file, newPath });
        }
        setIsRenaming(false);
      }, [isRenaming, currentName, filename, file, onRenameSubmit]);

      const handleInputKeyDown = useCallback(
        async (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur(); // Trigger blur to save
          } else if (e.key === 'Escape') {
            setCurrentName(filename); // Revert to original name
            setIsRenaming(false); // Exit renaming mode
          }
        },
        [filename],
      );

      return (
        <div
          ref={ref}
          className={`flex items-center gap-1 cursor-pointer transition-colors duration-100 ease-in-out rounded-none ${unSaved ? 'italic' : ''}`}
          title={file}
          role="tab"
          aria-selected={isActive}
          onClick={handleTabClick}
          onDoubleClick={handleTabDoubleClick}
        >
          <div
            className={`min-w-[100px] text-base h-full flex items-center gap-2 px-4 border-r ${isActive ? 'active border-b-2 bg-dark border-secondary' : ''}
            ${isRenaming ? 'bg-neutral-600/20' : ''} relative`}
          >
            <FileIcon
              filename={filename}
              isDirectory={false}
              isOpen={false}
              language={language}
            />
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="flex-grow min-w-0 bg-transparent border border-neutral-500 rounded px-1 py-0.5 text-sm"
                onClick={(e) => e.stopPropagation()} // Prevent tab click when clicking input
                onFocus={(e) => e.target.select()} // Select all text on focus
              />
            ) : (
              <span className="file-name truncate px-2 max-w-[120px]">
                {filename}
              </span>
            )}

            {unSaved && !isRenaming && (
              <span
                className="text-yellow-400 ml-1 select-none absolute top-1 right-2"
                aria-hidden="true"
              >
                *
              </span>
            )}

            <Icon
              onClick={handleCloseClick}
              aria-label={`Close ${filename} tab`}
              title={`Close ${filename}`}
              icon="mdi:close"
              className="w-5 h-5 text-gray-400 hover:text-red-500 close-tab-button ml-2 transition-colors duration-100 ease-in-out flex-shrink-0"
            />
          </div>
        </div>
      );
    },
  ),
);

EditorFileTabItem.displayName = 'EditorFileTabItem';
