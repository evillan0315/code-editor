// src/components/Typewriter.tsx
import React, { useState, useEffect, useRef, memo } from "react";

/**
 * Props for the Typewriter component.
 */
interface TypewriterProps {
  /** The full text string to be animated. */
  text: string;
  /**
   * Optional. The delay in milliseconds between each character being typed.
   * Defaults to 50ms.
   */
  speed?: number;
  /**
   * Optional. An initial delay in milliseconds before the typing animation starts.
   * Defaults to 0ms.
   */
  delay?: number;
  /**
   * Optional. A callback function that is called when the typing animation completes.
   */
  onComplete?: () => void;
  /**
   * Optional. If true, a blinking cursor will be displayed at the end of the text
   * during and after typing. Defaults to false.
   */
  cursor?: boolean;
  /**
   * Optional. Additional CSS class names for the container div.
   */
  className?: string;
}

/**
 * A React component that animates text with a typewriter effect.
 *
 * @param {TypewriterProps} props - The properties for the component.
 * @returns {JSX.Element} The animated text.
 */
const Typewriter: React.FC<TypewriterProps> = memo(
  ({ text, speed = 50, delay = 0, onComplete, cursor = false, className }) => {
    const [displayedText, setDisplayedText] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(true);
    const currentIndexRef = useRef<number>(0);
    // Use NodeJS.Timeout for timer types, as they are returned by setInterval/setTimeout
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      // Clear any existing timers to prevent multiple intervals running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null; // Clear ref after clearing interval
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null; // Clear ref after clearing timeout
      }

      setDisplayedText(""); // Reset displayed text for new animation
      currentIndexRef.current = 0; // Reset typing progress
      setIsTyping(true); // Start as typing

      if (!text) {
        // If text is empty, no typing is needed. Set completed state.
        setIsTyping(false);
        onComplete?.();
        return;
      }

      const startTyping = () => {
        intervalRef.current = setInterval(() => {
          if (currentIndexRef.current < text.length) {
            setDisplayedText((prev) => prev + text[currentIndexRef.current]);
            currentIndexRef.current++;
          } else {
            // Typing is complete
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsTyping(false);
            onComplete?.(); // Call the onComplete callback
          }
        }, speed);
      };

      // Apply initial delay before starting the typing animation
      if (delay > 0) {
        timeoutRef.current = setTimeout(startTyping, delay);
      } else {
        startTyping(); // Start immediately if no delay
      }

      // Cleanup function: runs on unmount or before re-running the effect
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        // Ensure state is clean on unmount or re-render
        setIsTyping(false);
        setDisplayedText(text); // Optionally show full text instantly on unmount
      };
    }, [text, speed, delay, onComplete]); // Dependencies for re-running the effect

    return (
      <span className={className}>
        {displayedText}
        {cursor &&
          isTyping && ( // Cursor blinks only while typing
            <span className="typewriter-cursor">|</span>
          )}
        {cursor &&
          !isTyping &&
          displayedText.length > 0 && ( // Cursor is static after typing for non-empty text
            <span className="typewriter-cursor-static">|</span>
          )}
      </span>
    );
  },
);

Typewriter.displayName = "Typewriter";
export default Typewriter;
