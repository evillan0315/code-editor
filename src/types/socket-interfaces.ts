// src/types/socket-interfaces.ts

import {
  FileItem,
  FileReadResponse,
  FileMoveRequest,
  FileDeleteRequest,
  FileUploadRequest,
} from "./file-system";
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
 * Interface for the FileService class.
 * Ensures type safety and provides a contract for both real and mock implementations.
 */
export interface IFileService {
  connect(): ISocket;
  disconnect(): void;
  fetchDirectoryChildren(directoryPath: string): Promise<FileItem[]>;
  loadActiveFile(filePath: string): Promise<string>; // Updates stores, returns content
  loadFile(filePath: string): Promise<FileReadResponse>; // Just fetches, returns structured response
  saveFile(filePath: string, content: string): Promise<void>; // Renamed from 'write' in original TanStack
  formatCode(content: string, language: string): Promise<string>;
  optimizeCode(content: string, language: string): Promise<string>;
  stripCodeBlock(content: string): Promise<string>;
  removeCodeComment(content: string, language: string): Promise<string>;
  // --- New methods for TanStack Query ---
  delete(paths: FileDeleteRequest): Promise<void>; // Deletes one or more files/folders
  move(request: FileMoveRequest): Promise<void>; // Renames/moves a file/folder
  upload(request: FileUploadRequest): Promise<void>; // Uploads a file
}

// Factory function type for socket creation
export type SocketFactory = (uri: string, opts?: any) => ISocket;
