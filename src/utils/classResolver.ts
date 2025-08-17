// Button variant classes using your Tailwind base layer design tokens
export function resolveVariantClasses(
  variant?: string,
  isIconOnly = false,
): string {
  // If it's an icon-only button without a specific variant, or a default button without a variant,
  // the styling is primarily handled by the .btn-icon or .btn component classes in CSS.
  // This function only needs to return additional classes for specific variants.
  if (isIconOnly && !variant) {
    return ""; // Styling handled by the .btn-icon component class in CSS
  }

  switch (variant) {
    case "primary":
      // Uses the --color-primary CSS variable for background.
      // Text is white for contrast. Hover effect subtly changes brightness.
      return "bg-[var(--color-primary)] text-white hover:brightness-110 dark:hover:brightness-90";
    case "secondary":
      // A specific light gray background with text color from --color-primary.
      // Hover uses a semi-transparent primary color.
      return "bg-gray-700/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.5]";
    case "outline":
      // Transparent background. Border and text colors from theme variables.
      // Hover effect changes border and text to the primary theme color.
      return "bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]";
    case "error":
      // Uses --color-error CSS variable for background.
      return "bg-[var(--color-error)] text-white hover:brightness-110 dark:hover:brightness-90";
    case "info":
      // Uses --color-info CSS variable for background.
      return "bg-[var(--color-info)] text-white hover:brightness-110 dark:hover:brightness-90";
    case "warning":
      // Uses --color-warning CSS variable for background.
      // Retains specific text colors for light/dark mode.
      return "bg-[var(--color-warning)] text-gray-950 dark:text-gray-100 hover:brightness-110 dark:hover:brightness-90";
    case "success":
      // Uses --color-success CSS variable for background.
      return "bg-[var(--color-success)] text-white hover:brightness-110 dark:hover:brightness-90";
    default:
      // For any other variant or if no variant is specified, the base styling comes from
      // the .btn component class in CSS, so this function returns an empty string.
      return "border-0 bg-transparent";
  }
}

export function resolveSizeClasses(size?: string): string {
  // These sizes are standard Tailwind classes (text size, padding, shadow, rounded)
  // and do not directly map to the custom CSS variables provided, so they remain unchanged.
  switch (size) {
    case "sm":
      return "text-md px-2 py-1";
    case "md":
      return "text-base px-3 py-1.5";
    case "lg":
      return "text-lg px-4 py-2";
    case "xl":
      return "text-xl px-5 py-3";
    default:
      return "text-sm px-2 py-1";
  }
}

export function resolveStateClasses(options: {
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
}): string {
  const classes: string[] = [];

  // Active state: Uses the --color-primary CSS variable for the ring color,
  // ensuring consistency with the theme's primary accent.
  if (options.active) {
    classes.push("ring-2 ring-offset-2 ring-[var(--color-primary)]");
  }

  // Selected state: Uses the --color-primary CSS variable for background and white text,
  // aligning with the theme's primary color for selected elements.
  if (options.selected) {
    classes.push("bg-[var(--color-primary)] text-white");
  }

  // Disabled or Loading state: Standard Tailwind opacity and cursor utility classes.
  if (options.disabled || options.loading) {
    classes.push("opacity-50 cursor-not-allowed");
  }

  return classes.join(" ");
}
