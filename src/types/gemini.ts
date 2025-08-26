// src/types/gemini.ts

import { Terminal } from '@xterm/xterm';
import type { FileItem } from '@/types/file-system';

export interface UseGeminiProps {
  fontSize?: number;
  prompt?: string;
  typingDelayMs?: number;
  onFilesCommand?: (options: {
    filterExt?: string;
    showDirectories?: boolean;
  }) => void;
  onFilesSelected?: (files: FileItem[]) => void;
}

export interface UseGeminiReturn {
  term: Terminal | undefined;
  initialize: (terminalElement: HTMLDivElement) => void;
  handleResize: () => void;
  dispose: () => void;
  isProcessingCommand: boolean;
  isWriting: boolean;
  lastResponse: string;
  triggerFilesCommand?: (files: FileItem[]) => void;
  handleInput: (promptText: string) => Promise<void>;
}

export type GeminiHistoryEntry = {
  prompt: string;
  response: string;
};
