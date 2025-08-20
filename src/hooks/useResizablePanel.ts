import { useState, useRef, useCallback } from 'react';

type ResizeOrientation = 'horizontal' | 'vertical';

type ResizeAnchor = 'left' | 'right' | 'bottom' | 'bottom-to-top' | 'top-to-bottom';

interface UseResizablePanelOptions {
  localStorageKey: string;

  initialTargetPercentage: number;

  minPx: number;

  maxDynamicConstraintPercentage?: number;

  parentRef?: React.RefObject<HTMLElement>;

  orientation: ResizeOrientation;

  anchor: ResizeAnchor;
}

const getInitialOrStoredDimension = (
  key: string,
  targetPercentage: number,
  minPx: number,
  isHeight: boolean,
): number => {
  const stored = localStorage.getItem(key);

  const currentWindowDimension =
    typeof window !== 'undefined' ? (isHeight ? window.innerHeight : window.innerWidth) : 0;

  if (stored) {
    return Math.max(parseInt(stored, 10), minPx);
  } else {
    const calculatedDimension = currentWindowDimension * targetPercentage;
    return Math.max(calculatedDimension, minPx);
  }
};

export function useResizablePanel({
  localStorageKey,
  initialTargetPercentage,
  minPx,
  maxDynamicConstraintPercentage,
  parentRef,
  orientation,
  anchor,
}: UseResizablePanelOptions) {
  const isHeight = orientation === 'vertical';

  const [dimension, setDimension] = useState<number>(() =>
    getInitialOrStoredDimension(localStorageKey, initialTargetPercentage, minPx, isHeight),
  );

  const isResizing = useRef(false);
  const initialMousePosition = useRef({ x: 0, y: 0 });
  const initialDimension = useRef(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      let newDimension = initialDimension.current;
      const deltaX = e.clientX - initialMousePosition.current.x;
      const deltaY = e.clientY - initialMousePosition.current.y;

      if (orientation === 'horizontal') {
        if (anchor === 'left') {
          newDimension = initialDimension.current + deltaX;
        } else if (anchor === 'right') {
          newDimension = initialDimension.current - deltaX;
        }
      } else {
        if (anchor === 'bottom') {
          newDimension = initialDimension.current - deltaY;
        } else if (anchor === 'bottom-to-top') {
          newDimension = initialDimension.current - deltaY;
        } else if (anchor === 'top-to-bottom') {
          newDimension = initialDimension.current + deltaY;
        }
      }

      newDimension = Math.max(newDimension, minPx);

      let maxDimensionConstraint: number | null = null;
      if (maxDynamicConstraintPercentage !== undefined) {
        maxDimensionConstraint = isHeight
          ? window.innerHeight * maxDynamicConstraintPercentage
          : window.innerWidth * maxDynamicConstraintPercentage;
      } else if (parentRef?.current) {
        const parentRect = parentRef.current.getBoundingClientRect();
        const totalParentDimension = isHeight ? parentRect.height : parentRect.width;

        if (totalParentDimension > 0) {
          maxDimensionConstraint = totalParentDimension - minPx;
        }
      }

      if (maxDimensionConstraint !== null) {
        newDimension = Math.min(newDimension, maxDimensionConstraint);
      }

      if (Math.abs(dimension - newDimension) > 0.5) {
        setDimension(newDimension);
        localStorage.setItem(localStorageKey, `${newDimension}`);
      }
    },
    [
      localStorageKey,
      minPx,
      maxDynamicConstraintPercentage,
      parentRef,
      orientation,
      anchor,
      isHeight,
      dimension,
    ],
  );

  

  const stopResize = useCallback(() => {
    isResizing.current = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopResize);
  }, [handleMouseMove]);
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      initialMousePosition.current = { x: e.clientX, y: e.clientY };
      initialDimension.current = dimension;

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResize);
    },
    [dimension, handleMouseMove, stopResize],
  );
  return { dimension, startResize };
}
