// src/components/motion/MotionDropdown.tsx
// For dropdown menus and context menus

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { fastTransition } from './motionConfig';

interface MotionDropdownProps extends HTMLMotionProps<'div'> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // Optional: A ref to the trigger element for dynamic positioning (e.g., context menu)
  triggerRef?: React.RefObject<HTMLElement>;
  // Positioning strategy
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center';
  // Allows overriding default variants
  variants?: {
    hidden: { opacity: number; scale: number; transition?: any };
    visible: { opacity: number; scale: number; transition?: any };
  };
}

export const MotionDropdown: React.FC<MotionDropdownProps> = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  position = 'bottom-left', // Default position
  variants,
  className = '',
  ...rest
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultVariants = variants || {
    hidden: { opacity: 0, scale: 0.9, transition: fastTransition },
    visible: { opacity: 1, scale: 1, transition: fastTransition },
  };

  // Determine transform origin for scaling based on position
  const getTransformOrigin = (): string => {
    switch (position) {
      case 'top-left':
        return 'top left';
      case 'top-right':
        return 'top right';
      case 'bottom-left':
        return 'bottom left';
      case 'bottom-right':
        return 'bottom right';
      case 'center':
        return 'center center';
      default:
        return 'top left';
    }
  };

  const handleDocumentClick = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        (!triggerRef?.current ||
          !triggerRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    },
    [onClose, triggerRef],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    } else {
      document.removeEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen, handleDocumentClick]);

  // Dynamic positioning for context menu or precise dropdown placement
  const calculatePosition = useCallback((): React.CSSProperties => {
    if (!triggerRef?.current) {
      // Default to basic positioning if no triggerRef
      switch (position) {
        case 'bottom-left':
          return { top: '100%', left: 0 };
        case 'bottom-right':
          return { top: '100%', right: 0 };
        case 'top-left':
          return { bottom: '100%', left: 0 };
        case 'top-right':
          return { bottom: '100%', right: 0 };
        case 'center':
          return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          };
      }
      return {};
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const styles: React.CSSProperties = {};

    // Basic positioning relative to viewport for context menus
    // For general dropdowns relative to trigger, it's often simpler to use CSS like `top: 100%` on a `relative` parent.
    // This example focuses on 'context menu' style positioning if triggerRef is provided.
    styles.position = 'fixed';
    styles.zIndex = 1000; // High z-index for dropdowns/context menus

    switch (position) {
      case 'bottom-left':
        styles.top = triggerRect.bottom + window.scrollY;
        styles.left = triggerRect.left + window.scrollX;
        break;
      case 'bottom-right':
        styles.top = triggerRect.bottom + window.scrollY;
        styles.left =
          triggerRect.right +
          window.scrollX -
          (dropdownRef.current?.offsetWidth || 0); // Align right
        break;
      case 'top-left':
        styles.top =
          triggerRect.top +
          window.scrollY -
          (dropdownRef.current?.offsetHeight || 0);
        styles.left = triggerRect.left + window.scrollX;
        break;
      case 'top-right':
        styles.top =
          triggerRect.top +
          window.scrollY -
          (dropdownRef.current?.offsetHeight || 0);
        styles.left =
          triggerRect.right +
          window.scrollX -
          (dropdownRef.current?.offsetWidth || 0);
        break;
      case 'center':
        styles.top =
          triggerRect.top +
          window.scrollY +
          triggerRect.height / 2 -
          (dropdownRef.current?.offsetHeight || 0) / 2;
        styles.left =
          triggerRect.left +
          window.scrollX +
          triggerRect.width / 2 -
          (dropdownRef.current?.offsetWidth || 0) / 2;
        break;
    }
    return styles;
  }, [triggerRef, position]);

  // Apply dynamic position on mount/update
  const [dynamicStyles, setDynamicStyles] = React.useState<React.CSSProperties>(
    {},
  );
  useEffect(() => {
    if (isOpen) {
      // Use a timeout to ensure the dropdown has rendered before calculating size
      const timeoutId = setTimeout(() => {
        setDynamicStyles(calculatePosition());
      }, 0); // Run after current render cycle
      return () => clearTimeout(timeoutId);
    } else {
      setDynamicStyles({}); // Reset styles when closed
    }
  }, [isOpen, calculatePosition]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={defaultVariants}
          style={{ transformOrigin: getTransformOrigin(), ...dynamicStyles }}
          className={`absolute bg-background border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50 ${className}`} // Tailwind default styles
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
