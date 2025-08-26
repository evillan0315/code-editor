// src/stores/theme.ts
import { persistentAtom } from '@nanostores/persistent';
import { type Theme } from '@/types/theme'; // e.g. export type Theme = "light" | "dark" | "system";

// Detect system theme preference
function getSystemTheme(): Exclude<Theme, 'system'> {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light'; // fallback for SSR
}

// Define the persistent atom for theme
export const theme = persistentAtom<Theme>('theme', 'system', {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Derived helper → always resolve actual theme
export function resolvedTheme(): 'light' | 'dark' {
  const value = theme.get();
  return value === 'system' ? getSystemTheme() : value;
}

// Toggle between light and dark only (ignores "system")
export function toggleTheme(): void {
  const current = resolvedTheme();
  theme.set(current === 'dark' ? 'light' : 'dark');
}
