import { API_URL, API_ENDPOINTS, EVENT_PREFIX } from '@/constants';
import { FileService } from '@/services/fileWebsocketService';
// Assuming HttpMethod and ResponseType are defined in '@/types'
import { HttpMethod, ResponseType } from '@/types';
// Import the specific APIProps type from socket-interfaces, as FileService uses it
import { type APIProps } from '@/types';

let _getToken: () => string | null = () => localStorage.getItem('token');

export function configureTokenGetter(fn: () => string | null) {
  _getToken = fn;
}

let _fileServiceInstance: FileService | null = null;

export function configureFileService(serviceInstance: FileService) {
  _fileServiceInstance = serviceInstance;
  console.log('[apiFetch] FileService instance configured.');
}

export interface RequestOptions<T = unknown> {
  method?: HttpMethod;
  body?: T | FormData;
  isFormData?: boolean;
  responseType?: ResponseType;
  headers?: HeadersInit;
  signal?: AbortSignal;
  baseURL?: string;

  event?: string; // This is a hint for WebSocket delegation
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

export async function apiFetch<Res = unknown, Req = unknown>(
  endpoint: string,
  options: RequestOptions<Req> = {},
): Promise<Res> {
  const {
    method = 'GET',
    body,
    responseType = 'json',
    headers: customHeaders,
    signal,
    baseURL = API_URL,
    event: explicitWsEvent, // Use 'event' from options
  } = options;

  // Initialize FileService if not already configured
  if (!_fileServiceInstance) {
    _fileServiceInstance = new FileService();
    _fileServiceInstance.connect();
    // No need for configureFileService(_fileServiceInstance); here,
    // as it's already assigned and connected.
  }

  // Define methods supported by the WebSocket service (matching APIProps['method'])
  // This must match the `WebSocketMethod` type in src/types/socket-interfaces.ts
  const supportedWsMethods: APIProps['method'][] = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ];

  // Crucial fix: Add explicit type check for 'body' compatibility with WebSocket payload
  // A WebSocket body must be undefined or a non-null object
  const isBodyCompatibleWithWs =
    !(body instanceof FormData) &&
    (body === undefined || (typeof body === 'object' && body !== null));

  // Check if delegation to WebSocket is requested AND if the method/body are compatible
  // We explicitly check if 'method' is one of the supported WS methods
  const isWsDelegatedMethod = supportedWsMethods.includes(
    method as APIProps['method'],
  );

  let wsEvent: string | undefined = explicitWsEvent; // Start with explicit event hint

  // Map HTTP endpoint to a specific WebSocket event if no explicit wsEvent is given
  if (!wsEvent) {
    // Only try to infer if no explicit event was provided
    const normalizedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.GET_FILES)) {
      wsEvent = EVENT_PREFIX.GET_FILES; // Use LIST_DIRECTORY_CHILDREN as per FileService
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.READ_FILE)) {
      // Use specific constant
      wsEvent = EVENT_PREFIX.READ_FILE;
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.WRITE_FILE)) {
      // Use specific constant
      wsEvent = EVENT_PREFIX.WRITE_FILE; // Use SAVE_FILE as per FileService
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.DELETE_FILE)) {
      // Use specific constant
      wsEvent = EVENT_PREFIX.DELETE_FILE; // Use DELETE_FILES as per FileService
    } else if (normalizedEndpoint.includes(API_ENDPOINTS._FILE.UPLOAD_FILE)) {
      // Use specific constant
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
  }

  // Delegate to FileService (WebSocket) ONLY IF all conditions are met
  if (
    _fileServiceInstance &&
    wsEvent &&
    isWsDelegatedMethod &&
    isBodyCompatibleWithWs
  ) {
    console.log(
      `[apiFetch] Delegating ${method} ${endpoint} to FileService (WebSocket) with event: ${wsEvent}.`,
    );
    try {
      // Type assertions are safe here because of the preceding `isWsDelegatedMethod` and `isBodyCompatibleWithWs` checks
      return (await _fileServiceInstance.emit({
        endpoint,
        method: method as APIProps['method'], // Cast to the narrower WebSocketMethod type
        body: body as Record<string, any> | undefined, // Cast to plain object or undefined
        event: wsEvent,
      })) as Res;
      // The console.log below this return statement will never be reached, consider removing it
      // console.log(normalizedEndpoint, wsEvent);
    } catch (error: unknown) {
      // Use unknown for caught errors
      console.error(`Error delegating to FileService for ${endpoint}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new ApiError(
        errorMessage || `WebSocket error for ${endpoint}`,
        500,
        error,
      );
    }
  }

  // Fallback to standard HTTP fetch if no WebSocket event matched or types were incompatible
  const url = new URL(endpoint, baseURL).href;
  const token = _getToken();
  const headers = normalizeHeaders(customHeaders);
  console.log(`[apiFetch] Making HTTP request: ${method} ${url}`);

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
      delete headers['Content-Type']; // FormData handles its own Content-Type
    } else if (body !== undefined) {
      // For HTTP fetch, body can be anything stringifiable or raw
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
    } catch (e: unknown) {
      // Use unknown for caught errors
      // Ignore parsing errors for error payloads
    }

    throw new ApiError(errorMessage, response.status, errorPayload);
  }

  if (response.status === 204 || !contentType) {
    return undefined as Res; // Handle No Content
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
