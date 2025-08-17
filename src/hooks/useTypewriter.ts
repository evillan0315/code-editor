// hooks/useTypewriter.ts
import { useState, useEffect, useRef } from "react";

/**
 * Options for the useTypewriter hook.
 */
interface UseTypewriterOptions {
  /** Speed of typing in milliseconds per character. Defaults to 20ms. */
  speed?: number;
  /** Callback fired with the current text after each character is typed. */
  onType?: (currentText: string) => void;
  /** Callback fired when the typing animation is complete. */
  onComplete?: () => void;
}

/**
 * A custom hook to simulate a typewriter effect for a given text.
 *
 * @param text The full text to display with the typewriter effect.
 * @param enabled If true, the typewriter effect will run. If false, the full text is displayed immediately.
 * @param options Configuration options for the typewriter effect.
 * @returns The currently displayed portion of the text.
 */
const useTypewriter = (
  text: string,
  enabled: boolean = true,
  options?: UseTypewriterOptions,
): string => {
  const { speed = 10, onType, onComplete } = options || {};
  const [displayedText, setDisplayedText] = useState("");
  const currentIndexRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true); // Ref to check if the component is mounted

  // Effect to manage component mount/unmount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Clear any pending timeout on unmount
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []); // Run only once on mount

  // Effect to control the typewriter animation
  useEffect(() => {
    // console.log('Typewriter useEffect triggered. Text length:', text.length, 'Enabled:', enabled);

    // If typing is disabled or speed is invalid, display full text immediately
    if (!enabled || speed <= 0) {
      setDisplayedText(text);
      // console.log('Typewriter disabled or speed invalid. Displaying full text:', text);
      onComplete?.(); // Trigger completion callback
      return;
    }

    // Reset state for new text or when effect settings change
    // This is the critical line to ensure `displayedText` starts as an empty string.
    setDisplayedText("");
    currentIndexRef.current = 0; // Ensure index starts at 0
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null; // Clear previous timeout reference
    }

    const typeChar = () => {
      if (!isMounted.current) {
        // console.log('Typewriter: Component unmounted, stopping typeChar.');
        return;
      }

      // Check if we have more characters to type
      if (currentIndexRef.current < text.length) {
        const charToAdd = text[currentIndexRef.current];
        // console.log(`Typing: index=${currentIndexRef.current}, char='${charToAdd}', text length=${text.length}`);

        setDisplayedText((prev) => {
          // console.log(`  Inside setDisplayedText callback: prev='${prev}', charToAdd='${charToAdd}'`);
          const newText = prev + charToAdd;
          // console.log(`  New displayedText='${newText}'`);
          onType?.(newText); // Trigger onType callback
          return newText;
        });

        currentIndexRef.current++; // Move to the next character
        timeoutIdRef.current = setTimeout(typeChar, speed); // Schedule the next character
      } else {
        // Typing is complete
        // console.log('Typewriter: Typing complete.');
        onComplete?.(); // Trigger onComplete callback
      }
    };

    typeChar(); // Start the typing effect immediately

    // Cleanup function for the effect: clear timeout if dependencies change or component unmounts
    return () => {
      // console.log('Typewriter cleanup initiated.');
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [text, enabled, speed, onType, onComplete]); // Dependencies: re-run effect if these change

  return displayedText;
};

export default useTypewriter;
