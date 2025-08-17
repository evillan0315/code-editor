import { io } from "socket.io-client";
import {
  type ISocket,
  type IFileService,
  type SocketFactory,
} from "@/types/socket-interfaces";
import {
  API_ENDPOINTS,
  SOCKET_EVENTS,
  SOCKET_EVENTS_MERGED,
  EVENT_PREFIX,
  FILE_NAMESPACE,
  BASE_URL_API,
} from "@/constants";
import { showToast } from "@/stores/toast";
import {
  editorLanguage,
  editorFileTreeNodes,
} from "@/stores/editorContent";
import {
  type APIProps,
  type FileItem,
  type FileReadResponse,
  type FileWriteRequest,
  type FileMoveRequest,
  type FileDeleteRequest,
  type FileUploadRequest,
} from "@/types/file-system";
import {
  updateFileContent as updateFileContentInTree,
} from "@/utils/fileTree";

/**
 * Service for interacting with file-related operations via WebSockets.
 * Handles connections, file system operations, and editor tool integrations.
 * Directly updates Nanostores for editor state management.
 * Implements IFileService interface for type safety and mockability.
 */
export class FileService implements IFileService {
  private socket?: ISocket;
  private readonly namespace: string = FILE_NAMESPACE;
  private readonly base: string;
  private readonly socketFactory: SocketFactory;

  constructor(
    socketFactory: SocketFactory = (uri, opts) => io(uri, opts) as ISocket,
  ) {
    this.base = BASE_URL_API.replace(/\/$/, "");
    this.socketFactory = socketFactory;
  }

  /**
   * Establishes a WebSocket connection.
   * If a connection already exists, it returns the existing socket.
   * Sets up common socket event listeners for connection status and general progress.
   * @returns The connected Socket instance.
   */
  public connect(): ISocket {
    if (this.socket) {
      return this.socket;
    }

    const token = localStorage.getItem("token");
    const uri = `${BASE_URL_API}${this.namespace}`;
    const opts = {
      auth: { token: `Bearer ${token}` },
      //forceNew: true
      // Optional: Add reconnection strategies, timeouts if needed
    };

    this.socket = this.socketFactory(uri, opts);

    this.socket.on(SOCKET_EVENTS_MERGED.CONNECT, () => {
      console.log(`[✔] FileService connected: ${this.socket?.id}`);
    });
    // Handle global progress/response events that are not tied to a specific promise-based request
    this.socket.on(
      SOCKET_EVENTS.FILE_UPLOAD_PROGRESS,
      (progress: { percent: number }) => {
        /* ... */
      },
    );
    this.socket.on(
      SOCKET_EVENTS.FILE_DOWNLOAD_PROGRESS,
      (progress: { percent: number }) => {
        /* ... */
      },
    );
    this.socket.on(
      SOCKET_EVENTS_MERGED.DYNAMIC_FILE_EVENT_RESPONSE,
      (data: any) => {
        console.log(data, "SOCKET_EVENTS_MERGED.DYNAMIC_FILE_EVENT_RESPONSE");
      },
    );
    this.socket.on(
      SOCKET_EVENTS_MERGED.DYNAMIC_FILE_EVENT_PROGRESS,
      (data: any) => {
        /* ... */
      },
    );
    this.socket.on(SOCKET_EVENTS.FILE_UPLOAD_RESPONSE, (data: any) => {
      console.log("Upload complete:", data);
    });
    this.socket.on(SOCKET_EVENTS_MERGED.GET_FILES_RESPONSE, (data: any) => {
      console.log(data, "SOCKET_EVENTS_MERGED.GET_FILES_RESPONSE");
    });
    this.socket.on(SOCKET_EVENTS_MERGED.READ_FILE_RESPONSE, (data: any) => {
      console.log(data, "SOCKET_EVENTS_MERGED.READ_FILE_RESPONSE");
    });
    this.socket.on(SOCKET_EVENTS_MERGED.READ_FILE_PROGRESS, (data: any) => {
      console.log(data, "SOCKET_EVENTS_MERGED.READ_FILE_PROGRESS");
    });
    this.socket.on(SOCKET_EVENTS_MERGED.WRITE_FILE_RESPONSE, (data: any) => {
      console.log(data, "SOCKET_EVENTS_MERGED.WRITE_FILE_RESPONSE");
    });
    this.socket.on(SOCKET_EVENTS.RENAME_FILE_RESPONSE, (data: any) => {
      /* ... */
    }); // Old rename response
    this.socket.on(SOCKET_EVENTS.FORMAT_CODE_RESPONSE, (data: any) => {
      /* ... */
    });
    this.socket.on(SOCKET_EVENTS.OPTIMIZE_CODE_RESPONSE, (data: any) => {
      /* ... */
    });
    this.socket.on(SOCKET_EVENTS.REMOVE_CODE_COMMENT_RESPONSE, (data: any) => {
      /* ... */
    });
    // New handlers for delete, move, upload responses (these typically trigger FS_CHANGE events from server)
    this.socket.on(SOCKET_EVENTS.DELETE_FILES_RESPONSE, (data: any) => {
      console.log("Delete files response:", data);
    });
    this.socket.on(SOCKET_EVENTS.MOVE_FILE_RESPONSE, (data: any) => {
      console.log("Move file response:", data);
    });
    this.socket.on(SOCKET_EVENTS.UPLOAD_FILE_RESPONSE, (data: any) => {
      console.log("Upload file response:", data);
    });

    this.socket.on(SOCKET_EVENTS_MERGED.DISCONNECT, () => {
      console.log(`FileService disconnected: ${this.socket?.id}`);
    });
    this.socket.on(SOCKET_EVENTS_MERGED.CONNECT_ERROR, (err: Error) => {
      console.error(`FileService connection error: ${err.message}`);
      showToast(`Connection Error: ${err.message}`, "error");
    });

    return this.socket;
  }

  /**
   * Disconnects the WebSocket connection.
   */
  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  /**
   * Emits a dynamic file event to the server and returns a Promise
   * that resolves with the response or rejects with an error.
   * Uses `socket.once` to prevent accumulating listeners for single request-response cycles.
   * @param data - The APIProps containing endpoint, method, body, and the specific event name.
   * @returns A Promise that resolves with the response data or rejects with an Error.
   */
  private emitDynamicFileEvent<T = any>(data: APIProps): Promise<T> {
    // Attempt to connect if not already connected. This ensures ops can be called without manual connect.
    if (!this.socket?.connected) {
      this.connect();
      if (!this.socket?.connected) {
        return Promise.reject(
          new Error("Socket not connected for emitting event."),
        );
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        // Should be connected now, but a final check
        return reject(new Error("Socket not available for emitting event."));
      }

      this.socket.emit(SOCKET_EVENTS.DYNAMIC_FILE_EVENT, data);

      const responseEvent = `${data.event}Response`;
      const errorEvent = `${data.event}Error`;
      console.log(responseEvent, data);
      // Define a cleanup function to remove listeners after resolution/rejection
      const cleanup = () => {
        this.socket?.off(responseEvent);
        this.socket?.off(errorEvent);
      };

      this.socket.on(responseEvent, (res: T) => {
        //cleanup();
        resolve(res);
      });

      this.socket.once(errorEvent, (err: any) => {
        //cleanup();
        console.error(`${data.event}Error received:`, err);
        // Ensure error is an Error object for consistent rejection
        reject(
          new Error(err?.message || `Unknown error for event: ${data.event}`),
        );
      });
    });
  }
  public async emit<T = any>(data: APIProps): Promise<T> {
    return this.emitDynamicFileEvent<T>(data);
  }
  /**
   * Fetches children for a specific directory.
   * @param directoryPath - The path of the directory to list children for.
   * @returns A Promise resolving to an array of FileItem representing the directory's children.
   */
  public async fetchDirectoryChildren(
    directoryPath: string,
  ): Promise<FileItem[]> {
    const response = await this.emitDynamicFileEvent<FileItem[]>({
      endpoint: `${API_ENDPOINTS._FILE.GET_FILES}?directory=${encodeURIComponent(directoryPath)}&recursive=false`,
      method: "GET",
      event: EVENT_PREFIX.LIST_DIRECTORY_CHILDREN,
    });
    return response;
  }

  

  /**
   * Reads file content from the backend.
   * Updates `editorLanguage` store based on the backend response.
   * @param filePath - The path of the file to read.
   * @returns A Promise resolving to an object containing the file's content and language.
   */
  public async loadFile(filePath: string): Promise<FileReadResponse> {
    try {
      const response = await this.emitDynamicFileEvent<FileReadResponse>({
        endpoint: API_ENDPOINTS._FILE.READ_FILE_CONTENT,
        method: "POST",
        body: { filePath },
        event: EVENT_PREFIX.READ_FILE,
      });

      if (!response || typeof response.content !== "string") {
        showToast(`${filePath} does not exist or invalid content.`, "error");
        throw new Error(
          "Invalid response from readFile: missing content or not a string.",
        );
      }
      if (response.language) {
        editorLanguage.set(response.language);
      } else {
        editorLanguage.set("plain");
      }
      return response;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Saves file content to the backend.
   * Updates the `editorFileTreeNodes` cache with the new content upon successful save.
   * @param filePath - The path of the file to save.
   * @param content - The content string to write to the file.
   * @returns A Promise that resolves when the file is successfully saved.
   */
  public async saveFile(filePath: string, content: string): Promise<void> {
    const writeRequest: FileWriteRequest = { filePath, content };
    try {
      await this.emitDynamicFileEvent({
        endpoint: API_ENDPOINTS._FILE.WRITE_FILE_CONTENT,
        method: "POST",
        body: writeRequest,
        event: EVENT_PREFIX.SAVE_FILE,
      });

      // Update cached content for this file in the fileTree store
      const currentFileTree = editorFileTreeNodes.get();
      const updatedTree = updateFileContentInTree(
        filePath,
        content,
        currentFileTree,
      );
      editorFileTreeNodes.set(updatedTree);

      showToast(`File ${filePath} saved successfully.`, "success");
    } catch (error: any) {
      console.error(`Error saving file ${filePath}:`, error);
      showToast(`Error saving file ${filePath}: ${error.message}`, "error");
      throw error;
    }
  }

  // --- New Methods for TanStack Query ---

  /**
   * Deletes one or more files/folders on the backend.
   * @param paths - An array of paths to delete.
   * @returns A Promise that resolves when the deletion is successful.
   */
  public async delete(paths: FileDeleteRequest): Promise<void> {
    try {
      await this.emitDynamicFileEvent({
        endpoint: `/files/delete`, // Example endpoint (adjust to your backend)
        method: "POST", // Or 'DELETE' depending on your backend's API design
        body: { paths }, // Send paths in the body
        event: EVENT_PREFIX.DELETE_FILES,
      });
      // Backend should emit FS_CHANGE_DELETED event, which useEditorExplorerActions will handle
      showToast(`Deleted ${paths.length} item(s).`, "success");
    } catch (error: any) {
      console.error(`Error deleting files ${paths}:`, error);
      showToast(`Error deleting: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Moves or renames a file/folder on the backend.
   * @param request - An object containing oldPath and newPath.
   * @returns A Promise that resolves when the operation is successful.
   */
  public async move(request: FileMoveRequest): Promise<void> {
    try {
      await this.emitDynamicFileEvent({
        endpoint: `/files/move`, // Example endpoint (adjust to your backend)
        method: "POST", // Or 'PUT' or 'PATCH'
        body: request,
        event: EVENT_PREFIX.MOVE_FILE,
      });
      // Backend should emit FS_CHANGE_RENAMED event, which useEditorExplorerActions will handle
      showToast(
        `Moved/Renamed ${request.oldPath.split("/").pop()} to ${request.newPath.split("/").pop()}.`,
        "success",
      );
    } catch (error: any) {
      console.error(`Error moving file ${request.oldPath}:`, error);
      showToast(`Error moving/renaming: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Uploads a file to the backend.
   * @param request - An object containing filePath and content (for mock simplicity).
   * @returns A Promise that resolves when the upload is successful.
   */
  public async upload(request: FileUploadRequest): Promise<void> {
    try {
      await this.emitDynamicFileEvent({
        endpoint: `/files/upload`, // Example endpoint (adjust to your backend)
        method: "POST",
        body: request,
        event: EVENT_PREFIX.UPLOAD_FILE,
      });
      // Backend should emit FS_CHANGE_CREATED event if new file, or FS_CHANGE_MODIFIED if existing
      showToast(`Uploaded ${request.filePath.split("/").pop()}.`, "success");
    } catch (error: any) {
      console.error(`Error uploading file ${request.filePath}:`, error);
      showToast(`Error uploading: ${error.message}`, "error");
      throw error;
    }
  }

  public async formatCode(content: string, language: string): Promise<string> {
    try {
      const response = await this.emitDynamicFileEvent<{ content: string }>({
        endpoint: API_ENDPOINTS._UTILS.FORMAT_CODE,
        method: "POST",
        body: { content, language },
        event: EVENT_PREFIX.FORMAT_CODE,
      });
      if (response && typeof response.content === "string") {
        showToast(`Code formatted successfully.`, "success");
        return response.content;
      }
      throw new Error(
        "Invalid response from formatCode: missing content or not a string.",
      );
    } catch (error: any) {
      console.error(`Error formatting code:`, error);
      showToast(`Error formatting code: ${error.message}`, "error");
      throw error;
    }
  }
  public async optimizeCode(
    content: string,
    language: string,
  ): Promise<string> {
    try {
      const optimizedResponse = await this.emitDynamicFileEvent<{
        content: string;
      }>({
        endpoint: API_ENDPOINTS._GOOGLE_GEMINI.OPTIMIZE_CODE,
        method: "POST",
        body: { content, language },
        event: EVENT_PREFIX.OPTIMIZE_CODE,
      });

      if (optimizedResponse && typeof optimizedResponse.content === "string") {
        const strippedContent = await this.stripCodeBlock(
          optimizedResponse.content,
        );
        showToast(`Code optimized successfully.`, "success");
        return strippedContent;
      }
      throw new Error(
        "Invalid response from optimizeCode: missing content or not a string.",
      );
    } catch (error: any) {
      console.error(`Error optimizing code:`, error);
      showToast(`Error optimizing code: ${error.message}`, "error");
      throw error;
    }
  }
  public async stripCodeBlock(content: string): Promise<string> {
    try {
      const response = await this.emitDynamicFileEvent<{ content: string }>({
        endpoint: API_ENDPOINTS._UTILS.STRIP_CODE_BLOCK,
        method: "POST",
        body: { content },
        event: EVENT_PREFIX.STRIP_CODE_BLOCK,
      });
      if (response && typeof response.content === "string") {
        return response.content;
      }
      throw new Error(
        "Invalid response from stripCodeBlock: missing content or not a string.",
      );
    } catch (error: any) {
      console.error(`Error stripping code blocks:`, error);
      showToast(`Error stripping code blocks: ${error.message}`, "error");
      throw error;
    }
  }
  public async removeCodeComment(
    content: string,
    language: string,
  ): Promise<string> {
    try {
      const response = await this.emitDynamicFileEvent<{ content: string }>({
        endpoint: API_ENDPOINTS._UTILS.REMOVE_CODE_COMMENT,
        method: "POST",
        body: { content, language },
        event: EVENT_PREFIX.REMOVE_CODE_COMMENT,
      });

      if (!response || typeof response.content !== "string") {
        showToast(`Failed to remove comments. Invalid response.`, "error");
        throw new Error(
          "Invalid response from removeCodeComment: missing content or not a string.",
        );
      }
      showToast(`Comments removed successfully.`, "success");
      return response.content;
    } catch (error: any) {
      console.error(`Error removing code comments:`, error);
      showToast(`Error removing comments: ${error.message}`, "error");
      throw error;
    }
  }
}
