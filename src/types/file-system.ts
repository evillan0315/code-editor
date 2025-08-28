export type FileType = 'file' | 'folder';

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
  newPath: string;
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
export interface FileDeleteRequest {
  filePaths: string[];
}

export interface FileMoveRequest {
  sourcePath: string;
  destinationPath?: string;
}

export interface FileCopyRequest {
  sourcePath: string;
  destinationPath?: string;
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
