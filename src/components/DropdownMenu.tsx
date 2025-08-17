import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  CSSProperties,
  JSX,
} from 'react';

/**
 * Props for the DropdownMenu component.
 * @interface DropdownMenuProps
 */
interface DropdownMenuProps {
  /**
   * A render prop that receives the dropdown's state and a ref for the trigger element.
   * @param {object} props - The properties for the trigger.
   * @param {boolean} props.isOpen - Whether the dropdown is currently open.
   * @param {() => void} props.toggle - Function to toggle the dropdown's open state.
   * @param {React.RefObject<HTMLButtonElement>} props.ref - Ref to be attached to the trigger element.
   * @returns {ReactNode} The JSX for the trigger element.
   */
  trigger: (props: {
    isOpen: boolean;
    toggle: () => void;
    ref: React.RefObject<HTMLButtonElement>;
  }) => ReactNode;
  /**
   * The content to be rendered inside the dropdown menu.
   * @type {ReactNode}
   */
  children: ReactNode;
  /**
   * Optional CSS class names to apply to the dropdown container.
   * @type {string}
   * @default ''
   */
  className?: string;
  /**
   * The direction in which the dropdown menu should open relative to the trigger.
   * 'down' opens below, 'up' opens above.
   * @type {'down' | 'up'}
   * @default 'down'
   */
  direction?: 'down' | 'up';
  /**
   * The width of the dropdown menu. Can be a CSS string (e.g., '300px', '50%')
   * or a number (interpreted as pixels). If not provided, it defaults to the trigger's width.
   * @type {string | number}
   */
  width?: string | number;
  /**
   * Controls the open state of the dropdown. If provided, the component becomes controlled.
   * @type {boolean}
   * @optional
   */
  isOpen?: boolean;
  /**
   * Callback fired when the open state changes.
   * Only applicable when `isOpen` prop is provided (controlled component).
   * @param {boolean} newIsOpen - The new open state.
   * @optional
   */
  onOpenChange?: (newIsOpen: boolean) => void;
}

/**
 * A reusable React component for creating a dropdown menu with dynamic positioning.
 * It handles opening/closing, positioning relative to a trigger, and closing on outside clicks.
 *
 * @param {DropdownMenuProps} props - The properties for the DropdownMenu.
 * @returns {JSX.Element} The DropdownMenu component.
 */
export function DropdownMenu({
  trigger,
  children,
  className = '',
  direction = 'down',
  width,
  // New props for controlled component pattern
  isOpen: controlledIsOpen, // Renamed to avoid conflict with internal state
  onOpenChange,
}: DropdownMenuProps): JSX.Element {
  // Determine if the component is controlled by parent props or manages its own state
  const isControlled = controlledIsOpen !== undefined;

  // Internal state for uncontrolled mode. In controlled mode, this is ignored.
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // The effective 'isOpen' state, either from props (controlled) or internal state (uncontrolled)
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({
    top: 0,
    left: 0,
    width: 'auto',
  });

  /**
   * Calculates and sets the CSS position (top, left, width) for the dropdown menu.
   * This function ensures the dropdown is correctly placed relative to its trigger
   * and stays within the viewport boundaries.
   */
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();

    let newTop: number;
    let newLeft: number;
    const spacing = 4;

    const effectiveWidthForCalc = typeof width === 'number' ? width : dropdownRect.width;
    const styleWidth = width ?? triggerRect.width;

    if (direction === 'down') {
      newTop = triggerRect.bottom + spacing;
    } else {
      newTop = triggerRect.top - dropdownRect.height - spacing;
    }

    newLeft = triggerRect.left;

    const viewportWidth = window.innerWidth;

    if (newLeft + effectiveWidthForCalc > viewportWidth) {
      newLeft = Math.min(newLeft, viewportWidth - effectiveWidthForCalc - spacing);
    }
    newLeft = Math.max(spacing, newLeft);

    setPosition({
      top: newTop,
      left: newLeft,
      width: styleWidth,
    });
  }, [direction, width]);

  /**
   * Toggles the dropdown's open/close state.
   * In controlled mode, it calls onOpenChange. In uncontrolled, it updates internal state.
   */
  const toggle = useCallback(() => {
    if (isControlled && onOpenChange) {
      // Controlled: let parent handle the state change
      onOpenChange(!isOpen);
    } else {
      // Uncontrolled: update internal state
      setInternalIsOpen((prev) => !prev);
    }
  }, [isOpen, isControlled, onOpenChange]); // Depend on effective isOpen, controlled status, and onOpenChange

  /**
   * Effect for handling clicks outside the dropdown to close it.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if currently open and the click is outside the container
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        toggle(); // Use the unified toggle function
      }
    };

    // Add listener only when the menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggle]); // Depend on isOpen and toggle (which is stable due to useCallback)

  /**
   * Effect for calculating and updating the dropdown's position when it opens or window resizes.
   */
  useEffect(() => {
    let animationFrameId: number | null = null;

    if (isOpen) {
      // Use requestAnimationFrame to ensure dropdown dimensions are ready before calculating position
      animationFrameId = requestAnimationFrame(calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, calculatePosition]); // Depend on the effective isOpen state and calculatePosition

  return (
    <div className={`relative z-1000 ${className}`} ref={containerRef}>
      {trigger({ isOpen, toggle, ref: triggerRef })}

      {isOpen && (
        <div
          className='
            dropdown-menu
            fixed z-[1000] border border-gray-200 dark:border-gray-700
            rounded-md shadow-lg overflow-y-auto max-h-[80vh]
          '
          style={position}
          ref={dropdownRef}
          role='menu'
          aria-orientation='vertical'
        >
          {children}
        </div>
      )}
    </div>
  );
}
