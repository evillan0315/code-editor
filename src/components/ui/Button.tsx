import React, { useEffect } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
// Ensure correct import path for your classResolver
import {
  resolveVariantClasses,
  resolveSizeClasses,
  resolveStateClasses,
} from "@/utils/classResolver";
import { Icon } from "./Icon";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "error"
  | "info"
  | "warning"
  | "success"
  | "ghost";

// Extend HTMLButtonElement attributes and add custom props
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariants; // Assuming 'ghost' might be a variant handled elsewhere or default
  active?: boolean;
  selected?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: string | ReactNode;
  loading?: boolean;
  // Note: The 'className' prop is already included by ButtonHTMLAttributes
};

export const Button: React.FC<ButtonProps> = ({
  className = "", // Default to empty string if no additional classes are passed
  disabled,
  children,
  // Destructure custom props to prevent them from being passed to the native button element
  variant,
  active,
  selected,
  size,
  icon,
  loading,
  "aria-label": ariaLabel,
  ...rest // All other standard HTML button attributes
}) => {
  const hasLabel = !!children;
  const isIconOnly = !!icon && !hasLabel;

  // Accessibility warning for icon-only buttons without aria-label
  useEffect(() => {
    if (isIconOnly && !ariaLabel) {
      console.warn(
        "Accessibility warning: Icon-only button should have an aria-label for screen readers.",
      );
    }
  }, [isIconOnly, ariaLabel]);

  // Determine base component class based on whether it's an icon-only button
  const baseClass = isIconOnly ? "btn-icon" : "btn";

  // Resolve classes using the helper functions
  const variantClasses = resolveVariantClasses(variant, isIconOnly);
  const sizeClasses = resolveSizeClasses(size);
  // Pass all relevant state props to resolveStateClasses
  const stateClasses = resolveStateClasses({
    active,
    selected,
    disabled,
    loading,
  });

  // Combine all classes, filtering out any empty strings
  const allClasses = [
    baseClass,
    variantClasses,
    sizeClasses,
    stateClasses,
    // Add any always-present utility classes for layout or transitions
    "flex",
    "items-center",
    "gap-1",
    "transition",
    // Add specific classes for loading state not covered by resolveStateClasses
    loading && "pointer-events-none", // Prevents interaction while loading
    className, // User-provided additional classes
  ]
    .filter(Boolean) // Remove any undefined or empty strings
    .join(" "); // Join them into a single class string

  return (
    <button
      className={`text-base focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800 ${allClasses}`}
      disabled={disabled || loading} // Disable button if `disabled` or `loading` is true
      aria-label={ariaLabel} // Pass aria-label for accessibility
      {...rest} // Spread any other standard button attributes
    >
      {loading && (
        // Display loading spinner if loading
        <Icon
          icon="svg-spinners:180-ring-with-bg"
          className="animate-spin h-4 w-4"
        />
      )}
      {!loading &&
        icon &&
        // Display icon if not loading and icon is provided
        (typeof icon === "string" ? (
          <Icon icon={icon} className="inline-block" />
        ) : (
          icon
        ))}
      {!loading && children} {/* Display children if not loading */}
    </button>
  );
};
