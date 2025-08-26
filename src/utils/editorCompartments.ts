import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export interface EditorCompartments {
  language: Compartment;
  theme: Compartment;
  keymap: Compartment;
  editable: Compartment;
}

/**
 * Creates new isolated CodeMirror compartments.
 */
export function createEditorCompartments(): EditorCompartments {
  return {
    language: new Compartment(),
    theme: new Compartment(),
    keymap: new Compartment(),
    editable: new Compartment(),
  };
}

/**
 * Reconfigure all compartments dynamically.
 */
export function reconfigureEditorCompartments(
  view: EditorView,
  updates: Partial<Record<keyof EditorCompartments, any>>,
  compartments: EditorCompartments,
) {
  const effects = [];

  if (updates.language) {
    effects.push(compartments.language.reconfigure(updates.language));
  }
  if (updates.theme) {
    effects.push(compartments.theme.reconfigure(updates.theme));
  }
  if (updates.editable !== undefined) {
    effects.push(
      compartments.editable.reconfigure(
        EditorView.editable.of(updates.editable),
      ),
    );
  }
  if (updates.keymap) {
    effects.push(compartments.keymap.reconfigure(updates.keymap));
  }

  view.dispatch({ effects });
}
