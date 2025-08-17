import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  isValidElement, // Import to check if children is a valid React element
  cloneElement, // Import to clone and modify children props
} from "react";
import { Button } from "@/components/ui/Button";
/**
 * Type definition for the DropdownMenu context.
 * The triggerRef type is broadened to HTMLElement to support any trigger element when `asChild` is true.
 */
export interface DropdownMenuContextType {
  open: boolean;
  setOpen: (value: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Context for DropdownMenu components to share state and references.
 */
const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

/**
 * DropdownMenu component provides the context for its children (Trigger, Content, etc.).
 * It manages the open/closed state of the dropdown.
 */
export const DropdownMenu: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  // Ref to the element that triggers the dropdown (button, div, etc.)
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {/* A relative container to position the dropdown content */}
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

/**
 * DropdownMenuTrigger component.
 * This component is responsible for toggling the dropdown's visibility.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - The element(s) to be rendered inside or as the trigger.
 * @param {boolean} [props.asChild] - If true, the trigger's props are merged into its child,
 *                                    preventing it from rendering its own wrapper element.
 */
export const DropdownMenuTrigger: React.FC<{
  children: ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  // Handler for opening/closing the dropdown
  const handleClick = (event: React.MouseEvent) => {
    ctx.setOpen(!ctx.open);
  };

  // Common props for the trigger element, whether it's a native button or a cloned child
  const commonProps = {
    ref: ctx.triggerRef,
    onClick: handleClick,
    // ARIA attributes for accessibility:
    // aria-haspopup="menu" indicates it triggers a menu.
    // aria-expanded reflects the current open state.
    "aria-haspopup": "menu",
    "aria-expanded": ctx.open,
  };

  // If asChild is true, clone the child and inject trigger props
  if (asChild) {
    if (!isValidElement(children)) {
      // Warn if asChild is true but children is not a single React element.
      // This makes the `asChild` pattern ineffective.
      console.warn(
        "DropdownMenuTrigger: When `asChild` is true, its child must be a single React element. Received:",
        children,
      );
      // Fallback: Render children as is, but it won't receive trigger functionality.
      return <>{children}</>;
    }

    // Merge refs: Combine the original child's ref with our context ref.
    // This ensures both refs receive the DOM node.
    const childRef = (children as any).ref;
    const mergedRef = (node: HTMLElement | null) => {
      ctx.triggerRef.current = node;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    // Compose onClick: Call our trigger logic AND the original child's onClick handler.
    const originalOnClick = (children as any).props?.onClick;
    const newOnClick = (event: React.MouseEvent) => {
      handleClick(event); // Our click logic (toggle dropdown)
      if (originalOnClick) {
        originalOnClick(event); // Call original click handler if it exists
      }
    };

    // Clone the child element and apply our trigger props.
    // The ref and onClick are explicitly overridden to ensure proper merging.
    return cloneElement(children, {
      ...commonProps,
      ref: mergedRef,
      onClick: newOnClick,
    });
  }

  // Default behavior: Render a native button element.
  return (
    <button
      {...commonProps} // Apply all common trigger props
      className="focus:outline-none" // Tailwind class for no default focus outline
    >
      {children}
    </button>
  );
};

/**
 * DropdownMenuContent component displays the actual dropdown menu items.
 * It is conditionally rendered based on the 'open' state from the context.
 */
export const DropdownMenuContent: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error("DropdownMenuContent must be used within DropdownMenu");

  const menuRef = useRef<HTMLDivElement>(null);

  // Effect to close the dropdown when clicking outside of it or its trigger.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click occurred outside the menu content AND outside the trigger.
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
      // Add event listener only when dropdown is open
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ctx]); // Dependency array ensures effect re-runs if context changes.

  // Don't render content if dropdown is closed.
  if (!ctx.open) return null;

  return (
    <div
      ref={menuRef}
      role="menu" // ARIA role for a menu, indicating it's a list of choices.
      className="dropdown-menu absolute right-0 mt-2 w-80 max-w-90 rounded-md shadow-lg bg-secondary border z-50" // Tailwind classes for styling
    >
      {children}
    </div>
  );
};

/**
 * DropdownMenuItem component represents a single item within the dropdown menu.
 */
export const DropdownMenuItem: React.FC<{
  children: ReactNode;
  onSelect?: () => void; // Optional callback when the item is selected
}> = ({ children, onSelect }) => {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error("DropdownMenuItem must be used within DropdownMenu");

  const handleClick = () => {
    if (onSelect) onSelect();
    ctx.setOpen(false); // Close the dropdown after an item is selected
  };

  return (
    <Button
      onClick={handleClick}
      role="menuitem" // ARIA role for a menu item.
      className="w-full text-left px-4 py-4 justify-start" // Tailwind classes for styling and focus
    >
      {children}
    </Button>
  );
};

/**
 * A visual separator for dropdown menu items, enhancing readability.
 */
export const DropdownMenuSeparator: React.FC = () => {
  return <div role="separator" className="my-1 h-px bg-border" />; // ARIA role for a separator.
};
