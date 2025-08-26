// src/utils/editorKeymaps.ts (or wherever you prefer to place utilities)
import { EditorView, type KeyBinding } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';

/**
 * Creates an array of CodeMirror keybindings for common editor actions.
 * This utility is framework-agnostic and can be used directly in React, SolidJS, Vue, etc.
 *
 * @param onSave A callback function to be executed when the save keybinding (Mod-s) is triggered.
 *               It receives the current EditorView and should return `true` if the event was handled.
 * @returns An array of CodeMirror KeyBinding objects.
 */
export function createEditorKeybindings(
  onSave: (view: EditorView) => boolean,
): KeyBinding[] {
  return [
    {
      key: 'Mod-s', // Mod is Ctrl on Windows/Linux, Cmd on macOS
      run: onSave, // The onSave callback handles the save logic
      preventDefault: true, // Prevent default browser save dialog (e.g., to save webpage)
    },
    {
      key: 'Mod-z',
      run: undo,
      preventDefault: true,
    },
    {
      key: 'Mod-y', // Common redo shortcut
      run: redo,
      preventDefault: true,
    },
    {
      key: 'Shift-Mod-z', // Alternative redo shortcut (e.g., on macOS)
      run: redo,
      preventDefault: true,
    },
  ];
}
