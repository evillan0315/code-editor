// src/components/motion/MotionSlidePanel.tsx (UPDATED)

import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { defaultTransition } from './motionConfig';

type SlideSide = 'left' | 'right' | 'top' | 'bottom';

interface MotionSlidePanelProps extends HTMLMotionProps<'div'> {
  isVisible: boolean;
  children: React.ReactNode;
  side?: SlideSide; // Default to 'left'
  duration?: number;
  // New prop: The actual dimension value (width/height) from your resizable hook
  // This will be the `animate` value for the dimension.
  dimensionValue?: string | number;
  // Allows overriding default variants
  variants?: {
    hidden: {
      x?: string | number;
      y?: string | number;
      width?: string | number;
      height?: string | number;
      opacity?: number;
      transition?: any;
    };
    visible: {
      x?: string | number;
      y?: string | number;
      width?: string | number;
      height?: string | number;
      opacity?: number;
      transition?: any;
    };
  };
  // Prop to control if the panel should push content or overlay
  mode?: 'push' | 'overlay';
}

export const MotionSlidePanel: React.FC<MotionSlidePanelProps> = ({
  isVisible,
  children,
  side = 'left',
  duration = defaultTransition.duration,
  dimensionValue, // The width/height from useResizablePanel
  variants,
  className = '',
  mode = 'push', // Default to push
  ...rest
}) => {
  // Determine initial/exit properties based on side and mode
  const getHiddenProperties = (): {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    height?: string | number;
    opacity?: number;
  } => {
    const hiddenState: {
      x?: string | number;
      y?: string | number;
      width?: string | number;
      height?: string | number;
      opacity?: number;
    } = { opacity: 0 };
    if (mode === 'push') {
      if (side === 'left' || side === 'right') {
        hiddenState.width = 0; // Animate width for horizontal push
        hiddenState.x = 0; // x should be 0 as it's not sliding on its own plane
      } else {
        // top or bottom
        hiddenState.height = 0; // Animate height for vertical push
        hiddenState.y = 0;
      }
    } else {
      // overlay mode
      if (side === 'left') hiddenState.x = '-100%';
      else if (side === 'right') hiddenState.x = '100%';
      else if (side === 'top') hiddenState.y = '-100%';
      else if (side === 'bottom') hiddenState.y = '100%';
    }
    return hiddenState;
  };

  const getVisibleProperties = (): {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    height?: string | number;
    opacity?: number;
  } => {
    const visibleState: {
      x?: string | number;
      y?: string | number;
      width?: string | number;
      height?: string | number;
      opacity?: number;
    } = { opacity: 1 };
    if (mode === 'push') {
      if (side === 'left' || side === 'right') {
        visibleState.width = dimensionValue || 'auto'; // Use resizable dimension or auto
      } else {
        // top or bottom
        visibleState.height = dimensionValue || 'auto';
      }
      visibleState.x = 0; // Ensure no x/y offset when visible
      visibleState.y = 0;
    } else {
      // overlay mode
      visibleState.x = 0;
      visibleState.y = 0;
    }
    return visibleState;
  };

  const defaultVariants = variants || {
    hidden: {
      ...getHiddenProperties(),
      transition: { duration, ease: defaultTransition.ease },
    },
    visible: {
      ...getVisibleProperties(),
      transition: { duration, ease: defaultTransition.ease },
    },
  };

  // Ensure necessary styles for 'overlay' mode
  const panelOverlayStyles: React.CSSProperties =
    mode === 'overlay'
      ? {
          position: 'fixed', // Or 'absolute' if parent is relative and constrained
          height: side === 'left' || side === 'right' ? '100%' : undefined,
          width: side === 'top' || side === 'bottom' ? '100%' : undefined,
          // Setting these to 0 initially for the slide animation
          left: side === 'right' ? 'auto' : 0,
          right: side === 'left' ? 'auto' : 0,
          top: side === 'bottom' ? 'auto' : 0,
          bottom: side === 'top' ? 'auto' : 0,
        }
      : {};

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={defaultVariants}
          className={`${className} ${mode === 'push' ? 'flex-shrink-0' : ''}`} // Add flex-shrink-0 for push mode
          style={{ ...panelOverlayStyles }}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
