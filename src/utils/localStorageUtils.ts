// src/lib/utils/localStorageUtils.ts

import {
  HISTORY_KEY,
  CONVERSATION_RESPONSES_KEY,
  CONV_ID_KEY,
  SYSTEM_INSTR_KEY,
} from "@/constants/gemini";
import type { GeminiHistoryEntry } from "@/types/gemini";

export function clearConversationResponse(id: string) {
  const history = loadConversationResponses();
  delete history[id];
  localStorage.setItem(CONVERSATION_RESPONSES_KEY, JSON.stringify(history));
}

export function loadConversationResponses(): Record<
  string,
  GeminiHistoryEntry[]
> {
  try {
    const raw = localStorage.getItem(CONVERSATION_RESPONSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error(
      "Failed to parse conversation responses from localStorage:",
      e,
    );
    return {};
  }
}

export function saveConversationResponse(
  conversationId: string,
  prompt: string,
  response: string,
) {
  if (!response?.trim()) return;
  const history = loadConversationResponses();
  if (!history[conversationId]) history[conversationId] = [];
  history[conversationId].push({ prompt, response });
  localStorage.setItem(CONVERSATION_RESPONSES_KEY, JSON.stringify(history));
}

export function getResponsesForConversation(
  conversationId: string,
): GeminiHistoryEntry[] {
  return loadConversationResponses()[conversationId] ?? [];
}

export function loadCommandHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse command history from localStorage:", e);
    return [];
  }
}

export function saveCommandHistory(history: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50))); // Keep last 50 commands
  } catch (e) {
    console.error("Failed to save command history to localStorage:", e);
  }
}

export function getStoredConversationId(): string | undefined {
  return localStorage.getItem(CONV_ID_KEY) || undefined;
}

export function setStoredConversationId(id: string | undefined) {
  if (id) {
    localStorage.setItem(CONV_ID_KEY, id);
  } else {
    localStorage.removeItem(CONV_ID_KEY);
  }
}

export function getStoredSystemInstruction(): string | undefined {
  return localStorage.getItem(SYSTEM_INSTR_KEY) || undefined;
}

export function setStoredSystemInstruction(instruction: string | undefined) {
  if (instruction) {
    localStorage.setItem(SYSTEM_INSTR_KEY, instruction);
  } else {
    localStorage.removeItem(SYSTEM_INSTR_KEY);
  }
}
