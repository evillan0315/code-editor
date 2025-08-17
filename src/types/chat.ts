export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationSummary {
  conversationId: string;
  lastUpdatedAt: string;
  requestCount: number;
  firstPrompt: string;
}

export interface ConversationPart {
  text?: string;
  inlineData?: {
    mime_type: string;
    data: string;
  };
}

export interface ConversationHistoryItem {
  id: string; /* ADDED: Unique identifier for the message */
  role: 'user' | 'model';
  parts: ConversationPart[];
  createdAt: string;
}

export interface ModelResponse {
  parts: ConversationPart[];
  role: 'model';
  createdAt: string;
}

export interface FileData {
  data: string;
  type: string;
  name: string;
}

export interface ChatRequestPayload {
  prompt: string;
  filesData?: FileData[];
  imageBase64?: string;
  systemInstruction?: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  modelResponse: ModelResponse;
  conversationId?: string;
}
