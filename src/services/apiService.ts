// src/services/apiService.ts
import { apiFetch } from "@/services/apiFetch";
import { base64ToBlob } from "@/utils/fileTree"; // Assuming this utility exists and works

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
} from "@/types/chat";

/**
 * Calls the Gemini API to generate text from a simple text prompt.
 * @param prompt The user's text prompt.
 * @param systemInstruction Optional system instruction for the model.
 * @param conversationId Optional ID of an ongoing conversation.
 * @returns A promise that resolves to the generated text content (string).
 */
export async function generateGeminiText(
  prompt: string,
  systemInstruction?: string,
  conversationId?: string,
): Promise<string> {
  const endpoint = "/api/gemini/file/generate-text";

  try {
    const payload: {
      prompt: string;
      systemInstruction?: string;
      conversationId?: string;
    } = { prompt }; // Matches GenerateTextDto structure from controller

    // Conditionally add optional parameters to avoid sending undefined values
    if (systemInstruction !== undefined) {
      payload.systemInstruction = systemInstruction;
    }
    if (conversationId !== undefined) {
      payload.conversationId = conversationId;
    }

    const response = await apiFetch<string>(endpoint, {
      method: "POST",
      body: payload,
      responseType: "text", // Expecting a plain text string response
      headers: {
        "Content-Type": "application/json", // Specify content type for JSON body
      },
    });
    return response; // apiFetch will return the plain text string directly
  } catch (error) {
    console.error(`Error calling Gemini Text API (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Calls the Gemini API to generate text from a prompt with an embedded Base64 image.
 * This function handles sending the image directly as a Base64 string in the request body.
 * @param prompt The user's text prompt.
 * @param imageBase64 The Base64 encoded string of the image.
 * @param systemInstruction Optional system instruction for the model.
 * @param conversationId Optional ID of an ongoing conversation.
 * @returns A promise that resolves to the generated text content (string).
 */
export async function generateGeminiImageBase64(
  prompt: string,
  imageBase64: string,
  systemInstruction?: string,
  conversationId?: string,
): Promise<string> {
  const endpoint = "/api/gemini/file/generate-image-base64";

  try {
    const payload: {
      prompt: string;
      imageBase64: string;
      systemInstruction?: string;
      conversationId?: string;
    } = { prompt, imageBase64 }; // Matches GenerateImageBase64Dto structure from controller

    // Conditionally add optional parameters
    if (systemInstruction !== undefined) {
      payload.systemInstruction = systemInstruction;
    }
    if (conversationId !== undefined) {
      payload.conversationId = conversationId;
    }

    const response = await apiFetch<string>(endpoint, {
      method: "POST",
      body: payload,
      responseType: "text", // Expecting a plain text string response
      headers: {
        "Content-Type": "application/json", // Specify content type for JSON body
      },
    });
    return response; // apiFetch will return the plain text string directly
  } catch (error) {
    console.error(
      `Error calling Gemini Image Base64 API (${endpoint}):`,
      error,
    );
    throw error;
  }
}

/**
 * Calls the Gemini API to generate text from a prompt with an uploaded file.
 * This function uses FormData to send the file as 'multipart/form-data'.
 * @param prompt The user's text prompt.
 * @param fileData The file's data including base64 content, type (MIME), and name.
 * @param systemInstruction Optional system instruction for the model.
 * @param conversationId Optional ID of an ongoing conversation.
 * @returns A promise that resolves to the generated text content (string).
 */
export async function generateGeminiFile(
  prompt: string,
  fileData: FileData, // Now using the imported FileData type
  systemInstruction?: string,
  conversationId?: string,
): Promise<string> {
  const endpoint = "/api/gemini/file/generate-file";

  try {
    const formData = new FormData();
    formData.append("prompt", prompt);

    // Convert base64 file data to Blob and append to FormData
    // The 'file' field name must match the @UploadedFile() decorator in the NestJS controller.
    const blob = base64ToBlob(fileData.data, fileData.type);
    formData.append("file", blob, fileData.name);

    // Conditionally append optional parameters
    if (systemInstruction !== undefined) {
      formData.append("systemInstruction", systemInstruction);
    }
    if (conversationId !== undefined) {
      formData.append("conversationId", conversationId);
    }

    const response = await apiFetch<string>(endpoint, {
      method: "POST",
      body: formData,
      responseType: "text", // Expecting a plain text string response
      // Do NOT manually set 'Content-Type': 'multipart/form-data' header;
      // the browser handles it automatically with the correct boundary when FormData is used.
    });
    return response; // apiFetch will return the plain text string directly
  } catch (error) {
    console.error(`Error calling Gemini File API (${endpoint}):`, error);
    throw error;
  }
}

export const apiService = {
  conversation: {
    /**
     * Fetches a paginated list of conversation summaries.
     * @param params Pagination parameters (page, limit).
     * @returns A promise resolving to a paginated response of conversation summaries.
     */
    list(
      params: PaginationParams, // Using imported PaginationParams
    ): Promise<PaginatedResponse<ConversationSummary>> {
      // Using imported PaginatedResponse and ConversationSummary
      return apiFetch(
        `/api/conversations?page=${params.page}&limit=${params.limit}`,
        {
          method: "GET",
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
      // Using imported PaginatedResponse and ConversationHistoryItem
      return apiFetch(
        `/api/conversations/${conversationId}/history?page=${params.page}&limit=${params.limit}`,
        {
          method: "GET",
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
          role: "model",
          createdAt: new Date().toISOString(), // Timestamp for client-side display
        },
        conversationId: payload.conversationId, // Pass through the conversation ID
      };
      return res;
    },
  },
};
