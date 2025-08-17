// src/hooks/useFileService.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react"; // ADDED: Import useRef and useEffect

import { io, ISocket } from "socket.io-client";
import { FileService } from "@/services/fileWebsocketService"; // Your updated FileService class
import { MockSocket } from "../mocks/mockSocket"; // Your new MockSocket class
import { IFileService, SocketFactory } from "@/types/socket-interfaces"; // Your interfaces

import type {
  FileReadResponse,
  FileWriteRequest,
  FileMoveRequest,
  FileDeleteRequest,
  FileUploadRequest,
} from "@/types/file-system";

interface UseFileServiceOptions {
  isMockMode?: boolean;
}

/**
 * A React hook that provides a singleton instance of IFileService for the component tree.
 * It manages the connection lifecycle (connect/disconnect on mount/unmount)
 * and allows switching between a real Socket.IO client and a mock implementation.
 * @param options.isMockMode - If true, a MockSocket is used instead of a real one.
 * @returns An instance of IFileService.
 */
export function useFileServiceInstance(
  options?: UseFileServiceOptions,
): IFileService {
  // Renamed for clarity
  const { isMockMode = false } = options || {};
  const fileServiceRef = useRef<IFileService | null>(null);

  // Initialize the FileService instance only once
  if (!fileServiceRef.current) {
    const socketFactory: SocketFactory = (uri, opts) => {
      if (isMockMode) {
        return new MockSocket(); // Return a new instance of your MockSocket
      } else {
        // Cast to ISocket because `io` returns `Socket` which is compatible
        return io(uri, opts) as ISocket;
      }
    };
    fileServiceRef.current = new FileService(socketFactory);
  }

  useEffect(() => {
    const service = fileServiceRef.current;
    if (service) {
      service.connect(); // Connect the service when the component mounts

      // Cleanup function: disconnect when the component unmounts
      return () => {
        service.disconnect();
      };
    }
  }, [isMockMode]); // Re-run effect if isMockMode changes, effectively re-initializing connection

  return fileServiceRef.current;
}

/**
 * TanStack Query hook to read a file's content.
 * @param fileServiceInstance The IFileService instance (real or mock).
 * @param filePath The path of the file to read.
 */
export function useReadFile(
  fileServiceInstance: IFileService,
  filePath: string,
) {
  return useQuery<FileReadResponse, Error>({
    queryKey: ["file", filePath],
    queryFn: () => fileServiceInstance.loadFile(filePath), // Use loadFile which returns FileReadResponse
    enabled: !!filePath, // Only run query if filePath is provided
  });
}

/**
 * TanStack Query hook to save/write content to a file.
 * @param fileServiceInstance The IFileService instance.
 */
export function useSaveFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileWriteRequest>({
    mutationFn: (data: FileWriteRequest) =>
      fileServiceInstance.saveFile(data.filePath, data.content),
  });
}

/**
 * TanStack Query hook to delete files/folders.
 * @param fileServiceInstance The IFileService instance.
 */
export function useDeleteFiles(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileDeleteRequest>({
    mutationFn: (paths: FileDeleteRequest) => fileServiceInstance.delete(paths),
  });
}

/**
 * TanStack Query hook to move/rename a file/folder.
 * @param fileServiceInstance The IFileService instance.
 */
export function useMoveFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileMoveRequest>({
    mutationFn: (data: FileMoveRequest) => fileServiceInstance.move(data),
  });
}

/**
 * TanStack Query hook to upload a file.
 * @param fileServiceInstance The IFileService instance.
 */
export function useUploadFile(fileServiceInstance: IFileService) {
  return useMutation<void, Error, FileUploadRequest>({
    mutationFn: (data: FileUploadRequest) => fileServiceInstance.upload(data),
  });
}
