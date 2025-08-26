import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  isValidElement,
  cloneElement,
} from 'react';
import { Button } from '@/components/ui/Button';

export interface DropdownMenuContextType {
  open: boolean;
  setOpen: (value: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

export const DropdownMenu: React.FC<{
  children: ReactNode;
  className?: string;
  direction?: 'down' | 'up';
  width?: string | number;
}> = ({ children, className, direction = 'down', width }) => {
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLElement>(null);

  const [position, setPosition] = useState<React.CSSProperties>({
    top: 0,
    left: 0,
    width: 'auto',
  });

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();

    let newTop: number;
    let newLeft: number;
    const spacing = 4;

    let effectiveWidth = width;
    if (effectiveWidth === undefined || effectiveWidth === 'auto') {
      effectiveWidth = triggerRect.width;
    }
    const styleWidth = width ?? triggerRect.width;

    if (direction === 'down') {
      newTop = triggerRect.bottom + spacing;
    } else {
      newTop =
        triggerRect.top - (typeof width === 'number' ? width : 0) - spacing;
    }

    newLeft = triggerRect.left;

    const viewportWidth = window.innerWidth;

    if (
      newLeft + (typeof effectiveWidth === 'number' ? effectiveWidth : 0) >
      viewportWidth
    ) {
      newLeft = Math.min(
        newLeft,
        viewportWidth -
          (typeof effectiveWidth === 'number' ? effectiveWidth : 0) -
          spacing,
      );
    }
    newLeft = Math.max(spacing, newLeft);

    setPosition({
      top: newTop,
      left: newLeft,
      width: styleWidth,
    });
  }, [direction, width]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    if (open) {
      animationFrameId = requestAnimationFrame(calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open, calculatePosition]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {}
      <div className={`relative inline-block z-1000 ${className}`}>
        {children}
        {open && (
          <div
            className="fixed z-[1000] border border-gray-200 dark:border-gray-700
            rounded-md shadow-lg overflow-y-auto max-h-[80vh]"
            style={position}
            role="menu"
            aria-orientation="vertical"
          >
            {}
          </div>
        )}
      </div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{
  children: ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  const handleClick = (event: React.MouseEvent) => {
    ctx.setOpen(!ctx.open);
  };

  const commonProps = {
    ref: ctx.triggerRef,
    onClick: handleClick,

    'aria-haspopup': 'menu',
    'aria-expanded': ctx.open,
  };

  if (asChild) {
    if (!isValidElement(children)) {
      console.warn(
        'DropdownMenuTrigger: When `asChild` is true, its child must be a single React element. Received:',
        children,
      );

      return <>{children}</>;
    }

    const childRef = (children as any).ref;
    const mergedRef = (node: HTMLElement | null) => {
      ctx.triggerRef.current = node;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    const originalOnClick = (children as any).props?.onClick;
    const newOnClick = (event: React.MouseEvent) => {
      handleClick(event);
      if (originalOnClick) {
        originalOnClick(event);
      }
    };

    return cloneElement(children, {
      ...commonProps,
      ref: mergedRef,
      onClick: newOnClick,
    });
  }

  return (
    <button {...commonProps} className="focus:outline-none">
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error('DropdownMenuContent must be used within DropdownMenu');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        ctx.triggerRef.current &&
        !ctx.triggerRef.current.contains(event.target as Node)
      ) {
        ctx.setOpen(false);
      }
    };

    if (ctx.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ctx]);

  if (!ctx.open) return null;

  return <>{children}</>;
};

export const DropdownMenuItem: React.FC<{
  children: ReactNode;
  onSelect?: () => void;
}> = ({ children, onSelect }) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error('DropdownMenuItem must be used within DropdownMenu');

  const handleClick = () => {
    if (onSelect) onSelect();
    ctx.setOpen(false);
  };

  return (
    <Button
      onClick={handleClick}
      role="menuitem"
      className="w-full text-left px-4 py-4 justify-start"
    >
      {children}
    </Button>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div role="separator" className="my-1 h-px bg-border" />;
};
