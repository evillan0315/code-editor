import React from 'react';

const ansiColorMap: { [key: string]: string } = {
  '30': 'text-gray-900',
  '31': 'text-red-500',
  '32': 'text-green-500',
  '33': 'text-yellow-500',
  '34': 'text-blue-500',
  '35': 'text-purple-500',
  '36': 'text-cyan-500',
  '37': 'text-gray-300',

  '90': 'text-gray-500',
  '91': 'text-red-400',
  '92': 'text-green-400',
  '93': 'text-yellow-400',
  '94': 'text-blue-400',
  '95': 'text-purple-400',
  '96': 'text-cyan-400',
  '97': 'text-gray-100',

  '40': 'bg-gray-900',
  '41': 'bg-red-500',
  '42': 'bg-green-500',
  '43': 'bg-yellow-500',
  '44': 'bg-blue-500',
  '45': 'bg-purple-500',
  '46': 'bg-cyan-500',
  '47': 'bg-gray-300',

  '100': 'bg-gray-500',
  '101': 'bg-red-400',
  '102': 'bg-green-400',
  '103': 'bg-yellow-400',
  '104': 'bg-blue-400',
  '105': 'bg-purple-400',
  '106': 'bg-cyan-400',
  '107': 'bg-gray-100',

  '39': 'text-inherit',
  '49': 'bg-inherit',
  '0': 'text-inherit bg-inherit font-normal not-italic no-underline no-line-through',
};

const ansiStyleMap: { [key: string]: string } = {
  '1': 'font-bold',
  '2': 'opacity-75',
  '3': 'italic',
  '4': 'underline',
  '5': 'animate-blink',
  '7': 'bg-gray-700 text-white',
  '8': 'opacity-0',
  '9': 'line-through',

  '21': 'font-normal',
  '22': 'font-normal',
  '23': 'not-italic',
  '24': 'no-underline',
  '25': 'no-animation',
  '27': 'bg-inherit text-inherit',
  '28': 'opacity-100',
  '29': 'no-line-through',
};

const ANSI_REGEX = /(\x1b\[([\d;]*)m)/g;

export function parseAnsi(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentClasses: Set<string> = new Set();
  let lastIndex = 0;
  let match;

  while ((match = ANSI_REGEX.exec(text)) !== null) {
    const [fullMatch, , codesStr] = match;
    const startIndex = match.index;
    const endIndex = match.index + fullMatch.length;

    if (startIndex > lastIndex) {
      const plainText = text.substring(lastIndex, startIndex);
      if (plainText) {
        parts.push(
          <span
            key={`span-${parts.length}`}
            className={Array.from(currentClasses).join(' ')}
          >
            {plainText}
          </span>,
        );
      }
    }

    const codes = codesStr.split(';').map(Number);
    for (const code of codes) {
      if (code === 0) {
        currentClasses.clear();
      } else {
        const colorClass = ansiColorMap[code];
        const styleClass = ansiStyleMap[code];

        if (colorClass) {
          if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
            Array.from(currentClasses).forEach((cls) => {
              if (cls.startsWith('text-') && !cls.startsWith('text-inherit')) {
                currentClasses.delete(cls);
              }
            });
          }

          if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
            Array.from(currentClasses).forEach((cls) => {
              if (cls.startsWith('bg-') && !cls.startsWith('bg-inherit')) {
                currentClasses.delete(cls);
              }
            });
          }
          currentClasses.add(colorClass);
        } else if (styleClass) {
          if (code === 22) {
            currentClasses.delete(ansiStyleMap['1']);
            currentClasses.delete(ansiStyleMap['2']);
          } else if (code === 23) {
            currentClasses.delete(ansiStyleMap['3']);
          } else if (code === 24) {
            currentClasses.delete(ansiStyleMap['4']);
          } else if (code === 25) {
            currentClasses.delete(ansiStyleMap['5']);
          } else if (code === 27) {
            currentClasses.delete(ansiStyleMap['7']);
          } else if (code === 28) {
            currentClasses.delete(ansiStyleMap['8']);
          } else if (code === 29) {
            currentClasses.delete(ansiStyleMap['9']);
          }
          currentClasses.add(styleClass);
        }
      }
    }

    lastIndex = endIndex;
  }

  if (lastIndex < text.length) {
    const plainText = text.substring(lastIndex);
    if (plainText) {
      parts.push(
        <span
          key={`span-${parts.length}`}
          className={Array.from(currentClasses).join(' ')}
        >
          {plainText}
        </span>,
      );
    }
  }

  return parts;
}
