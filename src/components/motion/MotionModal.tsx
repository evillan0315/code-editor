// src/components/motion/MotionModal.tsx (Provided in the prompt, no changes needed)
import React, { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import {
  defaultTransition,
  fastTransition,
} from "@/components/motion/motionConfig";

interface MotionModalProps extends HTMLMotionProps<"div"> {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
  zIndex?: number; // For controlling stacking context
}

export const MotionModal: React.FC<MotionModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  overlayClassName = "",
  contentClassName = "",
  zIndex = 1000, // Default high z-index
  ...rest
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0, transition: { ...fastTransition, duration: 0.2 } },
    visible: { opacity: 1, transition: { ...fastTransition, duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { y: -50, opacity: 0, scale: 0.95, transition: defaultTransition },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { ...defaultTransition, delay: 0.1 },
    }, // Slight delay for pop-in after overlay
  };

  // Close on Escape key press
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && onClose && closeOnEscape) {
        onClose();
      }
    },
    [isOpen, onClose, closeOnEscape],
  );

  // Click outside to close (on overlay)
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (
        closeOnOverlayClick &&
        onClose &&
        event.target === event.currentTarget
      ) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent body scroll
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = ""; // Restore body scroll
    }

    return () => {
      document.body.style.overflow = ""; // Ensure cleanup on unmount
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 flex items-center justify-center p-4 ${overlayClassName}`}
          style={{ zIndex, backgroundColor: "rgba(0, 0, 0, 0.5)" }} // Default overlay style
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          onClick={handleOverlayClick}
          {...rest}
        >
          <motion.div
            ref={contentRef}
            className={`bg-background rounded-lg shadow-xl relative ${contentClassName}`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent clicks on content from closing modal
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
