import { EditorView } from '@codemirror/view';
import { FileItem } from './file-system';

/**
 * Generic type for classifying items in a menu, such as a context menu.
 * Can represent a standard button, a visual separator, or a non-interactive header.
 */
export type ActionItemType = 'header' | 'divider' | 'button';

/**
 * Base interface for an action item that can appear in a menu.
 * Provides common properties like ID, label, disabled state, icon, and type.
 */
export interface ActionItemBase {
  id?: string;
  label?: string;
  disabled?: boolean;
  icon?: string; // Expected to be an Iconify string (e.g., 'mdi:pencil')
  type?: ActionItemType;
}

/**
 * Represents an action item specifically for a CodeMirror context menu.
 * Extends `ActionItemBase` and adds an `action` callback that receives the `EditorView`.
 */
export interface CodeMirrorActionItem extends ActionItemBase {
  action?: (editorView: EditorView) => void; // Callback executed when the item is activated
}

/**
 * Defines the structure of the NanoStores state for the CodeMirror context menu.
 * Manages visibility, position, the list of action items, and the associated editor instance.
 */
export type CodeMirrorContextMenuStore = {
  visible: boolean;
  x: number;
  y: number;
  items: CodeMirrorActionItem[];
  editorView: EditorView | null;
};

/**
 * Represents an action item specifically for the File Explorer context menu.
 * Extends `ActionItemBase` and adds an `action` callback that receives the `FileItem`.
 */
export interface FileExplorerContextMenuItem extends ActionItemBase {
  action?: (file: FileItem) => void; // Callback executed when the item is activated
}

/**
 * Defines the structure of the NanoStores state for the File Explorer context menu.
 * Manages visibility, position, the list of action items, and the associated file item.
 */
export type FileExplorerContextMenuStore = {
  visible: boolean;
  x: number;
  y: number;
  items: FileExplorerContextMenuItem[];
  file: FileItem | null;
};

/**
 * Interface representing a file within the editor's context, typically used for tracking open files.
 */
export interface EditorFile {
  path: string;
}

/**
 * Props interface for a component representing an editor file tab.
 */
export interface EditorFileTabItemProps {
  file: string; // The full path of the file
  language?: string; // Optional language of the file for syntax highlighting
  isActive: boolean; // Indicates if this tab is currently active
  onClick: (path: string) => void; // Callback when the tab is clicked
  onClose: (path: string) => void; // Callback when the tab's close button is clicked
}

/**
 * Interface for data required to format code via a service.
 */
export interface FormatCodeType {
  code: string; // The code content to be formatted
  language: string; // The language of the code (e.g., 'typescript', 'javascript')
}
