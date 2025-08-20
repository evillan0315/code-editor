// hooks/useTypewriter.ts
import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  speed?: number;

  onType?: (currentText: string) => void;

  onComplete?: () => void;
}

const useTypewriter = (
  text: string,
  enabled: boolean = true,
  options?: UseTypewriterOptions,
): string => {
  const { speed = 10, onType, onComplete } = options || {};
  const [displayedText, setDisplayedText] = useState('');
  const currentIndexRef = useRef(0);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || speed <= 0) {
      setDisplayedText(text);

      onComplete?.();
      return;
    }

    setDisplayedText('');
    currentIndexRef.current = 0;
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    const typeChar = () => {
      if (!isMounted.current) {
        return;
      }

      if (currentIndexRef.current < text.length) {
        const charToAdd = text[currentIndexRef.current];

        setDisplayedText((prev) => {
          const newText = prev + charToAdd;

          onType?.(newText);
          return newText;
        });

        currentIndexRef.current++;
        timeoutIdRef.current = setTimeout(typeChar, speed);
      } else {
        onComplete?.();
      }
    };

    typeChar();

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [text, enabled, speed, onType, onComplete]);

  return displayedText;
};

export default useTypewriter;
