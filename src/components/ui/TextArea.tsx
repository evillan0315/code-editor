// src/components/ui/textarea.tsx
import * as React from "react";
import { cn } from "@/utils/classNames"; // Assuming you have a utility for conditionally joining class names

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number; // Optional prop to limit auto-resizing
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, maxRows, ...props }, ref) => {
    // Internal ref to manage auto-resizing, if no external ref is provided
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    // Use the passed ref if it exists, otherwise use the internal ref
    const textAreaRef = (ref ||
      internalRef) as React.MutableRefObject<HTMLTextAreaElement | null>;

    // Auto-resizing logic
    React.useEffect(() => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto"; // Reset height
        let newHeight = textAreaRef.current.scrollHeight;

        // Apply maxRows if provided
        if (maxRows) {
          // Calculate the height of a single line for comparison
          const singleLineHeight =
            textAreaRef.current.clientHeight / textAreaRef.current.rows;
          const maxHeight = singleLineHeight * maxRows;
          newHeight = Math.min(newHeight, maxHeight);
        }

        textAreaRef.current.style.height = `${newHeight}px`;
      }
    }, [value, maxRows]); // Re-run when value or maxRows changes

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(event); // Call external onChange first
      }
      // Auto-resizing logic is handled by useEffect, which re-runs when `value` (controlled by `onChange`) changes
    };

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md p-4 bg-background text-md placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[100px] resize ", // Enforce min-height, disable manual resize, hide scrollbar initially
          className,
        )}
        value={value}
        onChange={handleChange}
        ref={textAreaRef}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
