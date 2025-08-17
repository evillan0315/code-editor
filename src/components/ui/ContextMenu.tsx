import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useStore } from '@nanostores/react';
import { codeMirrorContextMenu, hideCodeMirrorContextMenu } from '@/stores/contextMenu';

export const ContextMenu = () => {
  const state = useStore(codeMirrorContextMenu);
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
      setAdjustedLeft((prevLeft) => (prevLeft === newLeft ? prevLeft : newLeft));
    } else if (!state.visible) {
      setAdjustedTop(state.y);
      setAdjustedLeft(state.x);
    }
  }, [state.visible, state.x, state.y]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideCodeMirrorContextMenu();
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
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-dark shadow-md border rounded min-w-[180px] text-sm"
      style={{
        top: adjustedTop,
        left: adjustedLeft,
      }}
    >
      {state.items.map((item, idx) => {
        if (item.type === 'divider') {
          return <div key={idx} className="my-1 border-t mx-3" />;
        }

        if (item.type === 'header') {
          return (
            <div
              key={idx}
              className="px-3 py-2 text-xs uppercase font-semibold text-gray-400 tracking-wide"
            >
              {item.label}
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="px-4 py-2 cursor-pointer hover:bg-neutral-500/20 flex items-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              if (item.action && state.editorView) {
                item.action(state.editorView);
              }
              hideCodeMirrorContextMenu();
            }}
          >
            {item.icon && item.icon}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};
