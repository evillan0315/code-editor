import React from 'react';

// Mapping ANSI color codes to Tailwind CSS classes
const ansiColorMap: { [key: string]: string } = {
  '30': 'text-gray-900', // Black
  '31': 'text-red-500', // Red
  '32': 'text-green-500', // Green
  '33': 'text-yellow-500', // Yellow
  '34': 'text-blue-500', // Blue
  '35': 'text-purple-500', // Magenta
  '36': 'text-cyan-500', // Cyan
  '37': 'text-gray-300', // White (standard light gray)

  // Bright colors (often 90-97)
  '90': 'text-gray-500', // Bright Black / Dark Gray
  '91': 'text-red-400', // Bright Red
  '92': 'text-green-400', // Bright Green
  '93': 'text-yellow-400', // Bright Yellow
  '94': 'text-blue-400', // Bright Blue
  '95': 'text-purple-400', // Bright Magenta
  '96': 'text-cyan-400', // Bright Cyan
  '97': 'text-gray-100', // Bright White (very light gray)

  // Background colors (40-47, 100-107)
  '40': 'bg-gray-900', // Black background
  '41': 'bg-red-500',
  '42': 'bg-green-500',
  '43': 'bg-yellow-500',
  '44': 'bg-blue-500',
  '45': 'bg-purple-500',
  '46': 'bg-cyan-500',
  '47': 'bg-gray-300',

  // Bright background colors (100-107)
  '100': 'bg-gray-500',
  '101': 'bg-red-400',
  '102': 'bg-green-400',
  '103': 'bg-yellow-400',
  '104': 'bg-blue-400',
  '105': 'bg-purple-400',
  '106': 'bg-cyan-400',
  '107': 'bg-gray-100',

  // Special reset codes
  '39': 'text-inherit', // Default foreground color
  '49': 'bg-inherit', // Default background color
  '0': 'text-inherit bg-inherit font-normal not-italic no-underline no-line-through', // Reset all attributes
};

// Mapping ANSI style codes to Tailwind CSS classes
const ansiStyleMap: { [key: string]: string } = {
  '1': 'font-bold',       // Bold
  '2': 'opacity-75',      // Faint (simulated with opacity)
  '3': 'italic',          // Italic
  '4': 'underline',       // Underline
  '5': 'animate-blink',   // Blink (requires custom CSS animation)
  '7': 'bg-gray-700 text-white', // Reverse (approximate, swaps fg/bg)
  '8': 'opacity-0',       // Hidden (concealed)
  '9': 'line-through',    // Strikethrough

  // Reset codes for styles (2x series)
  '21': 'font-normal',    // Not bold (double underline ignored)
  '22': 'font-normal',    // Not bold/faint
  '23': 'not-italic',     // Not italic
  '24': 'no-underline',   // Not underline
  '25': 'no-animation',   // Not blinking (needs custom CSS)
  '27': 'bg-inherit text-inherit', // Not reverse
  '28': 'opacity-100',    // Not hidden
  '29': 'no-line-through', // Not strikethrough
};

// Regular expression to find ANSI escape codes.
// It specifically looks for `\x1b[...m` sequences.
const ANSI_REGEX = /(\x1b\[([\d;]*)m)/g;

/**
 * Parses a string containing ANSI escape codes into an array of ReactNode elements.
 * Each segment of text is wrapped in a `<span>` with appropriate Tailwind CSS classes.
 *
 * @param text The input string potentially containing ANSI escape codes.
 * @returns An array of ReactNode elements.
 */
export function parseAnsi(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentClasses: Set<string> = new Set();
  let lastIndex = 0;
  let match;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    const [fullMatch, , codesStr] = match; // fullMatch is \x1b[...m, codesStr is ...
    const startIndex = match.index;
    const endIndex = match.index + fullMatch.length;

    // Add preceding text segment as a span with current styles
    if (startIndex > lastIndex) {
      const plainText = text.substring(lastIndex, startIndex);
      if (plainText) {
        parts.push(
          <span key={`span-${parts.length}`} className={Array.from(currentClasses).join(' ')}>
            {plainText}
          </span>
        );
      }
    }

    // Process ANSI codes
    const codes = codesStr.split(';').map(Number);
    for (const code of codes) {
      if (code === 0) { // Reset all attributes
        currentClasses.clear();
      } else {
        const colorClass = ansiColorMap[code];
        const styleClass = ansiStyleMap[code];

        if (colorClass) {
          // If a new foreground color is applied, remove existing foreground colors (3x, 9x)
          if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
            Array.from(currentClasses).forEach(cls => {
              if (cls.startsWith('text-') && !cls.startsWith('text-inherit')) {
                currentClasses.delete(cls);
              }
            });
          }
          // If a new background color is applied, remove existing background colors (4x, 10x)
          if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
            Array.from(currentClasses).forEach(cls => {
              if (cls.startsWith('bg-') && !cls.startsWith('bg-inherit')) {
                currentClasses.delete(cls);
              }
            });
          }
          currentClasses.add(colorClass);
        } else if (styleClass) {
          // For reset styles (e.g., 22 for no-bold), manually remove the bold class
          if (code === 22) { // No bold/faint
            currentClasses.delete(ansiStyleMap['1']);
            currentClasses.delete(ansiStyleMap['2']);
          } else if (code === 23) { // No italic
            currentClasses.delete(ansiStyleMap['3']);
          } else if (code === 24) { // No underline
            currentClasses.delete(ansiStyleMap['4']);
          } else if (code === 25) { // No blink
            currentClasses.delete(ansiStyleMap['5']);
          } else if (code === 27) { // No reverse
             currentClasses.delete(ansiStyleMap['7']);
          } else if (code === 28) { // No hidden
             currentClasses.delete(ansiStyleMap['8']);
          } else if (code === 29) { // No strikethrough
             currentClasses.delete(ansiStyleMap['9']);
          }
          currentClasses.add(styleClass);
        }
      }
    }

    lastIndex = endIndex;
  }

  // Add any remaining text after the last ANSI code
  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    if (plainText) {
      parts.push(
        <span key={`span-${parts.length}`} className={Array.from(currentClasses).join(' ')}>
          {plainText}
        </span>
      );
    }
  }

  return parts;
}
