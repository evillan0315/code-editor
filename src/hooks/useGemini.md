import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { useStore } from "@nanostores/react";
import { theme as themeStore } from "@/stores/theme";
import type { TerminalManager } from "@/services/terminal/terminalManager";
import { type CommandProcessor } from "@/services/terminal/commandProcessor";
import {
loadCommandHistory,
getStoredConversationId,
getStoredSystemInstruction,
getResponsesForConversation,
} from "@/utils/localStorageUtils";
import { PROMPT_PREFIX } from "@/constants/gemini";
import type {
UseGeminiProps,
UseGeminiReturn,
GeminiHistoryEntry,
} from "@/types/gemini";
import type { FileItem } from "@/types/file-system";

export function useGemini(props: UseGeminiProps): UseGeminiReturn {
const [isProcessingCommand, setIsProcessingCommand] = useState(false);
const [isWriting, setIsWriting] = useState(false);
const [typingInterrupted, setTypingInterrupted] = useState(false);
const [lastResponse, setLastResponse] = useState("");
const [conversationId, setConversationId] = useState(getStoredConversationId);
const [systemInstruction, setSystemInstruction] = useState(
getStoredSystemInstruction,
);
const [commandHistory, setCommandHistory] = useState(loadCommandHistory);

const $theme = useStore(themeStore);
const termManagerRef = useRef<Terminal>();
const commandProcessorRef = useRef<Terminal>();
const hasRenderedPastConversation = useRef(false);
const isTerminalAttached = useRef(false);

const handleInput = useCallback(async (text: string) => {
await commandProcessorRef.current?.handleCommand(text);
}, []);

const initialize = (el: HTMLDivElement) => {
if (!el || isTerminalAttached.current) return;

    if (!termManagerRef.current) {
      const manager = new Terminal(
        {
          fontSize: props.fontSize,
          prompt: props.prompt,
          typingDelayMs: props.typingDelayMs,
          initialHistory: commandHistory,
          isProcessingCommand,
          terminalTheme: $theme,
        },
        handleInput,
        setTypingInterrupted,
      );
      termManagerRef.current = manager;

      commandProcessorRef.current = new CommandProcessor({
        termManager: manager,
        isProcessing: isProcessingCommand,
        setIsProcessing: setIsProcessingCommand,
        isWriting,
        setIsWriting,
        lastResponse,
        setLastResponse,
        conversationId,
        setConversationId,
        systemInstruction,
        setSystemInstruction,
        commandHistory,
        setCommandHistory,
        typingDelay: props.typingDelayMs ?? 1,
        onFilesCommand: props.onFilesCommand,
        onFilesSelected: props.onFilesSelected,
        typingInterrupted,
        setTypingInterrupted,
      });
    }

    const manager = termManagerRef.current;
    manager.initialize(el);
    isTerminalAttached.current = true;

    manager.writeLine("Welcome to the AI Terminal!");
    manager.writeLine("Commands:");
    [
      "/new",
      "/system <instruction>",
      "/persona bash-admin|devops|fullstack|software",
      "/file <prompt>",
      "/files [--filter=<ext>] [--show-directories]",
      "/summarize",
      "/translate",
      "/retry",
      "/save",
    ].forEach((cmd) => manager.writeLine(`  ${PROMPT_PREFIX.trim()} ${cmd}`));

    if (!hasRenderedPastConversation.current && conversationId) {
      const entries = getResponsesForConversation(conversationId).filter(
        (e) => e.prompt && e.response,
      );
      if (entries.length > 0) {
        manager.writeLine("\r\n--- Previous Session ---", "90");
        for (const { prompt, response } of entries) {
          manager.writeLine(`\x1b[36m> ${prompt}\x1b[0m\r\n${response}`);
        }
        manager.writeLine("\r\n------------------------", "90");
      }
      hasRenderedPastConversation.current = true;
    }

    manager.writePrompt();

};

const handleResize = () => termManagerRef.current?.handleResize();

const dispose = () => {
termManagerRef.current?.dispose();
termManagerRef.current = undefined;
commandProcessorRef.current = undefined;
isTerminalAttached.current = false;
hasRenderedPastConversation.current = false;
};

const triggerFilesCommand = (files: FileItem[]) => {
commandProcessorRef.current?.triggerFilesCommand(files);
};

useEffect(() => {
termManagerRef.current?.updateTheme($theme);
  }, [$theme]);

useEffect(() => {
termManagerRef.current?.updateCommandHistory(commandHistory);
}, [commandHistory]);

useEffect(() => dispose, []);

return {
term: termManagerRef.current?.term,
initialize,
dispose,
handleResize,
isProcessingCommand,
isWriting,
lastResponse,
handleInput,
triggerFilesCommand,
};
}
