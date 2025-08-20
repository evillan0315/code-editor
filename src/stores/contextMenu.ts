import { map } from 'nanostores';
import { EditorView } from '@codemirror/view';
import {
  CodeMirrorActionItem,
  CodeMirrorContextMenuStore,
  FileExplorerContextMenuItem,
  FileExplorerContextMenuStore,
} from '@/types/editor'; // Updated import path for editor-related types
import { FileItem } from '@/types/file-system'; // FileItem remains from file-system

export const codeMirrorContextMenu = map<CodeMirrorContextMenuStore>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  editorView: null,
});

export function showCodeMirrorContextMenu(
  x: number,
  y: number,
  editorView: EditorView,
  items: CodeMirrorActionItem[],
) {
  codeMirrorContextMenu.set({
    visible: true,
    x,
    y,
    items,
    editorView,
  });
}

export function hideCodeMirrorContextMenu() {
  codeMirrorContextMenu.setKey('visible', false);
}

// Corrected type names for file explorer context menu
export const fileExplorerContextMenu = map<FileExplorerContextMenuStore>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
  file: null,
});

export function showFileExplorerContextMenu(
  visible: boolean,
  x: number,
  y: number,
  items: FileExplorerContextMenuItem[], // Updated type
  file: FileItem,
) {
  console.log(file, 'file showFileExplorerContextMenu');
  fileExplorerContextMenu.set({
    visible: true,
    x,
    y,
    items,
    file,
  });
}

export function hideFileExplorerContextMenu() {
  fileExplorerContextMenu.setKey('visible', false);
}
