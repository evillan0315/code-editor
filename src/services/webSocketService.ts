import { io, Socket } from 'socket.io-client';
import {
  EVENT_PREFIX,
  SOCKET_EVENTS_MERGED,
  FILE_NAMESPACE,
} from '@/constants/refactored/socket';
import {
  DetailedSocketEventPayloadMap,
  GenericSocketResponse,
} from '@/types/socket-interfaces';

type EventListener<T> = (payload: T) => void;

/**
 * WebSocketService class to manage connection, emission, and listening to WebSocket events.
 * It abstracts the socket.io-client implementation and provides type-safe methods for event handling.
 */
class WebSocketService {
  private socket: Socket | null = null;
  private readonly baseUrl: string;
  private readonly namespace: string;

  constructor(baseUrl: string, namespace: string = '/') {
    this.baseUrl = baseUrl;
    this.namespace = namespace;
  }

  /**
   * Connects to the WebSocket server.
   * @param token Optional authentication token for the connection.
   */
  public connect(token?: string): void {
    if (this.socket && this.socket.connected) {
      console.log(
        `Socket already connected to ${this.baseUrl}${this.namespace}`,
      );
      return;
    }

    const auth = token ? { token } : {};

    // Initialize the socket connection
    this.socket = io(`${this.baseUrl}${this.namespace}`, {
      transports: ['websocket'],
      auth,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupBasicListeners();
  }

  /**
   * Disconnects from the WebSocket server.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log(`Disconnected from ${this.baseUrl}${this.namespace}`);
    }
  }

  /**
   * Sets up fundamental listeners for connection status and errors.
   */
  private setupBasicListeners(): void {
    if (!this.socket) return;

    this.socket.on(SOCKET_EVENTS_MERGED.CONNECT, () => {
      console.log(`Connected to WebSocket: ${this.baseUrl}${this.namespace}`);
    });

    this.socket.on(SOCKET_EVENTS_MERGED.DISCONNECT, (reason: string) => {
      console.log(
        `Disconnected from WebSocket: ${this.baseUrl}${this.namespace}, Reason: ${reason}`,
      );
    });

    this.socket.on(SOCKET_EVENTS_MERGED.CONNECT_ERROR, (error: Error) => {
      console.error(`WebSocket connection error: ${error.message}`);
    });

    // Optional: Catch-all for any unhandled events for debugging
    // this.socket.onAny((eventName: string, ...args: any[]) => {
    //   console.debug(`Received unhandled event: ${eventName}`, args);
    // });
  }

  /**
   * Emits a WebSocket event with a specified payload.
   * @param eventName The name of the event to emit (must be a key from DetailedSocketEventPayloadMap).
   * @param payload The data to send with the event.
   */
  public emit<K extends keyof DetailedSocketEventPayloadMap>(
    eventName: K,
    payload: DetailedSocketEventPayloadMap[K],
  ): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName as string, payload);
    } else {
      console.warn(
        `Attempted to emit "${String(eventName)}" but socket is not connected.`,
      );
    }
  }

  /**
   * Registers a listener for a specific WebSocket event.
   * @param eventName The name of the event to listen for.
   * @param listener The callback function to execute when the event is received.
   * @returns A function to unsubscribe the listener.
   */
  public on<K extends keyof DetailedSocketEventPayloadMap>(
    eventName: K,
    listener: EventListener<DetailedSocketEventPayloadMap[K]>,
  ): () => void {
    if (!this.socket) {
      console.warn(
        `Attempted to listen to "${String(eventName)}" but socket is not initialized. Call connect() first.`,
      );
      return () => {}; // Return a no-op unsubscribe function
    }
    this.socket.on(eventName as string, listener);
    return () => {
      this.socket?.off(eventName as string, listener);
    };
  }

  /**
   * Helper to listen to all progress, response, and error events for a given API event constant name.
   * e.g., pass 'FILE_CREATE' (from EVENT_PREFIX keys) to listen for 'fileCreateProgress', 'fileCreateResponse', 'fileCreateError'.
   * The actual event names are resolved from SOCKET_EVENTS_MERGED.
   * @param apiEventConstantName A key from `EVENT_PREFIX` (e.g., 'FILE_CREATE', 'ESLINT_LINT_CODE').
   * @param callbacks An object containing optional `onProgress`, `onResponse`, and `onError` listeners.
   * @returns An array of functions, each to unsubscribe a specific listener.
   */
  public onApiEvent<T = any>(
    apiEventConstantName: keyof typeof EVENT_PREFIX,
    callbacks: {
      onProgress?: EventListener<GenericSocketResponse<T>>;
      onResponse?: EventListener<GenericSocketResponse<T>>;
      onError?: EventListener<GenericSocketResponse<T>>;
    },
  ): (() => void)[] {
    const unsubscribers: (() => void)[] = [];

    // Construct the constant names for lookup in SOCKET_EVENTS_MERGED
    const progressEventKey =
      `${apiEventConstantName}_PROGRESS` as keyof typeof SOCKET_EVENTS_MERGED;
    const responseEventKey =
      `${apiEventConstantName}_RESPONSE` as keyof typeof SOCKET_EVENTS_MERGED;
    const errorEventKey =
      `${apiEventConstantName}_ERROR` as keyof typeof SOCKET_EVENTS_MERGED;

    // Retrieve the actual socket event string values
    const progressEventName = SOCKET_EVENTS_MERGED[progressEventKey];
    const responseEventName = SOCKET_EVENTS_MERGED[responseEventKey];
    const errorEventName = SOCKET_EVENTS_MERGED[errorEventKey];

    if (progressEventName && callbacks.onProgress) {
      unsubscribers.push(
        this.on(
          progressEventName as keyof DetailedSocketEventPayloadMap,
          callbacks.onProgress as any,
        ),
      );
    }
    if (responseEventName && callbacks.onResponse) {
      unsubscribers.push(
        this.on(
          responseEventName as keyof DetailedSocketEventPayloadMap,
          callbacks.onResponse as any,
        ),
      );
    }
    if (errorEventName && callbacks.onError) {
      unsubscribers.push(
        this.on(
          errorEventName as keyof DetailedSocketEventPayloadMap,
          callbacks.onError as any,
        ),
      );
    }

    return unsubscribers;
  }
}

// Initialize service instances
// Assuming VITE_WS_URL is available from environment variables for the backend URL
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'; // Fallback for development

/**
 * WebSocket service instance specifically for file-related events, connected to the /files namespace.
 */
export const fileWebSocketService = new WebSocketService(
  WEBSOCKET_URL,
  FILE_NAMESPACE,
);

/**
 * General WebSocket service instance for global or non-namespaced events, connected to the root namespace.
 */
export const generalWebSocketService = new WebSocketService(WEBSOCKET_URL, '/');

// Re-export SOCKET_EVENTS_MERGED for convenient access when using the service
export { SOCKET_EVENTS_MERGED as SocketEvents, EVENT_PREFIX };
