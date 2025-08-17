// src/types/file-system.ts

import { ActionItem } from "./codeMirror";
export type FileType = "file" | "folder";

export interface FileItem {
  name: string;
  type: FileType;
  path: string;
  content?: string;
  children?: FileItem[];
  isDirectory?: boolean;
  mimeType?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  isOpen?: boolean;
  isLoadingChildren?: boolean;
}
export interface FileSearchRequest {
  directory: string;
  searchTerm: string;
}
export interface FileCreateRequest {
  filePath: string;
  content?: string;
  type: FileType;
  isDirectory?: string;
}
export interface FileRenameRequest {
  oldPath: string;
  newpath: string;
}
export interface FileRenameResponse {
  success: boolean;
  message: string;
  oldPath: string;
  newPath: string;
}

export interface FileWriteRequest {
  filePath: string;
  content: string;
}

export interface FileReadResponse {
  filePath: string;
  content: string;
  filename?: string;
  mimeType?: string;
  language?: string;
  blob?: string;
}
export interface FileRenameRequest {
  oldPath: string;
  newPath: string;
}
export interface FileDeleteRequest {
  filePaths: string[];
}

export interface FileMoveRequest {
  fromPath: string;
  toPath: string;
}
export interface FileListRequest {
  directory: string;
  recursive?: boolean;
}
export interface FileListResponse {
  path: string;
  files: FileItem[];
}

export interface FileUploadRequest {
  filePath: string;
  file: File;
  onProgress?: (percent: number) => void;
}

export interface FormatCodeType {
  code: string;
  language: string;
}

export interface ContextMenuItem {
  id?: string;
  icon?: string;
  label?: string;
  action?: (file: FileItem) => void;
  className?: string;
  type?: ActionItem;
  disabled?: boolean;
}

export interface ContextMenuStore {
  x: number;
  y: number;
  visible: boolean;
  title?: string;
  subtitle?: string;
  items: ContextMenuItem[];
  id?: string;
  file: FileItem;
}
export const initialFiles: FileItem[] = [];

// Add APIProps if it's not already defined elsewhere
export interface APIProps {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  event: string; // The specific event name for the dynamic file event
}


