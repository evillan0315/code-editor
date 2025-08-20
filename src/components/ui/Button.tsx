import React, { useEffect } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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


type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariants; 
  active?: boolean;
  selected?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: string | ReactNode;
  loading?: boolean;
  
};

export const Button: React.FC<ButtonProps> = ({
  className = "", 
  disabled,
  children,
  
  variant,
  active,
  selected,
  size,
  icon,
  loading,
  "aria-label": ariaLabel,
  ...rest 
}) => {
  const hasLabel = !!children;
  const isIconOnly = !!icon && !hasLabel;

  
  useEffect(() => {
    if (isIconOnly && !ariaLabel) {
      console.warn(
        "Accessibility warning: Icon-only button should have an aria-label for screen readers.",
      );
    }
  }, [isIconOnly, ariaLabel]);

  
  const baseClass = isIconOnly ? "btn-icon" : "btn";

  
  const variantClasses = resolveVariantClasses(variant, isIconOnly);
  const sizeClasses = resolveSizeClasses(size);
  
  const stateClasses = resolveStateClasses({
    active,
    selected,
    disabled,
    loading,
  });

  
  const allClasses = [
    baseClass,
    variantClasses,
    sizeClasses,
    stateClasses,
    
    "flex",
    "items-center",
    "gap-1",
    "transition",
    
    loading && "pointer-events-none", 
    className, 
  ]
    .filter(Boolean) 
    .join(" "); 

  return (
    <button
      className={`text-base focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-800 ${allClasses}`}
      disabled={disabled || loading} 
      aria-label={ariaLabel} 
      {...rest} 
    >
      {loading && (
        
        <Icon
          icon="svg-spinners:180-ring-with-bg"
          className="animate-spin h-4 w-4"
        />
      )}
      {!loading &&
        icon &&
        
        (typeof icon === "string" ? (
          <Icon icon={icon} className="inline-block" />
        ) : (
          icon
        ))}
      {!loading && children} {}
    </button>
  );
};
