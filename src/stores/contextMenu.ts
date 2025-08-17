// src/stores/contextMenu.ts
import { map } from "nanostores";
import { EditorView } from "@codemirror/view";
import {
  CodeMirrorActionItem,
  CodeMirrorContextMenuStore,
} from "@/types/codeMirror";
import { ContextMenuItem, ContextMenuStore, FileItem } from "@/types/file-system";

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
  codeMirrorContextMenu.setKey("visible", false);
}

export const fileExplorerContextMenu = map<ContextMenuStore>({
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
  items: ContextMenuItem[],
  file: FileItem,
) {
  console.log(file, "file showFileExplorerContextMenu");
  fileExplorerContextMenu.set({
    visible: true,
    x,
    y,
    items,
    file,
  });
}

export function hideFileExplorerContextMenu() {
  fileExplorerContextMenu.setKey("visible", false);
}
