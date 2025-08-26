import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with intelligent merging of TailwindCSS utilities.
 * @example
 * cn("px-2", isActive && "bg-blue-500", "text-sm")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
