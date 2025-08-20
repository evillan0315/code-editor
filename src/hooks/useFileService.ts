// src/hooks/useFileService.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

import { io, ISocket } from 'socket.io-client';
import { FileService } from '@/services/fileWebsocketService';
import { MockSocket } from '../mocks/mockSocket';
import { IFileService, SocketFactory } from '@/types/socket-interfaces';

import type {
  FileReadResponse,
  FileWriteRequest,
  FileMoveRequest,
  FileDeleteRequest,
  FileUploadRequest,
} from '@/types/file-system';

interface UseFileServiceOptions {
  isMockMode?: boolean;
}

export function useFileServiceInstance(options?: UseFileServiceOptions): IFileService {
  const { isMockMode = false } = options || {};
  const fileServiceRef = useRef<IFileService | null>(null);

  if (!fileServiceRef.current) {
    const socketFactory: SocketFactory = (uri, opts) => {
      if (isMockMode) {
        return new MockSocket();
      } else {
        return io(uri, opts) as ISocket;
      }
    };
    fileServiceRef.current = new FileService(socketFactory);
  }

  useEffect(() => {
    const service = fileServiceRef.current;
    if (service) {
      service.connect();

      return () => {
        service.disconnect();
      };
    }
  }, [isMockMode]);

  return fileServiceRef.current;
}

export function useReadFile(fileServiceInstance: IFileService, filePath: string) {
  return useQuery<FileReadResponse, Error>({
    queryKey: ['file', filePath],
    queryFn: () => fileServiceInstance.loadFile(filePath),
    enabled: !!filePath,
  });
}

export function useSaveFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileWriteRequest>({
    mutationFn: (data: FileWriteRequest) =>
      fileServiceInstance.saveFile(data.filePath, data.content),
  });
}

export function useDeleteFiles(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileDeleteRequest>({
    mutationFn: (paths: FileDeleteRequest) => fileServiceInstance.delete(paths),
  });
}

export function useMoveFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileMoveRequest>({
    mutationFn: (data: FileMoveRequest) => fileServiceInstance.move(data),
  });
}

export function useUploadFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileUploadRequest>({
    mutationFn: (data: FileUploadRequest) => fileServiceInstance.upload(data),
  });
}
