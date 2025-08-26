import { BASE_URL_API } from '@/constants/refactored/app';

/**
 * @interface ApiFetchOptions
 * @extends RequestInit
 * @property {('json' | 'text' | 'blob' | 'arrayBuffer' | 'formData')} [responseType='json'] - The expected type of the response body. Defaults to 'json'.
 * @property {string} [event] - Optional event string, possibly for websocket integration or logging.
 */
export interface ApiFetchOptions extends RequestInit {
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  event?: string;
}

/**
 * A generic utility function for making API requests.
 * It abstracts away the base URL, content type, and response parsing.
 *
 * @template T - The expected type of the successful response data.
 * @param {string} endpoint - The specific API endpoint path (e.g., '/auth/login', '/file/read').
 *   This string typically comes from the `API_ENDPOINTS` object defined in `src/constants/refactored/api.ts`.
 * @param {ApiFetchOptions} [options] - Configuration options for the fetch request.
 * @returns {Promise<T>} A promise that resolves with the parsed response data.
 * @throws {Error} If the API request fails or the response status is not OK.
 */
export async function apiFetch<T>(endpoint: string, options?: ApiFetchOptions): Promise<T> {
  const { responseType = 'json', event, body, headers, ...fetchOptions } = options || {};

  const url = `${BASE_URL_API}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Handle body for POST/PUT requests: stringify if it's an object
  const requestBody = body instanceof FormData ? body : JSON.stringify(body);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: { ...defaultHeaders, ...headers },
      body: body ? requestBody : undefined,
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // If response is not JSON, use text or default error message
        errorData = await response.text();
      }
      const errorMessage =
        errorData?.message ||
        errorData ||
        `API request failed with status ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      // No Content, return undefined or a specific empty object
      return undefined as T; // Or {} as T if an empty object is expected
    }

    switch (responseType) {
      case 'json':
        return (await response.json()) as T;
      case 'text':
        return (await response.text()) as T;
      case 'blob':
        return (await response.blob()) as T;
      case 'arrayBuffer':
        return (await response.arrayBuffer()) as T;
      case 'formData':
        return (await response.formData()) as T;
      default:
        return (await response.json()) as T; // Fallback to JSON
    }
  } catch (error) {
    console.error(`apiFetch error for ${endpoint}:`, error);
    throw error;
  }
}
