// src/services/apiFetch.ts
import {
  API_URL,
  API_ENDPOINTS,
  EVENT_PREFIX,
} from "@/constants"; // Import constants for routing
import { FileService } from "@/services/fileWebsocketService"; // Import the FileService class
import { configureFileService } from "@/services/apiWebsocketService";

//const BASE_API_URL = import.meta.env.BASE_URL_API || "http://localhost:5000";
//export const API_URL = `${BASE_URL_API}`;

// Token getter function
let _getToken: () => string | null = () => localStorage.getItem("token");

export function configureTokenGetter(fn: () => string | null) {
  _getToken = fn;
}

// === NEW: FileService instance and configuration ===
let _fileServiceInstance: FileService | null = null;

/**
 * Configures the FileService instance to be used by apiFetch for WebSocket operations.
 * This MUST be called with the singleton instance of FileService, typically from App.tsx.
 * @param serviceInstance The singleton FileService instance.
 */
export function configureFileService(serviceInstance: FileService) {
  _fileServiceInstance = serviceInstance;
  console.log("[apiFetch] FileService instance configured.");
}
// === END NEW ===

export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

// Response types supported by this API utility
type SupportedResponseType = "json" | "blob" | "text";

// Request options
export interface RequestOptions<T = unknown> {
  method?: HttpMethod;
  body?: T | FormData;
  isFormData?: boolean;
  responseType?: SupportedResponseType;
  headers?: HeadersInit;
  signal?: AbortSignal;
  baseURL?: string;
  // Optional: A specific WebSocket event name if you want to force WS for an endpoint
  // This is an alternative to the auto-detection logic
  wsEvent?: string;
}

// Normalized headers helper
function normalizeHeaders(init?: HeadersInit): Record<string, string> {
  if (!init) return {};
  if (init instanceof Headers) {
    const result: Record<string, string> = {};
    init.forEach((value, key) => (result[key] = value));
    return result;
  }
  if (Array.isArray(init)) return Object.fromEntries(init);
  return { ...init };
}

// Custom error class
export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly details?: T;

  constructor(message: string, status: number, details?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Main fetch function
export async function apiFetch<Res = unknown, Req = unknown>(
  endpoint: string,
  options: RequestOptions<Req> = {},
): Promise<Res> {
  const {
    method = "GET",
    body,
    // isFormData = false, // Not used for WS delegation
    responseType = "json", // Not directly used for WS delegation response
    headers: customHeaders, // Not directly used for WS delegation
    signal, // Not directly used for WS delegation
    baseURL = API_URL,
    wsEvent: explicitWsEvent, // If you add an explicit wsEvent option
  } = options;
  if (!_fileServiceInstance) {
    _fileServiceInstance = new FileService();
    _fileServiceInstance.connect();

    configureFileService(_fileServiceInstance);
  }
  // === NEW: Conditional delegation to FileService for specific operations ===
  if (_fileServiceInstance) {
    // Determine if this request should be handled by FileService (WebSocket)
    // This mapping must be kept in sync with your backend's WebSocket event names
    // and your FileService's public methods.

    // Normalize endpoint path for consistent comparison
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

    let wsEvent: string | undefined;

    // A more robust mapping for WebSocket-handled endpoints
    if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.GET_FILES)) {
      wsEvent = EVENT_PREFIX.GET_FILES;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.READ_FILE)) {
      wsEvent = EVENT_PREFIX.READ_FILE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.WRITE_FILE)) {
      wsEvent = EVENT_PREFIX.WRITE_FILE;
    } else if (normalizedEndpoint.includes("/api/files/delete")) {
      // These are the new methods you added
      wsEvent = EVENT_PREFIX.DELETE_FILES;
    } else if (normalizedEndpoint.includes("/api/files/move")) {
      wsEvent = EVENT_PREFIX.MOVE_FILE;
    } else if (normalizedEndpoint.includes("/api/files/upload")) {
      wsEvent = EVENT_PREFIX.UPLOAD_FILE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._UTILS.FORMAT_CODE)) {
      wsEvent = EVENT_PREFIX.FORMAT_CODE;
    } else if (
      normalizedEndpoint.includes(API_ENDPOINTS._GOOGLE_GEMINI.OPTIMIZE_CODE)
    ) {
      wsEvent = EVENT_PREFIX.OPTIMIZE_CODE;
    } else if (
      normalizedEndpoint.includes(API_ENDPOINTS._UTILS.STRIP_CODE_BLOCK)
    ) {
      wsEvent = EVENT_PREFIX.STRIP_CODE_BLOCK;
    } else if (
      normalizedEndpoint.includes(API_ENDPOINTS._UTILS.REMOVE_CODE_COMMENT)
    ) {
      wsEvent = EVENT_PREFIX.REMOVE_CODE_COMMENT;
    }

    // If a WebSocket event is determined (or explicitly provided via wsEvent option)
    if (wsEvent) {
      // || explicitWsEvent
      console.log(
        `[apiFetch] Delegating ${method} ${endpoint} to FileService (WebSocket) with event: ${wsEvent}.`,
      );
      try {
        // The `emit` method on FileService handles connection and promise logic.
        return (await _fileServiceInstance.emit({
          endpoint,
          method,
          body,
          event: wsEvent, // Use the derived or explicit WS event
        })) as Res;
        console.log(normalizedEndpoint, wsEvent);
      } catch (error: any) {
        console.error(
          `Error delegating to FileService for ${endpoint}:`,
          error,
        );
        // Re-throw as ApiError for consistency with apiFetch's error handling
        throw new ApiError(
          error.message || `WebSocket error for ${endpoint}`,
          500,
          error,
        );
      }
    }
  }
  // === END NEW ===

  // --- Original HTTP fetch logic (for non-delegated requests) ---
  const url = new URL(endpoint, baseURL).href;
  const token = _getToken();
  const headers = normalizeHeaders(customHeaders);
  console.log(url, headers);
  // Re-declare `isFormData` here if it's only used for HTTP
  const isFormData = options.isFormData || false;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;

  if (method !== "GET" && method !== "HEAD") {
    if (body instanceof FormData) {
      requestBody = body;
      delete headers["Content-Type"]; // Let browser set proper boundary
    } else if (body !== undefined) {
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    credentials: "include",
    signal,
  });

  const contentType = response.headers.get("Content-Type") || "";

  if (!response.ok) {
    let errorPayload: unknown = undefined;
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;

    try {
      if (contentType.includes("application/json")) {
        errorPayload = await response.json();
        if (typeof (errorPayload as any)?.message === "string") {
          errorMessage = (errorPayload as any).message;
        }
      } else {
        const text = await response.text();
        if (text) {
          errorPayload = text;
          errorMessage = text;
        }
      }
    } catch {
      // Fall back to default error message
    }

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  if (response.status === 204 || !contentType) {
    return undefined as Res;
  }

  switch (responseType) {
    case "blob":
      return (await response.blob()) as Res;
    case "text":
      return (await response.text()) as Res;
    case "json":
    default:
      if (contentType.includes("application/json")) {
        return (await response.json()) as Res;
      }
      throw new ApiError(
        `Expected JSON response for ${url}, received ${contentType}`,
        response.status,
        await response.text(),
      );
  }
}
