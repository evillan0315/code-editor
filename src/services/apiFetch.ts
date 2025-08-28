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
