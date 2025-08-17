// src/stores/editorContent.ts
import { atom, computed } from "nanostores";
import { persistentAtom } from "@/utils/persistentAtom";
import { FileItem } from "@/types/file-system";

export interface EditorFileEntry {
  content: string;
  originalContent: string;
  lang: string;
  unsaved: boolean;
}
export const codeMirrorStatus = atom({
  language: 'plaintext',
  line: 1,
  col: 1,
  isUnsaved: false,
});
export type FileSystemEvent =
  | { type: "created"; path: string; item: FileItem }
  | { type: "deleted"; path: string }
  | { type: "renamed"; oldPath: string; newPath: string; item: FileItem }
  | { type: "modified"; path: string };

export const editorCurrentDirectory = persistentAtom<string>(
  "editorCurrentDirectory",
  `${import.meta.env.VITE_BASE_DIR}`,
);

export const editorOpenFiles = persistentAtom<string[]>("editorOpenFiles", []);

export const editorFilesMap = persistentAtom<Record<string, EditorFileEntry>>(
  "editorFilesMap",
  {},
);

export const editorActiveFilePath = persistentAtom<string>(
  "editorActiveFilePath",
  "",
);

export const editorLanguage = atom<string>("plain");
export const isTerminalOpen = persistentAtom<boolean>("isTerminalOpen", false);
export const editorFileTreeNodes = atom<FileItem[]>([]);

export const fileSystemEvents = atom<FileSystemEvent | null>(null);

export const activeFileEntry = computed(
  [editorActiveFilePath, editorFilesMap],
  (path, map) => {
    return path && map?.[path] ? map[path] : null;
  },
);

export const isFileUnsaved = (path: string): boolean => {
  return editorFilesMap.get()?.[path]?.unsaved ?? false;
};

export const getFileLanguage = (path: string): string | undefined => {
  return editorFilesMap.get()?.[path]?.lang;
};

export const getFileContent = (path: string): string | undefined => {
  return editorFilesMap.get()?.[path]?.content;
};

export const clearEditorContent = () => {
  //editorActiveContent.set("");
  editorLanguage.set("plain");
};
