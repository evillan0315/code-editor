import { useState, useRef, useCallback } from "react";

/**
 * Defines the type of resizing operation.
 * 'horizontal': Width changes based on horizontal mouse movement.
 * 'vertical': Height changes based on vertical mouse movement.
 */
type ResizeOrientation = "horizontal" | "vertical";

/**
 * Defines how the dimension is calculated based on mouse movement relative to the anchor point.
 * - 'left': Dimension increases when mouse moves right (e.g., left sidebar width).
 * - 'right': Dimension increases when mouse moves left (e.g., right sidebar width).
 * - 'bottom': Dimension increases when mouse moves up (e.g., terminal height resized from its top edge).
 * - 'bottom-to-top': Dimension increases when mouse moves up (e.g., bottom panel height resized from its top edge, where the resizer is above it).
 * - 'top-to-bottom': Dimension increases when mouse moves down (e.g., a panel resized from its bottom edge, where the resizer is below it).
 */
type ResizeAnchor =
  | "left"
  | "right"
  | "bottom"
  | "bottom-to-top"
  | "top-to-bottom";

interface UseResizablePanelOptions {
  /** A unique key for localStorage to persist the dimension. */
  localStorageKey: string;
  /** The target percentage of the window dimension for initial calculation if no stored value exists. */
  initialTargetPercentage: number;
  /** The absolute minimum pixel dimension allowed for the panel. */
  minPx: number;
  /**
   * Optional percentage for dynamic maximum constraint, relative to window dimension.
   * Used for top-level panels like sidebars or terminal (e.g., MAX_LEFT_PERCENTAGE_CONSTRAINT).
   * If provided, the panel's dimension will not exceed this percentage of the window's current dimension.
   * For inner panels (e.g., sidebar bottom panel), the max constraint is derived from `parentRef`
   * to ensure the sibling panel also respects `minPx`.
   */
  maxDynamicConstraintPercentage?: number;
  /**
   * Optional ref to the parent HTML element.
   * Required for panels whose dimension is relative to a parent (e.g., inner sidebar panels).
   * Used to calculate `totalParentDimension` for dynamic max constraints, ensuring siblings meet `minPx`.
   */
  parentRef?: React.RefObject<HTMLElement>;
  /** The orientation of the resize operation ('horizontal' for width, 'vertical' for height). */
  orientation: ResizeOrientation;
  /** The anchor point for calculating dimension changes relative to mouse movement. */
  anchor: ResizeAnchor;
}

/**
 * Helper function to determine the initial dimension (width or height) for a component.
 * It prioritizes a stored pixel dimension from localStorage. If no dimension is stored,
 * it calculates an initial dimension based on a target percentage of the current window dimension.
 *
 * @param key The localStorage key to retrieve or store the dimension.
 * @param targetPercentage The desired initial percentage of the window dimension if no stored value exists.
 * @param minPx The absolute minimum pixel dimension allowed.
 * @param isHeight A boolean indicating if this is a height (uses innerHeight) or width (uses innerWidth).
 * @returns The calculated or retrieved dimension in pixels, constrained by min pixel value.
 */
const getInitialOrStoredDimension = (
  key: string,
  targetPercentage: number,
  minPx: number,
  isHeight: boolean,
): number => {
  const stored = localStorage.getItem(key);
  // Ensure window is defined (for SSR safety, though this is a client-side hook)
  const currentWindowDimension =
    typeof window !== "undefined"
      ? isHeight
        ? window.innerHeight
        : window.innerWidth
      : 0;

  if (stored) {
    return Math.max(parseInt(stored, 10), minPx);
  } else {
    const calculatedDimension = currentWindowDimension * targetPercentage;
    return Math.max(calculatedDimension, minPx);
  }
};

/**
 * A React hook for managing the dimensions of a resizable panel.
 * It handles initial dimension calculation, user-driven resizing via mouse events,
 * applying min/max constraints, and persisting dimensions to localStorage.
 *
 * @param {UseResizablePanelOptions} options - Configuration for the resizable panel.
 * @returns {{ dimension: number, startResize: (e: React.MouseEvent) => void }}
 *          An object containing the current dimension and a function to initiate resizing.
 */
export function useResizablePanel({
  localStorageKey,
  initialTargetPercentage,
  minPx,
  maxDynamicConstraintPercentage,
  parentRef,
  orientation,
  anchor,
}: UseResizablePanelOptions) {
  const isHeight = orientation === "vertical";

  // State to hold the current dimension of the panel
  const [dimension, setDimension] = useState<number>(() =>
    getInitialOrStoredDimension(
      localStorageKey,
      initialTargetPercentage,
      minPx,
      isHeight,
    ),
  );

  // Refs to store transient state during a resize operation
  const isResizing = useRef(false);
  const initialMousePosition = useRef({ x: 0, y: 0 }); // Mouse position when resize started
  const initialDimension = useRef(0); // Panel dimension when resize started

  /**
   * Handles the mouse movement during a resize operation.
   * Calculates the new dimension based on mouse position, applies constraints,
   * and updates the state and localStorage.
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;

      let newDimension = initialDimension.current;
      const deltaX = e.clientX - initialMousePosition.current.x;
      const deltaY = e.clientY - initialMousePosition.current.y;

      // Calculate the base new dimension based on orientation and anchor point
      if (orientation === "horizontal") {
        if (anchor === "left") {
          // e.g., Left sidebar (increases when mouse moves right)
          newDimension = initialDimension.current + deltaX;
        } else if (anchor === "right") {
          // e.g., Right sidebar (increases when mouse moves left)
          newDimension = initialDimension.current - deltaX;
        }
      } else {
        // vertical
        if (anchor === "bottom") {
          // e.g., Terminal (resizer is above, increases height when mouse moves up)
          newDimension = initialDimension.current - deltaY;
        } else if (anchor === "bottom-to-top") {
          // e.g., Sidebar bottom panels (resizer is above, increases height when mouse moves up)
          newDimension = initialDimension.current - deltaY;
        } else if (anchor === "top-to-bottom") {
          // e.g., A panel resized from its bottom edge (increases height when mouse moves down)
          newDimension = initialDimension.current + deltaY;
        }
      }

      // Apply minimum dimension constraint
      newDimension = Math.max(newDimension, minPx);

      // Apply dynamic maximum constraint based on context (window or parent)
      let maxDimensionConstraint: number | null = null;
      if (maxDynamicConstraintPercentage !== undefined) {
        // For window-relative panels
        maxDimensionConstraint = isHeight
          ? window.innerHeight * maxDynamicConstraintPercentage
          : window.innerWidth * maxDynamicConstraintPercentage;
      } else if (parentRef?.current) {
        // For parent-relative panels (e.g., inner sidebar panels)
        const parentRect = parentRef.current.getBoundingClientRect();
        const totalParentDimension = isHeight
          ? parentRect.height
          : parentRect.width;

        // The maximum for this panel ensures the *remaining* space (e.g., top panel)
        // also meets its minimum dimension requirement (minPx in this context refers to the sibling's min).
        if (totalParentDimension > 0) {
          maxDimensionConstraint = totalParentDimension - minPx; // Ensure the *other* pane has at least minPx
        }
      }

      if (maxDimensionConstraint !== null) {
        newDimension = Math.min(newDimension, maxDimensionConstraint);
      }

      // Update state and localStorage only if the dimension has changed significantly
      // (e.g., by at least half a pixel) to prevent unnecessary re-renders.
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
      dimension, // Include current dimension in dependencies to ensure `Math.abs` uses the latest value
    ],
  );

  /**
   * Initiates the resize operation. Records initial mouse position and panel dimension,
   * then adds global mouse event listeners to the window.
   * @param e The React mouse event from the resizer element.
   */
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent default browser behaviors like text selection
      isResizing.current = true;
      initialMousePosition.current = { x: e.clientX, y: e.clientY };
      initialDimension.current = dimension; // Capture the current dimension at the start of drag

      // Attach global event listeners to the window to track mouse movement
      // even if it leaves the resizer element.
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResize);
    },
    [dimension, handleMouseMove],
  );

  /**
   * Stops the resize operation. Removes the global mouse event listeners.
   */
  const stopResize = useCallback(() => {
    isResizing.current = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopResize);
  }, [handleMouseMove]); // handleMouseMove is a useCallback, so it's stable.

  // No need for a main useEffect with cleanup here because the global listeners
  // are dynamically added and removed by startResize and stopResize functions.

  return { dimension, startResize };
}
