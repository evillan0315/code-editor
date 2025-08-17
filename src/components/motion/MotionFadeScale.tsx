// src/components/motion/MotionFadeScale.tsx
// For toggles, general show/hide elements, alerts

import React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { defaultTransition } from "./motionConfig";

interface MotionFadeScaleProps extends HTMLMotionProps<"div"> {
  isVisible: boolean;
  children: React.ReactNode;
  duration?: number;
  initialScale?: number;
  // Allows overriding default variants
  variants?: {
    hidden: { opacity: number; scale: number; transition?: any };
    visible: { opacity: number; scale: number; transition?: any };
  };
}

export const MotionFadeScale: React.FC<MotionFadeScaleProps> = ({
  isVisible,
  children,
  duration = defaultTransition.duration,
  initialScale = 0.95, // Slightly smaller initially for a subtle pop
  variants,
  ...rest
}) => {
  const defaultVariants = variants || {
    hidden: {
      opacity: 0,
      scale: initialScale,
      transition: { duration, ease: defaultTransition.ease },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration, ease: defaultTransition.ease },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={defaultVariants}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
