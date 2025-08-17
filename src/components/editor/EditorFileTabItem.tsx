import React, {
  memo,
  useCallback,
  useMemo,
  forwardRef,
  type MouseEvent,
} from "react";
import { Icon } from "@/components/ui/Icon";
import { FileIcon } from "@/components/FileIcon";

export interface EditorFileTabItemProps {
  file: string;
  language?: string;
  isActive: boolean;
  unSaved: boolean;
  onClick: (path: string, unSaved: boolean) => void;
  onClose: (path: string, unSaved: boolean) => void;
}

export const EditorFileTabItem = memo(
  forwardRef<HTMLButtonElement, EditorFileTabItemProps>(
    ({ file, isActive, onClick, onClose, language, unSaved }, ref) => {
      const filename = useMemo(() => file.split("/").pop() || "", [file]);

      const handleCloseClick = useCallback(
        (e: MouseEvent): void => {
          e.stopPropagation();
          onClose(file, unSaved);
        },
        [onClose, file, unSaved],
      );

      const handleTabClick = useCallback(() => {
        onClick(file, unSaved);
      }, [onClick, file, unSaved]);

      return (
        <div
          ref={ref}
          className={`flex items-center gap-1 cursor-pointer transition-colors duration-100 ease-in-out rounded-none ${
            unSaved ? "italic" : ""
          }`}
          title={file}
          role="tab"
          aria-selected={isActive}
          onClick={handleTabClick}
        >
          <div
            className={`min-w-[100px] text-base h-full flex items-center gap-2 px-4 border-r ${
              isActive ? "active border-b-2 bg-dark border-secondary" : ""
            } relative`}
          >
            <FileIcon
              filename={filename}
              isDirectory={false}
              isOpen={false}
              language={language}
            />
            <span className=" file-name truncate px-2 max-w-[120px]">
              {filename}
            </span>

            {unSaved && (
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

EditorFileTabItem.displayName = "EditorFileTabItem";
