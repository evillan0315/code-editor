export enum RequestType {
  TEXT_ONLY = 'TEXT_ONLY',
  TEXT_WITH_IMAGE = 'TEXT_WITH_IMAGE',
  TEXT_WITH_FILE = 'TEXT_WITH_FILE',
  LLM_GENERATION = 'LLM_GENERATION',
  LIVE_API = 'LIVE_API',
  RESUME_GENERATION = 'RESUME_GENERATION',
  RESUME_OPTIMIZATION = 'RESUME_OPTIMIZATION',
  RESUME_ENHANCEMENT = 'RESUME_ENHANCEMENT',
  VIDEO_GENERATION = 'VIDEO_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string; 
  requestType?: RequestType | null; 
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
  firstRequestType?: RequestType | null; 
}

export interface ConversationPart {
  text?: string;
  inlineData?: {
    mime_type: string;
    data: string;
  };
}

export interface ConversationHistoryItem {
  id: string /* ADDED: Unique identifier for the message */;
  role: 'user' | 'model';
  parts: ConversationPart[];
  createdAt: string;
  requestType?: RequestType; 
}

export interface ModelResponse {
  parts: ConversationPart[];
  role: 'model';
  createdAt: string;
  requestType?: RequestType;
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
