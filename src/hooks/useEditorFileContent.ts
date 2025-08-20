// src/hooks/useEditorFileContent.ts
import { useCallback } from 'react';
import {
  editorActiveFilePath,
  editorOpenFiles,
  editorFilesMap,
  type EditorFileEntry,
} from '@/stores/editorContent';
import { fileService } from '@/services/fileService';
import { useToast } from '@/hooks/useToast';

export function useEditorFileContent() {
  const { showToast } = useToast();

  const handleFileSelect = useCallback(
    async (path: string) => {
      try {
        const res = await fileService.read(path);
        const openFiles = editorOpenFiles.get();
        const filesMap = editorFilesMap.get();

        if (!openFiles.includes(path)) {
          editorOpenFiles.set([...openFiles, path]);
        }

        editorFilesMap.set({
          ...filesMap,
          [path]: {
            content: res.content,
            originalContent: res.content,
            lang: res.language,
            unsaved: false,
          } as EditorFileEntry,
        });

        editorActiveFilePath.set(path);
      } catch (err) {
        showToast(`Error reading file: ${String(err)}`, 'error');
      }
    },
    [showToast],
  );

  const handleCodeMirrorChange = useCallback(
    (filePath: string, newContent: string, language: string) => {
      const currentFilesMap = editorFilesMap.get();
      const fileEntry = currentFilesMap[filePath];

      if (fileEntry) {
        editorFilesMap.set({
          ...currentFilesMap,
          [filePath]: {
            ...fileEntry,
            content: newContent,
            lang: language,
            unsaved: newContent !== fileEntry.originalContent,
          } as EditorFileEntry,
        });
      } else {
        console.warn(
          `handleCodeMirrorChange: File entry not found for path: ${filePath}. Cannot update content.`,
        );
      }
    },
    [],
  );

  return {
    handleFileSelect,
    handleCodeMirrorChange,
  };
}
