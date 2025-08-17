import React from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/classNames"; // optional utility for merging classes

export const Input = React.forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "border border-input text-sm px-2 py-1 rounded outline-none w-full",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input"; // For better debugging in React DevTools
