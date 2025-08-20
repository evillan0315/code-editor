// @/services/terminal/commandProcessor.ts

/\*import { v4 as uuidv4 } from 'uuid';
import type { UseGeminiProps } from '@/types/gemini';
import type { FileItem } from '@/types/file-system';
import { generateGeminiText, generateGeminiFile } from '@/services/gemini';
import {
saveConversationResponse,
clearConversationResponse,
saveCommandHistory,
setStoredConversationId,
setStoredSystemInstruction,
} from '@/utils/localStorageUtils';
import {
SYSTEM_INSTRUCTIONS_BASH_ADMIN_EXPERT,
SYSTEM_INSTRUCTIONS_DEVOPS_EXPERT,
SYSTEM_INSTRUCTIONS_FULLSTACK_DEVELOPER_EXPERT,
SYSTEM_INSTRUCTIONS_SOFTWARE_ENGINEER_EXPERT,
} from '@/constants/refactored/ai';
import { TerminalManager } from '@/services/terminal/terminalManager';

export interface CommandProcessorDeps {
termManager: TerminalManager;
isProcessing: boolean;
setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
isWriting: boolean;
setIsWriting: React.Dispatch<React.SetStateAction<boolean>>;
lastResponse: string;
setLastResponse: React.Dispatch<React.SetStateAction<string>>;
conversationId?: string;
setConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
systemInstruction?: string;
setSystemInstruction: React.Dispatch<React.SetStateAction<string | undefined>>;
commandHistory: string[];
setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
typingDelay: number;
onFilesCommand?: UseGeminiProps['onFilesCommand'];
onFilesSelected?: UseGeminiProps['onFilesSelected'];
typingInterrupted: boolean;
setTypingInterrupted: React.Dispatch<React.SetStateAction<boolean>>;
}

export class CommandProcessor {
constructor(private deps: CommandProcessorDeps) {}

private updateCommandHistory(command: string) {
const { commandHistory, setCommandHistory, termManager } = this.deps;
if (commandHistory[0] !== command) {
const updated = [command, ...commandHistory];
setCommandHistory(updated);
saveCommandHistory(updated);
termManager.updateCommandHistory(updated);
}
}

private async handleSystemCommands(command: string, finish: () => void) {
const d = this.deps;
if (command === '/new') {
if (d.conversationId) clearConversationResponse(d.conversationId);
d.setConversationId(undefined);
d.setSystemInstruction(undefined);
setStoredConversationId(undefined);
setStoredSystemInstruction(undefined);
d.termManager.writeLine('New conversation started.', '36');
return finish();
}

    if (command.startsWith('/system ')) {
      const instruction = command.slice(8).trim();
      d.setSystemInstruction(instruction);
      setStoredSystemInstruction(instruction);
      d.termManager.writeLine(`System instruction set: ${instruction}`, '36');
      return finish();
    }

    if (command.startsWith('/persona ')) {
      const persona = command.slice(9).trim();
      const map: Record<string, string> = {
        'bash-admin': SYSTEM_INSTRUCTIONS_BASH_ADMIN_EXPERT,
        devops: SYSTEM_INSTRUCTIONS_DEVOPS_EXPERT,
        fullstack: SYSTEM_INSTRUCTIONS_FULLSTACK_DEVELOPER_EXPERT,
        software: SYSTEM_INSTRUCTIONS_SOFTWARE_ENGINEER_EXPERT,
      };
      const instr = map[persona];
      if (!instr) {
        d.termManager.writeLine(`Unknown persona: ${persona}`, '31');
        return finish();
      }
      d.setSystemInstruction(instr);
      setStoredSystemInstruction(instr);
      d.setIsWriting(true);
      await d.termManager.typeMultiline(instr, d.typingDelay);
      d.setIsWriting(false);
      return finish();
    }

}

public async handleCommand(command: string): Promise<void> {
const d = this.deps;
const finish = () => {
d.setIsProcessing(false);
d.termManager.writePrompt();
};

    if (!command.trim()) return finish();

    d.setIsProcessing(true);
    d.setTypingInterrupted(false);
    this.updateCommandHistory(command);

    if (await this.handleSystemCommands(command, finish)) return;

    switch (command) {
      case '/summarize':
        return this.processTextCommand('Summarize the following:\n\n' + d.lastResponse, '/summarize', finish);
      case '/translate':
        return this.processTextCommand('Translate this to English:\n\n' + d.lastResponse, '/translate', finish);
      case '/retry':
        return this.handleCommand(d.commandHistory[0]);
    }

    if (command.startsWith('/save')) return this.saveOutput(command, finish);

    // fallback to AI
    return this.processTextCommand(command, command, finish);

}

private async processTextCommand(prompt: string, label: string, finish: () => void) {
const d = this.deps;
d.termManager.startSpinner();
const convId = d.conversationId ?? this.startNewConversation();
try {
const result = await generateGeminiText(prompt, d.systemInstruction, convId);
const responseText = Array.isArray(result) ? result.join('') : result;
d.setLastResponse(responseText);
saveConversationResponse(convId, label, responseText);
d.termManager.stopSpinner();
d.setIsWriting(true);
await d.termManager.typeMultiline(responseText, d.typingDelay);
} catch (e: any) {
d.termManager.stopSpinner();
d.termManager.writeLine(`Error: ${e.message || 'Unexpected error'}`, '31');
} finally {
d.setIsWriting(false);
finish();
}
}

private async saveOutput(command: string, finish: () => void) {
const d = this.deps;
const isAll = command.includes('--all');
const cid = d.conversationId;
if (!cid) {
d.termManager.writeLine('No active conversation to save.', '31');
return finish();
}

    try {
      let content = '';
      if (isAll) {
        d.termManager.writeLine('Saving entire conversation...', '33');
        const history = await d.termManager.getConversationHistory(cid);
        if (!history?.length) {
          d.termManager.writeLine('No conversation history found on server.', '31');
          return finish();
        }
        content = history.map((entry, i) => {
          const role = entry.role === 'user' ? 'USER' : 'AI';
          const text = entry.parts.map(p => p.text).join('\n');
          return `${role} #${Math.ceil((i + 1) / 2)}:\n${text}`;
        }).join('\n\n---\n\n');
      } else {
        content = d.lastResponse;
        if (!content.trim()) {
          d.termManager.writeLine('Nothing to save \u2014 response is empty.', '31');
          return finish();
        }
      }

      const blob = new Blob([content], { type: 'text/plain' });
      window.open(URL.createObjectURL(blob), '_blank');
      d.termManager.writeLine('Saved successfully. \u2705', '32');
    } catch (err: any) {
      d.termManager.writeLine(`Error saving: ${err.message}`, '31');
    }
    finish();

}

private startNewConversation(): string {
const id = uuidv4();
this.deps.setConversationId(id);
setStoredConversationId(id);
this.deps.setSystemInstruction(undefined);
setStoredSystemInstruction(undefined);
this.deps.termManager.writeLine(`New conversation started with ID: ${id}`, '36');
return id;
}
}\*/
