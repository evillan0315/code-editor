import { Terminal, type ITerminalOptions } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getTerminalTheme } from "@/themes/terminal";
import {
SPINNER_FRAMES,
TERMINAL_COMMANDS,
PROMPT_PREFIX,
} from "@/constants/gemini";
import { delay } from "@/utils/terminal";

export interface TerminalManagerOptions {
fontSize?: number;
prompt?: string;
typingDelayMs?: number;
initialHistory: string[];
isProcessingCommand: boolean;
terminalTheme: string;
}

export class TerminalManager {
private termRef?: Terminal;
private fitAddon?: FitAddon;
private spinnerInterval?: ReturnType<typeof setInterval>;
private spinnerState = 0;
private inputBuffer = "";
private commandHistory: string[];
private historyIndex = -1;
private prompt: string;
private typingDelay: number;
private isProcessingCommand: () => boolean;
private terminalTheme: () => string;

private onCommandInput: (cmd: string) => Promise<void>;
private onTypingInterrupted: (interrupted: boolean) => void;

constructor(
options: TerminalManagerOptions,
onCommandInput: (cmd: string) => Promise<void>,
onTypingInterrupted: (interrupted: boolean) => void,
) {
this.prompt = options.prompt ?? PROMPT_PREFIX;
this.typingDelay = options.typingDelayMs ?? 1;
this.commandHistory = options.initialHistory;
this.onCommandInput = onCommandInput;
this.onTypingInterrupted = onTypingInterrupted;

    this.isProcessingCommand = () => options.isProcessingCommand;
    this.terminalTheme = () => options.terminalTheme;

    const terminalOptions: ITerminalOptions = {
      fontSize: options.fontSize ?? 12,
      convertEol: true,
      fontFamily: "monospace",
      theme: getTerminalTheme(this.terminalTheme()),
      cursorBlink: true,
      macOptionIsMeta: true,
      altClickMovesCursor: true,
      bellStyle: "none",
    };

    this.termRef = new Terminal(terminalOptions);
    this.fitAddon = new FitAddon();
    this.termRef.loadAddon(this.fitAddon);
    this.setupDataHandler();

}

get term(): Terminal | undefined {
return this.termRef;
}

public initialize(element: HTMLDivElement): void {
if (!this.termRef || this.termRef.element) return;
this.termRef.open(element);
this.fitAddon?.fit();
}

public dispose(): void {
clearInterval(this.spinnerInterval);
this.termRef?.dispose();
this.termRef = undefined;
this.fitAddon = undefined;
}

public handleResize(): void {
this.fitAddon?.fit();
}

public writePrompt(): void {
this.termRef?.write(`\r\n${this.prompt}`);
}

public writeLine(text: string, colorCode = "0"): void {
this.termRef?.write(`\x1b[${colorCode}m${text}\x1b[0m\r\n`);
}

public async typeText(
text: string,
delayMs: number = this.typingDelay,
): Promise<void> {
if (!this.termRef) return;
if (delayMs <= 0) {
this.termRef.write(text);
return;
}

    for (const char of text) {
      if (char === "\x03") {
        this.onTypingInterrupted(true);
        break;
      }
      this.termRef.write(char);
      await delay(delayMs);
    }

}

public async typeMultiline(
text: string | string[],
delayMs: number = this.typingDelay,
): Promise<void> {
const lines = Array.isArray(text) ? text : text.split("\n");
for (const line of lines) {
await this.typeText(line + "\n", delayMs);
}
}

public startSpinner(): void {
this.spinnerInterval = setInterval(() => {
if (this.termRef) {
this.termRef.write(
`\x1b[s\x1b[2K\r${SPINNER_FRAMES[this.spinnerState % SPINNER_FRAMES.length]} Thinking...\x1b[u`,
);
this.spinnerState++;
}
}, 100);
}

public stopSpinner(): void {
clearInterval(this.spinnerInterval);
this.termRef?.write("\x1b[2K\r");
this.spinnerInterval = undefined;
this.spinnerState = 0;
}

public updateTheme(newTheme: string): void {
if (this.termRef) {
this.termRef.options.theme = getTerminalTheme(newTheme);
this.termRef.refresh(0, this.termRef.rows - 1);
}
}

public updateCommandHistory(history: string[]): void {
this.commandHistory = history;
}

private setupDataHandler(): void {
this.termRef?.onData(async (data: string) => {
if (data === "\x03") {
this.onTypingInterrupted(true);
this.stopSpinner();
this.termRef?.write("^C\r\n");
this.inputBuffer = "";
this.writePrompt();
return;
}

      if (this.isProcessingCommand()) return;

      const charCode = data.charCodeAt(0);

      if (charCode === 13) {
        this.termRef?.write("\r\n");
        await this.onCommandInput(this.inputBuffer.trim());
        this.inputBuffer = "";
        this.historyIndex = -1;
      } else if (charCode === 127) {
        if (this.inputBuffer.length > 0) {
          this.termRef?.write("\b \b");
          this.inputBuffer = this.inputBuffer.slice(0, -1);
        }
      } else if (charCode === 9) {
        const match = TERMINAL_COMMANDS.find((cmd) =>
          cmd.startsWith(this.inputBuffer),
        );
        if (match) {
          const suffix = match.slice(this.inputBuffer.length);
          this.inputBuffer += suffix;
          this.termRef?.write(suffix);
        }
      } else if (data === "\x1b[A" || data === "\x1b[B") {
        if (data === "\x1b[A") {
          if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            this.inputBuffer = this.commandHistory[this.historyIndex];
          }
        } else if (data === "\x1b[B") {
          if (this.historyIndex > 0) {
            this.historyIndex--;
          } else {
            this.historyIndex = -1;
          }
          this.inputBuffer =
            this.historyIndex >= 0
              ? this.commandHistory[this.historyIndex]
              : "";
        }
        this.termRef?.write("\x1b[2K\r");
        this.termRef?.write(this.prompt + this.inputBuffer);
      } else if (charCode >= 32 && charCode <= 126) {
        this.termRef?.write(data);
        this.inputBuffer += data;
        this.historyIndex = -1;
      }
    });

}

public async getConversationHistory(
conversationId: string,
): Promise<{ role: string; parts: { text: string }[] }[]> {
try {
const response = await fetch(
`/api/conversation/${conversationId}/history`,
);
if (!response.ok) throw new Error("Failed to fetch conversation history");
return await response.json();
} catch (err: any) {
console.error("Error fetching conversation history:", err);
throw err;
}
}
}
