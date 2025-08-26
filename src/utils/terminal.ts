// src/utils/terminal.ts

import { Terminal } from '@xterm/xterm';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function typeText(
  term: Terminal,
  text: string,
  delayMs: number,
): Promise<void> {
  if (delayMs <= 0) {
    term.write(text);
    return;
  }
  for (const char of text) {
    if (char === '\x03') break; // Ctrl+C detection
    term.write(char);
    await delay(delayMs);
  }
}

export async function typeMultiline(
  term: Terminal,
  text: string | string[],
  delayMs: number = 1,
): Promise<void> {
  const lines = Array.isArray(text) ? text : text.split('\n');
  for (const line of lines) {
    await typeText(term, line + '\n', delayMs);
  }
}
