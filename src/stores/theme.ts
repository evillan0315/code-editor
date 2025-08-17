// src/stores/theme.ts
import { persistentAtom } from "@nanostores/persistent";
import { type Theme } from "@/types/theme"; // Assuming @/types/theme maps to src/types/theme.ts

// Function to detect system theme preference
const getSystemTheme = (): Theme =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

// Function to determine the initial theme for persistentAtom
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    // persistentAtom will handle JSON.parse/stringify, but we want to ensure
    // we only return 'dark' or 'light' for direct localStorage checks.
    // The `decode` function in persistentAtom will correctly parse "dark" or "light".
    // This `getInitialTheme` is specifically for when persistentAtom *first* loads.
    if (stored === '"dark"' || stored === '"light"') {
      return JSON.parse(stored) as Theme; // Cast to Theme for type safety
    }
  } catch (e) {
    console.error(
      "Failed to parse stored theme, falling back to system theme:",
      e,
    );
  }
  return getSystemTheme();
}

// Define the persistent atom for theme
export const theme = persistentAtom<Theme>("theme", getInitialTheme(), {
  encode: JSON.stringify, // Store as JSON string
  decode: JSON.parse, // Parse from JSON string
});

// Helper function to toggle the theme
export function toggleTheme(): void {
  const current = theme.get();
  theme.set(current === "dark" ? "light" : "dark");
}
