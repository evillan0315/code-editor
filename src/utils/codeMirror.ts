// @/utils/codemirror
import { EditorView } from '@codemirror/view';
import { utilsService } from '@/services';
import { FormatCodeType } from '@/types/editor'; // Updated import path

export const getSelectionOrDoc = async (view: EditorView): Promise<any> => {
  const selection = view.state.selection.main; // Get the primary selection
  let text: string;
  let from: number;
  let to: number;

  if (selection.empty) {
    // If no selection, get the entire document
    text = view.state.doc.toString();
    from = 0;
    to = view.state.doc.length;
  } else {
    // Get the selected text
    text = view.state.doc.sliceString(selection.from, selection.to);
    from = selection.from;
    to = selection.to;
  }
  return { text, selection: { from, to } };
};

export const formatCode = async (data: FormatCodeType): Promise<string> => {
  const { code, language } = data;
  try {
    return await utilsService.formatCode(code, language);
  } catch (error) {
    return code;
  }
};

export const codeMirror = {
  getSelectionOrDoc,
  formatCode,
};
