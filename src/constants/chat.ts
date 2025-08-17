// --- File Size & Conversation Limits ---
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CONVERSATION_LIST_LIMIT = 50;
export const CONVERSATION_HISTORY_LIMIT = 1000;
export const TYPE_SPEED_MS = 0;

// --- Storage Keys for conversations chat---
export const CONV_ID_KEY = "ai-terminal-conversation-id";
export const SYSTEM_INSTR_KEY = "ai-terminal-system-instruction";
export const HISTORY_KEY = "gemini_terminal_history";
export const CONVERSATION_RESPONSES_KEY = "ai-terminal-conv-history";

export const CHAT_CONFIGURATION = {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  CONVERSATION_LIST_LIMIT,
  CONVERSATION_HISTORY_LIMIT,
  TYPE_SPEED_MS,
};
