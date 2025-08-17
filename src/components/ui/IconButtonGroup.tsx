// src/components/ui/IconButtonGroup.tsx
import React from "react";
import { Icon } from "@iconify/react";
import { Button } from "./Button";

export interface IconButtonAction {
  id: string;
  icon: string;
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  showLabel?: boolean;
  iconPosition?: "left" | "right";
}

type ButtonSize = "sm" | "md" | "lg" | "xl";
type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "error"
  | "info"
  | "success"
  | "warning";

type IconButtonGroupSize = ButtonSize | "icon";
type IconButtonGroupVariant = ButtonVariant | "ghost";

interface IconButtonGroupProps {
  actions?: IconButtonAction[] | [] | nulll;
  size?: IconButtonGroupSize;
  variant?: IconButtonGroupVariant;
  className?: string;
}

export const IconButtonGroup: React.FC<IconButtonGroupProps> = ({
  actions = [],
  size = "icon",
  variant = "ghost",
  className = "",
}) => {
  // Map "icon" to real size
  const actualSize: ButtonSize = size === "icon" ? "sm" : size;

  // Map "ghost-icon" to actual variant

  return (
    <div className={`flex items-center justify-between gap-1 ${className}`}>
      {actions
        .filter((action) => !action.hidden)
        .map(
          ({
            id,
            icon,
            label,
            title,
            onClick,
            disabled,
            showLabel = false,
            iconPosition = "left",
          }) => (
            <Button
              key={id}
              size={actualSize}
              variant={variant}
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              title={title || label}
              className="flex items-center gap-1"
            >
              {showLabel && iconPosition === "left" && (
                <span className="truncate">{label}</span>
              )}

              <Icon icon={icon} className="w-6 h-6" />

              {showLabel && iconPosition === "right" && (
                <span className="truncate">{label}</span>
              )}
            </Button>
          ),
        )}
    </div>
  );
};
