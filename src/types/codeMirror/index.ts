import { EditorView } from "@codemirror/view";
import { HEADER, DIVDER, BUTTON } from "@/constants";

export type ActionItem = HEADER | DIVDER | BUTTON;

export interface CodeMirrorActionItem {
  id?: string;
  label?: string;
  disabled?: boolean;
  icon?: string;
  type?: ActionItem;
  action?: (editorView: EditorView) => void;
}

export type CodeMirrorContextMenuStore = {
  visible: boolean;
  x: number;
  y: number;
  items: CodeMirrorActionItem[];
  editorView: EditorView | null;
};

export interface ContextMenuActionItem extends CodeMirrorActionItem {
  onClick?: (view: EditorView) => void;
}
