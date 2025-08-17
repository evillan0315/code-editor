// src/types/editor.d.ts (or similar type definition file)
export interface EditorFile {
  path: string;
}
export interface EditorFileTabItemProps {
  file: string;
  language?: string;
  isActive: boolean;
  onClick: (path: string) => void;
  onClose: (path: string) => void;
}