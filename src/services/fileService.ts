import type {
  FileWriteRequest,
  FileItem,
  FileUploadRequest,
  FileMoveRequest,
  FileRenameRequest,
  FileCopyRequest,
} from '@/types/file-system';
import { apiFetch } from '@/services/apiFetch';
import { BASE_URL_API } from '@/constants/refactored/app';
import { API_ENDPOINTS } from '@/constants/refactored/api';

export const fileService = {
  async read(filePath: string): Promise<FileItem> {
    const file = await apiFetch<FileItem>(API_ENDPOINTS._FILE.READ_FILE_CONTENT, {
      method: 'POST',
      body: { filePath },
      responseType: 'json',
      event: 'readFile',
    });
    return file;
  },
  async createFile(filePath: string, content: string): Promise<any> {
    const file = await apiFetch<FileWriteRequest>(API_ENDPOINTS._FILE.CREATE, {
      method: 'POST',
      body: { filePath, content, type: 'file' },
      responseType: 'json',
    });
    return file;
  },
  async createFolder(filePath: string): Promise<any> {
    // Note: The original code used /api/file/create for creating folders.
    // API_ENDPOINTS._FILE.CREATE also maps to /api/file/create.
    // If the intention was to use /api/file/create-folder, then API_ENDPOINTS._FILE.CREATE_FOLDER should be used.
    // Following the original implementation, we use API_ENDPOINTS._FILE.CREATE which matches the original path.
    const folder = await apiFetch<FileWriteRequest>(API_ENDPOINTS._FILE.CREATE, {
      method: 'POST',
      body: { filePath, type: 'folder', isDirectory: true },
      responseType: 'json',
    });
    return folder;
  },
  async write(filePath: string, content: string): Promise<any> {
    const file = await apiFetch<FileWriteRequest>(API_ENDPOINTS._FILE.WRITE_FILE_CONTENT, {
      method: 'POST',
      body: { filePath, content },
      responseType: 'json',
    });
    return file;
  },

  async delete(filePath: string): Promise<any> {
    return await apiFetch<FileItem>(API_ENDPOINTS._FILE.DELETE_FILE, {
      method: 'POST',
      body: { filePath },
    });
  },
  async rename(oldPath: string, newPath: string): Promise<any> {
    return await apiFetch<FileRenameRequest>(API_ENDPOINTS._FILE.RENAME_FILE_OR_FOLDER, {
      method: 'POST',
      body: { oldPath, newPath },
    });
  },

  async move(data: FileMoveRequest): Promise<any> {
    return apiFetch(API_ENDPOINTS._FILE.MOVE_FILE_OR_FOLDER, {
      method: 'POST',
      body: data,
    });
  },

  async copy(data: FileCopyRequest): Promise<any> {
    return apiFetch(API_ENDPOINTS._FILE.COPY_FILE_OR_FOLDER, {
      method: 'POST',
      body: data,
    });
  },

  async list(directory: string): Promise<FileItem[] | []> {
    const lists = await apiFetch<FileItem[]>(
      `${API_ENDPOINTS._FILE.GET_FILES}?directory=${encodeURIComponent(directory)}&recursive=false`,
      {
        method: 'GET',
        responseType: 'json',
      },
    );
    return lists;
  },
};

export const conversationService = {
  list({ page, limit }: { page: number; limit: number }): Promise<any[]> {
    return apiFetch(
      `${API_ENDPOINTS._CONVERSATION.GET_CONVERSATIONS}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      },
    ).then((res: any) => res.data);
  },
};

export const utilsService = {
  async formatCode(code: string, language: string): Promise<any> {
    const formatted = await apiFetch<FileWriteRequest>(API_ENDPOINTS._UTILS.FORMAT_CODE, {
      method: 'POST',
      body: { code, language },
      responseType: 'json',
    });
    return formatted;
  },
};
