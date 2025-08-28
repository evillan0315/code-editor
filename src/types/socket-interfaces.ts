import {
  FileItem,
  FileReadResponse,
  FileMoveRequest,
  FileDeleteRequest,
  FileUploadRequest,
} from './file-system';
import { HttpMethod, ResponseType } from './http';
export interface TerminalConnectPayload {
  terminalId: string;
  initialCwd?: string; // Added initialCwd to allow setting CWD on connect
}

export interface TerminalOutputPayload {
  terminalId: string;
  data: string;
}

export interface TerminalInputPayload {
  terminalId: string;
  input: string;
}

export interface TerminalCwdChangePayload {
  terminalId: string;
  cwd: string;
}

// Example of a union type for all socket messages (if used)
export type TerminalSocketMessage =
  | { type: 'terminal:connect'; payload: TerminalConnectPayload }
  | { type: 'terminal:output'; payload: TerminalOutputPayload }
  | { type: 'terminal:input'; payload: TerminalInputPayload }
  | { type: 'terminal:cwd_change'; payload: TerminalCwdChangePayload };

// This import path should be correct for your project

/**
 * Simplified interface for socket.io-client's Socket.
 * Only includes methods used by our FileService.
 */
export interface ISocket {
  id?: string;
  connected: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener?: (...args: any[]) => void): this; // Added off method for cleanup
  emit(event: string, ...args: any[]): this;
  disconnect(): this;
  connect(): this;
}

/**
 * Props for emitting a dynamic file event to the backend.
 * @property endpoint - The backend API endpoint (e.g., '/files/read').
 * @property method - The HTTP method associated with the operation (e.g., 'POST').
 * @property body - The request payload.
 * @property event - The specific event name used for server-side routing (e.g., 'readFile').
 * @property requestId - (Optional) A unique client-generated ID for request-response correlation.
 */
export type APIProps = {
  endpoint: string;
  method: HttpMethod;
  body?: Record<string, any>;
  event: string;
  responseType?: ResponseType;
  headers?: HeadersInit;
  signal?: AbortSignal;
  requestId?: string; // Client-generated unique ID for request-response correlation
};

/**
 * Expected payload structure for dynamic file event responses from the server.
 * @property requestId - The original request ID to correlate with client-side promises.
 * @property event - The original event name (e.g., 'readFile').
 * @property status - 'success' or 'error' indicating the operation's outcome.
 * @property data - The response data on success.
 * @property error - Error details on failure.
 */
export interface DynamicFileEventResponsePayload<T = any> {
  requestId: string;
  event: string; // Original event name like 'readFile'
  status: 'success' | 'error';
  data?: T;
  error?: { message: string; statusCode?: number; details?: any };
}

/**
 * Interface for the FileService class.
 * Ensures type safety and provides a contract for both real and mock implementations.
 */
export interface IFileService {
  connect(): ISocket;
  disconnect(): void;
  fetchDirectoryChildren(directoryPath: string): Promise<FileItem[]>;
  loadFile(filePath: string): Promise<FileReadResponse>; // Just fetches, returns structured response
  saveFile(filePath: string, content: string): Promise<void>; // Renamed from 'write' in original TanStack
  formatCode(content: string, language: string): Promise<string>;
  optimizeCode(content: string, language: string): Promise<string>;
  stripCodeBlock(content: string): Promise<string>;
  removeCodeComment(content: string, language: string): Promise<string>;
  // --- New methods for TanStack Query ---
  upload(request: FileUploadRequest): Promise<void>;
}

// Factory function type for socket creation
export type SocketFactory = (uri: string, opts?: any) => ISocket;

export interface SocketMessage<T = any> {
  event: string;
  payload: T;
  timestamp: string;
}

export interface GenericSocketResponse<T = any> {
  status: 'Progress' | 'Response' | 'Error';
  message?: string;
  data?: T;
  error?: string;
}

// Generic file system event payload (for FS_CHANGE events)
export interface FileSystemEventPayload {
  path: string;
  type: 'file' | 'directory';
  // For renamed events
  oldPath?: string;
  newPath?: string;
  // For modified events
  content?: string; // e.g., if a file modification sends content diff or full content
}

// Specific payloads for API-related events (e.g., FILE_CREATE_RESPONSE)
export interface FileOperationPayload {
  filePath: string;
  content?: string;
  oldPath?: string;
  newPath?: string;
  message?: string;
  error?: string;
}

export interface LintPayload {
  filePath: string;
  issues: any[]; // Adjust with actual ESLint issue type
}

export interface CodeGenerationPayload {
  prompt: string;
  generatedCode: string;
}

// ... add more specific interfaces as needed for other event groups

/**
 * A map defining the payload types for all known WebSocket events.
 * Keys correspond to the actual camelCase event strings (values from SOCKET_EVENTS_MERGED).
 * This provides strong type checking for `on` and `emit` methods in the WebSocket service.
 */
export interface DetailedSocketEventPayloadMap {
  // Connection events
  connect: undefined;
  disconnect: string; // reason
  connect_error: Error;

  // File system watcher events
  fsChangeCreated: FileSystemEventPayload;
  fsChangeDeleted: FileSystemEventPayload;
  fsChangeRenamed: FileSystemEventPayload;
  fsChangeModified: FileSystemEventPayload;

  // API-derived events (examples for clarity, extend as needed)
  // FILE events
  fileCreateProgress: GenericSocketResponse<FileOperationPayload>;
  fileCreateResponse: GenericSocketResponse<FileOperationPayload>;
  fileCreateError: GenericSocketResponse<FileOperationPayload>;

  fileReadProgress: GenericSocketResponse<
    FileOperationPayload & { content: string }
  >;
  fileReadResponse: GenericSocketResponse<
    FileOperationPayload & { content: string }
  >;
  fileReadError: GenericSocketResponse<FileOperationPayload>;

  fileWriteProgress: GenericSocketResponse<FileOperationPayload>;
  fileWriteResponse: GenericSocketResponse<FileOperationPayload>;
  fileWriteError: GenericSocketResponse<FileOperationPayload>;

  fileDeleteProgress: GenericSocketResponse<FileOperationPayload>;
  fileDeleteResponse: GenericSocketResponse<FileOperationPayload>;
  fileDeleteError: GenericSocketResponse<FileOperationPayload>;

  fileRenameProgress: GenericSocketResponse<FileOperationPayload>;
  fileRenameResponse: GenericSocketResponse<FileOperationPayload>;
  fileRenameError: GenericSocketResponse<FileOperationPayload>;

  // ESLINT events (example)
  eslintLintCodeProgress: GenericSocketResponse<LintPayload>;
  eslintLintCodeResponse: GenericSocketResponse<LintPayload>;
  eslintLintCodeError: GenericSocketResponse<LintPayload>;

  // GOOGLE_GEMINI events (example)
  googleGeminiGenerateCodeProgress: GenericSocketResponse<CodeGenerationPayload>;
  googleGeminiGenerateCodeResponse: GenericSocketResponse<CodeGenerationPayload>;
  googleGeminiGenerateCodeError: GenericSocketResponse<CodeGenerationPayload>;

  // Catch-all for any other event not explicitly typed above
  [key: string]: any;
}
