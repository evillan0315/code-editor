// src/hooks/useEditorKeybindings.ts
import { useEffect } from 'react';
import { undoEdit, redoEdit } from '@/utils/editorUndoRedo';

export function useEditorKeybindings(onSave?: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      if (ctrlOrMeta && key === 's') {
        e.preventDefault();
        onSave?.();
      } else if (ctrlOrMeta && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoEdit();
      } else if (ctrlOrMeta && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoEdit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave]);
}
