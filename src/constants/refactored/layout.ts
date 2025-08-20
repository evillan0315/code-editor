// AppLayout Layout constants
export const TARGET_LEFT_PERCENTAGE = 0.2; // Left sidebar target: 30% of screen width
export const TARGET_RIGHT_PERCENTAGE = 0.3; // Right sidebar target: 30% of screen width

// Minimum pixel dimensions that resizable components can be (both width and height)
export const MIN_DIMENSION_PX = 200; // Unified minimum pixel size (e.g., 40px for width or height)

// Maximum percentage constraints for resizing.
export const MAX_LEFT_PERCENTAGE_CONSTRAINT = 0.2; // Left sidebar max 20% of window width
export const MAX_RIGHT_PERCENTAGE_CONSTRAINT = 0.6; // Right sidebar max 40% of window width

// Constants for the Main Content Area Terminal
export const TARGET_TERMINAL_PERCENTAGE = 0.3; // Terminal initial height: 30% of screen height
export const MAX_TERMINAL_PERCENTAGE_CONSTRAINT = 0.8; // Terminal max height: 60% of screen height

// New Constants for the Resizable Bottom Panels within Sidebars
export const TARGET_SIDEBAR_BOTTOM_PANEL_PERCENTAGE = 0.2; // Initial height 50% of its parent sidebar's available height
export const MAX_SIDEBAR_BOTTOM_PANEL_PERCENTAGE_CONSTRAINT = 0.2; // Max height 80% of its parent sidebar's available height

// Constants for max and min dimensions for floating movable component - src/components/FloatingConfigPanel.tsx
export const MAX_WIDTH_PERCENT = 30; // Max width: 30% of viewport width
export const MAX_HEIGHT_VH = 60; // Max height: 30% of viewport height
export const MIN_SIZE_PX = 100; // Minimum width/height in pixels
