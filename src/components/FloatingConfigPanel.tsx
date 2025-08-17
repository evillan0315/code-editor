// src/components/FloatingConfigPanel.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { isConfigPanelOpen } from '@/stores/ui';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { MAX_WIDTH_PERCENT, MAX_HEIGHT_VH, MIN_SIZE_PX } from '@/constants';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
interface FloatingConfigPanelProps {
  header?: React.ReactNode | string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function FloatingConfigPanel({
  header,
  children,

  className,
}: FloatingConfigPanelProps) {
  const isOpen = useStore(isConfigPanelOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState({ x: 50, y: 50 });

  const [size, setSize] = useState({ width: 300, height: 500 });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isResizing = useRef(false);
  const resizeDirection = useRef('');
  const initialMousePos = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });
  const initialPanelPos = useRef({ x: 0, y: 0 });

  const getMaxDimensions = useCallback(() => {
    return {
      maxWidth: window.innerWidth * (MAX_WIDTH_PERCENT / 100),
      maxHeight: window.innerHeight * (MAX_HEIGHT_VH / 100),
    };
  }, []);

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (headerRef.current && headerRef.current.contains(target) && !target.closest('button')) {
        isDragging.current = true;
        dragOffset.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
        if (headerRef.current) {
          headerRef.current.style.cursor = 'grabbing';
          headerRef.current.style.userSelect = 'none';
        }
        e.preventDefault();
      }
    },
    [position.x, position.y],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      isResizing.current = true;
      resizeDirection.current = direction;
      initialMousePos.current = { x: e.clientX, y: e.clientY };
      initialSize.current = { ...size };
      initialPanelPos.current = { ...position };

      if (panelRef.current) {
        panelRef.current.style.userSelect = 'none';
      }
      e.preventDefault();
    },
    [position, size],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { maxWidth, maxHeight } = getMaxDimensions();

      if (isDragging.current) {
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        newX = clamp(newX, 0, window.innerWidth - size.width);
        newY = clamp(newY, 0, window.innerHeight - size.height);

        setPosition({ x: newX, y: newY });
      } else if (isResizing.current) {
        let newWidth = initialSize.current.width;
        let newHeight = initialSize.current.height;
        let newX = initialPanelPos.current.x;
        let newY = initialPanelPos.current.y;

        const deltaX = e.clientX - initialMousePos.current.x;
        const deltaY = e.clientY - initialMousePos.current.y;

        if (resizeDirection.current.includes('right')) {
          newWidth = clamp(initialSize.current.width + deltaX, MIN_SIZE_PX, maxWidth);
        } else if (resizeDirection.current.includes('left')) {
          newWidth = clamp(initialSize.current.width - deltaX, MIN_SIZE_PX, maxWidth);

          newX = initialPanelPos.current.x + (initialSize.current.width - newWidth);
        }

        if (resizeDirection.current.includes('bottom')) {
          newHeight = clamp(initialSize.current.height + deltaY, MIN_SIZE_PX, maxHeight);
        } else if (resizeDirection.current.includes('top')) {
          newHeight = clamp(initialSize.current.height - deltaY, MIN_SIZE_PX, maxHeight);

          newY = initialPanelPos.current.y + (initialSize.current.height - newHeight);
        }

        setSize({ width: newWidth, height: newHeight });

        setPosition({
          x: clamp(newX, 0, window.innerWidth - newWidth),
          y: clamp(newY, 0, window.innerHeight - newHeight),
        });
      }
    },
    [size, getMaxDimensions, initialSize, initialMousePos, initialPanelPos],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    if (headerRef.current) {
      headerRef.current.style.cursor = 'grab';
      headerRef.current.style.userSelect = 'auto';
    }
    if (panelRef.current) {
      panelRef.current.style.userSelect = 'auto';
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleWindowResize = () => {
      const { maxWidth, maxHeight } = getMaxDimensions();
      setSize((prevSize) => {
        const newWidth = clamp(prevSize.width, MIN_SIZE_PX, maxWidth);
        const newHeight = clamp(prevSize.height, MIN_SIZE_PX, maxHeight);

        setPosition((prevPos) => ({
          x: clamp(prevPos.x, 0, window.innerWidth - newWidth),
          y: clamp(prevPos.y, 0, window.innerHeight - newHeight),
        }));
        return { width: newWidth, height: newHeight };
      });
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isOpen, handleMouseMove, handleMouseUp, getMaxDimensions]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="floating-content-wrapper fixed z-1000">
      <div
        ref={panelRef}
        className={`
        ${className}
        bg-secondary
        fixed             
        z-[1000]          
        rounded-lg       
        shadow-lg              
        flex             
        flex-col          
        overflow-hidden  
      `}
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,

          maxWidth: `${MAX_WIDTH_PERCENT}vw`,
          maxHeight: `${MAX_HEIGHT_VH}vh`,
        }}
      >
    
        <div
          ref={headerRef}
          className="p-2 border-b border-gray-200 dark:border-gray-700 cursor-grab flex items-center justify-between"
          onMouseDown={handleDragMouseDown}
        >
          {header || <h3 className="text-md font-semibold pl-2">Configuration Panel </h3>}

          <div className="flex items-center gap-2">

            <Icon icon="mdi:drag" width="1.4em" height="1.4em" title="Drag to move panel" />
         
            <Button
              onClick={(e) => {
                e.stopPropagation();
                isConfigPanelOpen.set(false);
              }}
              className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 transition-colors"
              aria-label="Close configuration panel"
              title="Close"
            >
              <Icon icon="mdi:close" width="1.4em" height="1.4em" title="Close" />
            </Button>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {children || <p className="text-gray-400">Your configuration options will go here.</p>}
        </div>


        <div
          className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize"
          style={{ bottom: -6, right: -6 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
        />
     
        <div
          className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize"
          style={{ bottom: -6, left: -6 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
        />
     
        <div
          className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nesw-resize"
          style={{ top: -6, right: -6 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
        />
        {}
        <div
          className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-nwse-resize"
          style={{ top: -6, left: -6 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
        />
    
        <div
          className="absolute w-2 h-full bg-blue-500 rounded-r-sm cursor-ew-resize"
          style={{ top: 0, right: -4 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
        />
     
        <div
          className="absolute w-2 h-full bg-blue-500 rounded-l-sm cursor-ew-resize"
          style={{ top: 0, left: -4 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
        />
     
        <div
          className="absolute w-full h-2 bg-blue-500 rounded-b-sm cursor-ns-resize"
          style={{ bottom: -4, left: 0 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        />
      
        <div
          className="absolute w-full h-2 bg-blue-500 rounded-t-sm cursor-ns-resize"
          style={{ top: -4, left: 0 }}
          onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        />
      </div>
    </div>
  );
}
