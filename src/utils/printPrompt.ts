// src/utils/printPrompt.ts

import type { Terminal } from '@xterm/xterm';

export function printPrompt(terminal: Terminal) {
  terminal.write('\r\n$ ');
}
