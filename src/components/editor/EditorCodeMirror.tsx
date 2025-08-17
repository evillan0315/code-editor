import React, { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { showCodeMirrorContextMenu } from '@/stores/contextMenu';
import { CodeMirrorContextMenuRenderer } from '@/components/editor/CodeMirrorContextMenuRenderer';
import { theme } from '@/stores/theme';
import {
  editorFilesMap,
  isFileUnsaved,
  codeMirrorStatus,
  getFileContent
} from '@/stores/editorContent';
import { getLanguageExtensionByLangString } from '@/utils/editorLanguage';
import { getThemeExtension } from '@/utils/editorTheme';
import { createEditorKeybindings } from '@/utils/editorKeymaps';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { useEditorTabs } from '@/hooks/useEditorTabs';
import { Icon } from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
} from '@codemirror/view';
import { EditorState, Compartment, EditorSelection, EditorStateConfig } from '@codemirror/state';

import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { rectangularSelection, crosshairCursor } from '@codemirror/view';

import { lintGutter, lintKeymap, linter } from '@codemirror/lint';
import { triggerESLintLinting } from '@/utils/eslintLinter';

import { getSelectionOrDoc, formatCode } from '@/utils/codeMirror';
import { ContextMenuActionItem } from '@/types/codeMirror';
import { CODE_MIRROR_CONTEXT_MENU_ITEMS } from '@/constants/codemirror';
import '@/styles/code-mirror.css';

interface EditorCodeMirrorProps {
  activeFilePath?: string;
  value: string;
  language: string;
  onContentChange?: (newContent: string) => void;
  readOnly?: boolean;
}

const EditorCodeMirror: React.FC<EditorCodeMirrorProps> = ({
  activeFilePath,
  value,
  language,
  onContentChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const $theme = useStore(theme);

  const $editorFilesMap = useStore(editorFilesMap);

  const { handleCodeMirrorChange } = useEditorExplorerActions();
  const { handleSave } = useEditorTabs();

  const languageCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const editableCompartment = useRef(new Compartment()).current;
  const keymapCompartment = useRef(new Compartment()).current;

  const OptimizeCodeIcon = useMemo(
    () => <Icon icon="mdi:speedometer" width="1.5em" height="1.5em" />,
    [],
  );
  const AnalyzeCodeIcon = useMemo(
    () => <Icon icon="mdi:magnify" width="1.5em" height="1.5em" />,
    [],
  );
  const RepairCodeIcon = useMemo(
    () => <Icon icon="mdi:wrench-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const FormatCodeIcon = useMemo(
    () => <Icon icon="mdi:format-align-left" width="1.5em" height="1.5em" />,
    [],
  );
  const RemoveCommentsIcon = useMemo(
    () => <Icon icon="mdi:comment-remove-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const GenerateCodeIcon = useMemo(
    () => <Icon icon="mdi:lightbulb-on-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const GenerateDocsIcon = useMemo(
    () => <Icon icon="mdi:book-open-outline" width="1.5em" height="1.5em" />,
    [],
  );
  const GenerateInlineDocsIcon = useMemo(
    () => <Icon icon="mdi:comment-text-multiple-outline" width="1.5em" height="1.5em" />,
    [],
  );

  const handleCodemirrorContextMenu = useCallback(
    async (action: ContextMenuActionItem) => {
      const view = viewRef.current;
      if (!view) return;

      if (action.id === 'format-code') {
        const { text, selection } = await getSelectionOrDoc(view);
        const formattedText = await formatCode({ code: text, language });
        if (formattedText !== text) {
          view.dispatch({
            changes: {
              from: selection.from,
              to: selection.to,
              insert: formattedText,
            },
            selection: EditorSelection.cursor(selection.from + formattedText.length),
            userEvent: 'format',
          });
        }
      }
    },
    [language],
  );

  const memoizedCodeMirrorMenuItems = useMemo(() => {
    return CODE_MIRROR_CONTEXT_MENU_ITEMS.map((item) => {
      if (item.type !== 'button') return item;
      switch (item.id) {
        case 'optimize-code':
          return {
            ...item,
            icon: OptimizeCodeIcon,
          };
        case 'analyze-code':
          return {
            ...item,
            icon: AnalyzeCodeIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        case 'repair-code':
          return {
            ...item,
            icon: RepairCodeIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        case 'format-code':
          return {
            ...item,
            icon: FormatCodeIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        case 'remove-comments':
          return { ...item, icon: RemoveCommentsIcon };
        case 'generate-code':
          return {
            ...item,
            icon: GenerateCodeIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        case 'generate-documentation':
          return {
            ...item,
            icon: GenerateDocsIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        case 'generate-inline-documentation':
          return {
            ...item,
            icon: GenerateInlineDocsIcon,
            action: () => handleCodemirrorContextMenu(item),
          };
        default:
          return item;
      }
    });
  }, [
    OptimizeCodeIcon,
    AnalyzeCodeIcon,
    RepairCodeIcon,
    FormatCodeIcon,
    RemoveCommentsIcon,
    GenerateCodeIcon,
    GenerateDocsIcon,
    GenerateInlineDocsIcon,
    handleCodemirrorContextMenu,
  ]);

  const handleCmSaveKeybind = useCallback(
    (view: EditorView): boolean => {
      handleSave();
      return true;
    },
    [handleSave],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Destroy existing view if it somehow exists (e.g., hot reload or previous render issue)
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    const initialExtensions: EditorStateConfig['extensions'] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      foldGutter(),
      indentOnInput(),
      bracketMatching(),
      autocompletion(),
      closeBrackets(),
      highlightSelectionMatches(),
      rectangularSelection(),
      crosshairCursor(),
      search(),
      EditorState.allowMultipleSelections.of(true),

      EditorView.contentAttributes.of({
        tabindex: '0',
        role: 'textbox',
        'aria-label': 'Code editor',
        'aria-multiline': 'true',
      }),

      //placeholder('Start typing or select a file...'),

      // Use compartments for configurable extensions. Initial values are captured here.
      languageCompartment.of(getLanguageExtensionByLangString(language || 'typescript')),
      themeCompartment.of(getThemeExtension($theme)),
      editableCompartment.of(EditorView.editable.of(!readOnly)),
      keymapCompartment.of(
        keymap.of([
          ...createEditorKeybindings(handleCmSaveKeybind),
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...closeBracketsKeymap,
          ...searchKeymap,
          indentWithTab,
          ...lintKeymap,
        ]),
      ),

      lintGutter(),
      linter(() => []), // Initial linter (actual linting will be triggered below and by updates)

      EditorView.updateListener.of((update) => {
        if (update.docChanged && viewRef.current) {
          const updatedContent = update.state.doc.toString();

          // Only call handleCodeMirrorChange if content actually differs
          // This prevents infinite loops if the parent component's state update
          // causes the 'value' prop to be the same as 'updatedContent'
          if (updatedContent !== getFileContent(activeFilePath)) {
            handleCodeMirrorChange(activeFilePath, updatedContent, language);
          }

          triggerESLintLinting(viewRef.current, updatedContent, activeFilePath);
        }
        if (update.selectionSet || update.docChanged) {
          const selection = update.state.selection.main;
          const line = update.state.doc.lineAt(selection.head);
          const newCursorLine = line.number;
          const newCursorCol = selection.head - line.from + 1;

          codeMirrorStatus.set({
            ...codeMirrorStatus.get(),
            line: newCursorLine,
            col: newCursorCol,
          });
        }
      }),
    ];

    const startState = EditorState.create({
      doc: value, // Use the initial 'value' prop for the document
      extensions: initialExtensions,
    });

    const view = new EditorView({
      state: startState,
      parent: container,
    });

    viewRef.current = view;

    // Set initial cursor status and trigger initial linting after view is created
    const selection = view.state.selection.main;
    const line = view.state.doc.lineAt(selection.head);
    const initialCursorLine = line.number;
    const initialCursorCol = selection.head - line.from + 1;

    codeMirrorStatus.set({
      ...codeMirrorStatus.get(),
      line: initialCursorLine,
      col: initialCursorCol,
      language: language || 'plaintext',
    });

    triggerESLintLinting(view, value, activeFilePath);


    // Cleanup function: destroys the CodeMirror instance when the component unmounts
    return () => {
      view.destroy();
      viewRef.current = null;
      codeMirrorStatus.set({ language: 'plaintext', line: 1, col: 1, isUnsaved: false });
    };
  }, [
    // Dependencies list: This effect should run only ONCE to initialize the editor.
    // Props like `value`, `language`, `$theme`, `readOnly`, `activeFilePath`
    // are used for the *initial* state. Subsequent changes to these props are
    // handled by separate `useEffect` calls that reconfigure the *existing* editor
    // instance using compartments and dispatch methods.
    // Callbacks (`handleCmSaveKeybind`, `handleCodeMirrorChange`) should be stable
    // (wrapped in `useCallback`), and refs (`containerRef`, `languageCompartment`, etc.)
    // are stable by nature.
    containerRef,
    handleCmSaveKeybind,
    handleCodeMirrorChange,
    languageCompartment,
    themeCompartment,
    editableCompartment,
    keymapCompartment,
    activeFilePath,
    
  ]);

  // This useEffect synchronizes the external 'value' prop with the CodeMirror editor.
  // It dispatches changes to the existing editor without re-initializing it.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentEditorDoc = view.state.doc.toString();

    if (value !== currentEditorDoc) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
        selection: view.state.selection.main.empty
          ? EditorSelection.cursor(value.length) // Place cursor at end if no active selection
          : view.state.selection, // Preserve selection if user has one
        userEvent: 'external.update',
      });
    }
  }, [value]); // Correctly depends only on 'value'

  // This useEffect reconfigures editor extensions when relevant props change.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        languageCompartment.reconfigure(getLanguageExtensionByLangString(language || 'plaintext')),
        themeCompartment.reconfigure(getThemeExtension($theme)),
        editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
      ],
    });

    codeMirrorStatus.set({
      ...codeMirrorStatus.get(),
      language: language || 'plaintext',
    });

    triggerESLintLinting(view, view.state.doc.toString(), activeFilePath);
  }, [
    
    language,
    $theme,
    readOnly,
    languageCompartment,
    themeCompartment,
    editableCompartment,
  ]);

  // This useEffect updates the unsaved status in the global store.
  useEffect(() => {
    const currentIsUnsaved = isFileUnsaved(activeFilePath);
    codeMirrorStatus.set({
      ...codeMirrorStatus.get(),
      isUnsaved: currentIsUnsaved,
    });
  }, [activeFilePath, $editorFilesMap]);

  // This useEffect handles the context menu.
  useEffect(() => {
    const editorDom = containerRef.current;
    if (!editorDom || !viewRef.current) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      if (viewRef.current) {
        showCodeMirrorContextMenu(
          event.clientX,
          event.clientY,
          viewRef.current,
          memoizedCodeMirrorMenuItems,
        );
      }
    };

    editorDom.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorDom.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [memoizedCodeMirrorMenuItems]);

  return (
    <>

        {value === null || value === undefined ? (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            No file selected. Please select a file from the explorer.
          </div>
        ) : value === '' ? (
          <div className="flex h-full w-full items-center  justify-center flex-col  text-gray-500">

            <Logo />
            <p className="text-sm">Add some content here to get started.</p>
     
          </div>
        ) : (
          <div className="h-full w-full">
        <div ref={containerRef} className="h-full cm-editor" />
      </div>

        )}
            <CodeMirrorContextMenuRenderer />
    

      
    </>
  );
};

export default EditorCodeMirror;
