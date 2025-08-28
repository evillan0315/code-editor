import { apiFetch } from '@/services/apiFetch';
import { base64ToBlob } from '@/utils/fileTree'; // Assuming this utility exists and works
import {
  API_ENDPOINTS,
  BASE_URL_API,
  SOCKET_EVENTS_MERGED,
  EVENT_PREFIX,
} from '@/constants';
// --- Import all necessary types from src/types/chat.ts ---
import type {
  PaginationParams,
  PaginatedResponse,
  ConversationSummary,
  ConversationHistoryItem,
  SendMessageResponse,
  FileData,
  ChatRequestPayload,
  ConversationPart, // Also import ConversationPart as it's used within ModelResponse
} from '@/types/chat';
export const utilsService = {
  async formatCode(code: string, language: string): Promise<any> {
    const formatted = await apiFetch<FileWriteRequest>(
      API_ENDPOINTS._UTILS.FORMAT_CODE,
      {
        method: 'POST',
        body: { code, language },
        responseType: 'json',
      },
    );
    return formatted;
  },
};
