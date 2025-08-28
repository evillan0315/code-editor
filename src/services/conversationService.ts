import { apiFetch } from '@/services/apiFetch';
import { base64ToBlob } from '@/utils/fileTree'; // Assuming this utility exists and works

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

export const conversationService = {
  conversation: {
    /**
     * Fetches a paginated list of conversation summaries, with optional search and request type filters.
     * @param params Pagination and filter parameters (page, limit, search, requestType).
     * @returns A promise resolving to a paginated response of conversation summaries.
     */
    list(
      params: PaginationParams, // Using imported PaginationParams
    ): Promise<PaginatedResponse<ConversationSummary>> {
      // Build query parameters dynamically
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append('page', params.page.toString());
      if (params.limit !== undefined)
        queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search); // Add search query
      if (params.requestType)
        queryParams.append('requestType', params.requestType); // Add request type filter

      return apiFetch(
        `/api/conversations?${queryParams.toString()}`, // Use constructed query string
        {
          method: 'GET',
        },
      );
    },

    /**
     * Fetches the paginated history of a specific conversation.
     * @param conversationId The ID of the conversation.
     * @param params Pagination parameters (page, limit).
     * @returns A promise resolving to a paginated response of conversation history items.
     */
    getHistory(
      conversationId: string,
      params: PaginationParams, // Using imported PaginationParams
    ): Promise<PaginatedResponse<ConversationHistoryItem>> {
      // Build query parameters dynamically for history as well (though currently only page/limit)
      const queryParams = new URLSearchParams();
      if (params.page !== undefined)
        queryParams.append('page', params.page.toString());
      if (params.limit !== undefined)
        queryParams.append('limit', params.limit.toString());
      // If you decide to add search/filters to history later, they would go here.

      return apiFetch(
        `/api/conversations/${conversationId}/history?${queryParams.toString()}`,
        {
          method: 'GET',
        },
      );
    },

    /**
     * Sends a message to the Gemini AI, handling text, image (Base64), or file uploads.
     * Prioritizes file upload > Base64 image > plain text.
     * @param payload The chat request payload containing prompt, optional files/image, system instruction, and conversation ID.
     * @returns A promise resolving to the structured SendMessageResponse.
     */
    async sendMessage(
      payload: ChatRequestPayload, // Using imported ChatRequestPayload
    ): Promise<SendMessageResponse> {
      // Using imported SendMessageResponse
      let modelContent: string;

      // Prioritize file upload if filesData is provided
      if (payload.filesData && payload.filesData.length > 0) {
        // The backend controller for 'generate-file' only supports a single file per request.
        // If multiple files are provided on the client, we send only the first one.
        // For multi-file support, the backend controller would need to be adapted (e.g., using FilesInterceptor).
        modelContent = await generateGeminiFile(
          payload.prompt,
          payload.filesData[0], // Pass only the first file
          payload.systemInstruction, // Using systemInstruction from payload
          payload.conversationId,
        );
      } else if (payload.imageBase64) {
        // If no file is provided, check for a Base64 image
        modelContent = await generateGeminiImageBase64(
          payload.prompt,
          payload.imageBase64,
          payload.systemInstruction, // Using systemInstruction from payload
          payload.conversationId,
        );
      } else {
        // Fallback to simple text generation if no file or image is provided
        modelContent = await generateGeminiText(
          payload.prompt,
          payload.systemInstruction, // Using systemInstruction from payload
          payload.conversationId,
        );
      }

      // Construct the response in a structured format expected by the client UI
      const res: SendMessageResponse = {
        modelResponse: {
          parts: [{ text: modelContent } as ConversationPart], // Ensure parts adhere to ConversationPart structure
          role: 'model',
          createdAt: new Date().toISOString(), // Timestamp for client-side display
        },
        conversationId: payload.conversationId, // Pass through the conversation ID
      };
      return res;
    },
  },
};
