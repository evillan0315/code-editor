import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { theme, toggleTheme } from '@/stores/theme';
import { ThemeContext } from '@/contexts/ThemeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const $theme = useStore(theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove($theme === 'dark' ? 'light' : 'dark');
    root.classList.add($theme);
  }, [$theme]);

  return (
    <ThemeContext.Provider value={{ theme: $theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}
