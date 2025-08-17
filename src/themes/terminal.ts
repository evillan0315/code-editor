// src/utils/terminalTheme.ts
import { ITheme } from "@xterm/xterm";
import { Theme } from "@/types/theme"; // Ensure you import your Theme type

export function getTerminalTheme(themeName: Theme): ITheme {
  switch (themeName) {
    case "dark":
      return {
        // Base colors
        background: "#0a0a0a", // Tailwind: neutral-950
        foreground: "#d4d4d4", // Tailwind: neutral-300 (light text on dark background)
        cursor: "#a78bfa", // Tailwind: violet-400 (a distinct, visible cursor)

        // ANSI Black (often same as background or a slightly lighter shade)
        black: "#0a0a0a", // neutral-950
        brightBlack: "#737373", // neutral-500

        // ANSI Red
        red: "#ef4444", // red-500
        brightRed: "#f87171", // red-400

        // ANSI Green
        green: "#22c55e", // green-500
        brightGreen: "#4ade80", // green-400

        // ANSI Yellow
        yellow: "#facc15", // yellow-400
        brightYellow: "#fde047", // yellow-300

        // ANSI Blue
        blue: "#3b82f6", // blue-500
        brightBlue: "#60a5fa", // blue-400

        // ANSI Magenta
        magenta: "#d946ef", // fuchsia-500
        brightMagenta: "#e879f9", // fuchsia-400

        // ANSI Cyan
        cyan: "#2dd4bf", // teal-400
        brightCyan: "#5eead4", // teal-300

        // ANSI White (often same as foreground or a very bright shade)
        white: "#d4d4d4", // neutral-300
        brightWhite: "#ffffff", // pure white
      };
    case "light":
      return {
        // Base colors
        background: "#fafafa", // Tailwind: neutral-50
        foreground: "#171717", // Tailwind: neutral-900 (dark text on light background)
        cursor: "#2563eb", // Tailwind: blue-600 (a distinct, visible cursor)

        // ANSI Black (often same as foreground or a slightly lighter shade)
        black: "#171717", // neutral-900
        brightBlack: "#737373", // neutral-500

        // ANSI Red
        red: "#dc2626", // red-600
        brightRed: "#ef4444", // red-500

        // ANSI Green
        green: "#16a34a", // green-600
        brightGreen: "#22c55e", // green-500

        // ANSI Yellow
        yellow: "#a16207", // yellow-700 (darker for light background)
        brightYellow: "#eab308", // yellow-500

        // ANSI Blue
        blue: "#2563eb", // blue-600
        brightBlue: "#3b82f6", // blue-500

        // ANSI Magenta
        magenta: "#c026d3", // fuchsia-600
        brightMagenta: "#d946ef", // fuchsia-500

        // ANSI Cyan
        cyan: "#0d9488", // teal-600
        brightCyan: "#14b8a6", // teal-500

        // ANSI White (often same as background or a very light shade)
        white: "#fafafa", // neutral-50
        brightWhite: "#ffffff", // pure white
      };
    default:
      // Fallback in case `themeName` somehow becomes an unexpected value
      return getTerminalTheme("dark");
  }
}
