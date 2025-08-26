import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import {
  fileExplorerContextMenu,
  hideFileExplorerContextMenu,
} from '@/stores/contextMenu';
import { Icon } from '@/components/ui/Icon';
import { getLanguageExtensionByFilename } from '@/utils/editorLanguage';
export const FileExplorerContextMenuRenderer = () => {
  const state = useStore(fileExplorerContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);

  const [adjustedTop, setAdjustedTop] = useState(state.y);
  const [adjustedLeft, setAdjustedLeft] = useState(state.x);

  useLayoutEffect(() => {
    if (state.visible && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newTop = state.y;
      let newLeft = state.x;

      if (state.y + menuRect.height > viewportHeight) {
        newTop = viewportHeight - menuRect.height;
      }

      if (state.x + menuRect.width > viewportWidth) {
        newLeft = viewportWidth - menuRect.width;
      }

      newTop = Math.max(0, newTop);
      newLeft = Math.max(0, newLeft);

      setAdjustedTop((prevTop) => (prevTop === newTop ? prevTop : newTop));
      setAdjustedLeft((prevLeft) =>
        prevLeft === newLeft ? prevLeft : newLeft,
      );
    } else if (!state.visible) {
      setAdjustedTop(state.y);
      setAdjustedLeft(state.x);
    }
  }, [state.visible, state.x, state.y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideFileExplorerContextMenu();
      }
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.visible]);

  if (!state.visible) return null;

  return (
    <AnimatePresence>
      {state.visible && ( // Conditionally render the motion.div
        <motion.div
          ref={menuRef}
          // Define animation properties
          initial={{ opacity: 0, scale: 0.95 }} // Start slightly transparent and smaller
          animate={{ opacity: 1, scale: 1 }} // Animate to fully visible and original size
          exit={{ opacity: 0, scale: 0.85 }} // Animate back to transparent and smaller when hiding
          transition={{ duration: 0.15, ease: 'easeOut' }} // Quick and smooth animation
          className="fixed z-[1000] bg-dark shadow-md border rounded-md w-[300px] min-w-[180px] text-sm"
          style={{
            top: adjustedTop - 20,
            left: adjustedLeft,
          }}
          // Stop propagation of click events to prevent accidental closing if menu items are clicked
          onClick={(e) => e.stopPropagation()}
        >
          {state.items.map((item, idx) => {
            if (item.type === 'divider') {
              return <div key={idx} className=" mx-3" />;
            }

            if (item.type === 'header') {
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col px-3 py-4 bg-secondary text-xs font-semibold text-base space-y-1 tracking-wide border-b">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">NAME:</div>
                      <div className="flex items-center">{state.file.name}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">PATH:</div>
                      <div className="flex items-center text-muted font-normal max-w-[70%]">
                        <span className="truncate px-2">{state.file.path}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">TYPE:</div>
                      <div className="flex items-center gap-2">
                        {state.file.type === 'folder' ? (
                          <>
                            <Icon
                              icon="mdi:folder"
                              width="1.2em"
                              height="1.2em"
                            />{' '}
                            {state.file.type}{' '}
                          </>
                        ) : (
                          <>
                            <Icon
                              icon="mdi:file"
                              width="1.2em"
                              height="1.2em"
                            />{' '}
                            <span
                              className="truncate"
                              title={state.file.mimeType}
                            >
                              
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {state.file.type === 'file' ? (
                      <>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">SIZE:</div>
                      <div className="flex items-center">
                        <span>{(state.file.size / 1024).toFixed(2)} KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">
                        CREATED:
                      </div>
                      <div className="flex items-center">
                        {new Date(state.file.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center min-w-[30%]">
                        MODIFIED:
                      </div>
                      <div className="flex items-center">
                        {new Date(state.file.updatedAt).toLocaleString()}
                      </div>
                    </div>
                        </>
                    ) : ''} 
                   
                    {state.file.type === 'folder' && state.file.children && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center min-w-[30%]">
                          CONTENT:
                        </div>
                        <div className="flex items-center">
                          {state.file.children.length}{' '}
                          {state.file.children.length === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            }

            return (
              <div
                key={idx}
                className="px-4 py-3 cursor-pointer hover:bg-neutral-500/20 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.action && state.file) {
                    item.action(state.file);
                  }
                  hideFileExplorerContextMenu();
                }}
              >
                {item.icon && item.icon}
                <span>{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
