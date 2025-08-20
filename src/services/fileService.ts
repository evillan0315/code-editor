import type {
  FileWriteRequest,
  FileItem,
  FileUploadRequest,
  FileMoveRequest,
  FileRenameRequest,
} from '@/types/file-system';
import { apiFetch } from '@/services/apiFetch';
import { BASE_URL_API } from '@/constants/refactored/app';
export const fileService = {
  async read(filePath: string): Promise<FileItem> {
    const file = await apiFetch<FileItem>('/api/file/read', {
      method: 'POST',
      body: { filePath },
      responseType: 'json',
      event: 'readFile',
    });
    return file;
  },
  async createFile(filePath: string, content: string): Promise<any> {
    const file = await apiFetch<FileWriteRequest>('/api/file/create', {
      method: 'POST',
      body: { filePath, content, type: 'file' },
      responseType: 'json',
    });
    return file;
  },
  async createFolder(filePath: string): Promise<any> {
    const folder = await apiFetch<FileWriteRequest>('/api/file/create', {
      method: 'POST',
      body: { filePath, type: 'folder', isDirectory: true },
      responseType: 'json',
    });
    return folder;
  },
  async write(filePath: string, content: string): Promise<any> {
    const file = await apiFetch<FileWriteRequest>('/api/file/write', {
      method: 'POST',
      body: { filePath, content },
      responseType: 'json',
    });
    return file;
  },

  async delete(filePath: string): Promise<any> {
    return await apiFetch<FileItem>('/api/file/delete', {
      method: 'POST',
      body: { filePath },
    });
  },
  async rename(oldPath: string, newPath: string): Promise<any> {
    return await apiFetch<FileRenameRequest>('/api/file/rename', {
      method: 'POST',
      body: { oldPath, newPath },
    });
  },

  move(data: FileMoveRequest): Promise<any> {
    return apiFetch('/file/move', {
      method: 'POST',
      body: data,
    });
  },

  async list(directory: string): Promise<FileItem[] | []> {
    console.log(directory, 'directory');
    const lists = await apiFetch<FileItem[]>(
      `/api/file/list?directory=${encodeURIComponent(directory)}&recursive=false`,
      {
        method: 'GET',
        responseType: 'json',
      },
    );
    return lists;
  },

  upload({ filePath, file, onProgress }: FileUploadRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      formData.append('filePath', filePath);
      formData.append('file', file);

      xhr.open('POST', `${BASE_URL_API}/api/file/upload`, true);
      xhr.withCredentials = true;

      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let errorMsg = `Upload failed: ${xhr.statusText}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse && errorResponse.message) {
              errorMsg = errorResponse.message;
            }
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during file upload'));
      xhr.send(formData);
    });
  },
};

export const conversationService = {
  list({ page, limit }: { page: number; limit: number }): Promise<any[]> {
    return apiFetch(`/conversations?page=${page}&limit=${limit}`, {
      method: 'GET',
    }).then((res: any) => res.data);
  },
};

export const utilsService = {
  async formatCode(code: string, language: string): Promise<any> {
    const formatted = await apiFetch<FileWriteRequest>('/api/utils/format-code', {
      method: 'POST',
      body: { code, language },
      responseType: 'json',
    });
    return formatted;
  },
};
