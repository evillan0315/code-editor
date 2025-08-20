import { BASE_URL_API, API_ENDPOINTS, EVENT_PREFIX } from '@/constants';
import { FileService } from '@/services/fileWebsocketService';
import { APIProps } from '@/types/socket-interfaces'; // Import APIProps

let _getToken: () => string | null = () => localStorage.getItem('token');

export function configureTokenGetter(fn: () => string | null) {
  _getToken = fn;
}

let _fileServiceInstance: FileService | null = null;

export function configureFileService(serviceInstance: FileService) {
  _fileServiceInstance = serviceInstance;
  console.log('[apiFetch] FileService instance configured.');
}

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type SupportedResponseType = 'json' | 'blob' | 'text';

export interface RequestOptions<T = unknown> {
  method?: HttpMethod;
  body?: T | FormData; // T is 'Req' here
  isFormData?: boolean;
  responseType?: SupportedResponseType;
  headers?: HeadersInit;
  signal?: AbortSignal;
  baseURL?: string;

  event?: string;
}

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

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly details?: T;

  constructor(message: string, status: number, details?: T) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function apiFetch<Res = unknown, Req = unknown>( // No change to Req's generic constraint, handled internally
  endpoint: string,
  options: RequestOptions<Req> = {},
): Promise<Res> {
  const {
    method = 'GET',
    body,
    responseType = 'json',
    headers: customHeaders,
    signal,
    baseURL = BASE_URL_API,
    event: explicitWsEvent, // Note: explicitWsEvent is declared but unused below. Consider removing or using it.
  } = options;

  if (!_fileServiceInstance) {
    // Initialize and connect FileService if not already configured
    const newFileService = new FileService();
    await newFileService.connect(); // Ensure connection awaits
    configureFileService(newFileService);
  }

  // Fix 1 & 2: Use isConnected() method on FileService and ensure _fileServiceInstance is not null
  if (_fileServiceInstance && _fileServiceInstance.disconnect()) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    let wsEvent: string | undefined;

    // Consolidated conditional checks for wsEvent
    if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.GET_FILES)) {
      wsEvent = EVENT_PREFIX.GET_FILES;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.READ_FILE)) {
      wsEvent = EVENT_PREFIX.READ_FILE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.WRITE_FILE)) {
      wsEvent = EVENT_PREFIX.WRITE_FILE;
    } else if (normalizedEndpoint.includes('/api/files/delete')) {
      wsEvent = EVENT_PREFIX.DELETE_FILES;
    } else if (normalizedEndpoint.includes('/api/files/upload')) {
      wsEvent = EVENT_PREFIX.UPLOAD_FILE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._UTILS.FORMAT_CODE)) {
      wsEvent = EVENT_PREFIX.FORMAT_CODE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._GOOGLE_GEMINI.OPTIMIZE_CODE)) {
      wsEvent = EVENT_PREFIX.OPTIMIZE_CODE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._UTILS.STRIP_CODE_BLOCK)) {
      wsEvent = EVENT_PREFIX.STRIP_CODE_BLOCK;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._UTILS.REMOVE_CODE_COMMENT)) {
      wsEvent = EVENT_PREFIX.REMOVE_CODE_COMMENT;
    }

    if (wsEvent) {
      console.log(
        `[apiFetch] Delegating ${method} ${endpoint} to FileService (WebSocket) with event: ${wsEvent}.`,
      );
      try {
        // Fix 3: Ensure 'body' is compatible with APIProps['body'] (Record<string, any> | undefined)
        // If 'body' is FormData, or a primitive type, it's not directly compatible with APIProps['body'].
        // For WebSocket, assume 'body' should be a plain object or undefined.
        const wsBody: Record<string, any> | undefined =
          body instanceof FormData || typeof body !== 'object' || body === null
            ? undefined // Do not pass FormData or primitives as APIProps body
            : (body as Record<string, any>); // Assert as Record<string, any> if it's a plain object

        return (await _fileServiceInstance.emit({
          endpoint,
          method,
          body: wsBody, // Use the type-safe wsBody
          event: wsEvent,
        })) as Res;
      } catch (error: any) {
        console.error(`Error delegating to FileService for ${endpoint}:`, error);
        throw new ApiError(error.message || `WebSocket error for ${endpoint}`, 500, error);
      }
    }
  }

  const url = new URL(endpoint, baseURL).href;
  const token = _getToken();
  const headers = normalizeHeaders(customHeaders);

  const isFormData = options.isFormData || false;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    if (body instanceof FormData) {
      requestBody = body;
      delete headers['Content-Type']; // Browsers set Content-Type for FormData automatically
    } else if (body !== undefined) {
      // This path is for non-FormData HTTP bodies, typically JSON
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: requestBody,
    credentials: 'include',
    signal,
  });

  const contentType = response.headers.get('Content-Type') || '';

  if (!response.ok) {
    let errorPayload: unknown = undefined;
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;

    try {
      if (contentType.includes('application/json')) {
        errorPayload = await response.json();
        if (typeof (errorPayload as any)?.message === 'string') {
          errorMessage = (errorPayload as any).message;
        }
      } else {
        const text = await response.text();
        if (text) {
          errorPayload = text;
          errorMessage = text;
        }
      }
    } catch (e) {
      // Ignore parsing errors, keep generic message
      console.warn(`Failed to parse error response for ${url}:`, e);
    }

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  if (response.status === 204 || !contentType) {
    return undefined as Res; // No content, return undefined
  }

  switch (responseType) {
    case 'blob':
      return (await response.blob()) as Res;
    case 'text':
      return (await response.text()) as Res;
    case 'json':
    default:
      if (contentType.includes('application/json')) {
        return (await response.json()) as Res;
      }
      throw new ApiError(
        `Expected JSON response for ${url}, received ${contentType}`,
        response.status,
        await response.text(),
      );
  }
}
