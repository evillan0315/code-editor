// src/stores/editorFileStore.ts
import { atom } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";
import type { FileItem } from "@/types/file-system";

// Persistent save record ID
export const saveRecordId = persistentAtom<string>("saveRecordId", "");

// Playback/Queue state
export const shuffledQueue = atom<number[]>([]);
export const queueIndex = atom<number>(0);

// Current working directory
export const currentDirectory = persistentAtom<string>(
  "currentDirectory",
  "./",
);

// Currently selected file
export const selectedFile = atom<FileItem | null>(null);

// Flat file registry: directory path → list of files
export const filesDirectories = atom<Record<string, FileItem[]>>({});

// Directory tree: directory path → immediate children
export const directoryChildren = atom<Map<string, FileItem[]>>(new Map());

// Recently accessed directories (max 5)
export const recentDirectories = atom<string[]>([]);

export function setDirectoryChildren(dir: string, children: FileItem[]): void {
  const updatedMap = new Map(directoryChildren.get());
  updatedMap.set(dir, children);
  directoryChildren.set(updatedMap);
}
