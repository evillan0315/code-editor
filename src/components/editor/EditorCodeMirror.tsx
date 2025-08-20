import React, { useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { showCodeMirrorContextMenu } from '@/stores/contextMenu';
import { CodeMirrorContextMenuRenderer } from '@/components/editor/CodeMirrorContextMenuRenderer';
import { theme } from '@/stores/theme';
import {
  editorFilesMap,
  isFileUnsaved,
  codeMirrorStatus,
  getFileContent,
  editorCurrentDirectory,
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
  CompletionSource, CompletionResult, CompletionContext, Completion 
} from '@codemirror/autocomplete';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { rectangularSelection, crosshairCursor } from '@codemirror/view';

import { lintGutter } from '@codemirror/lint';
import {
  eslintLinterCompartment,
  initialESLintLinterExtension,
  triggerFileLinting,
} from '@/utils/eslintLinter';

import { getSelectionOrDoc, formatCode } from '@/utils/codeMirror';
import { ContextMenuActionItem } from '@/types';
import { CODE_MIRROR_CONTEXT_MENU_ITEMS } from '@/constants';
import '@/styles/code-mirror.css';

// 🚀 NEW IMPORT: Your client-side import detection plugin
import { importDetectionPlugin } from '@/utils/codeMirrorImportDetector';

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
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);

  const { handleCodeMirrorChange } = useEditorExplorerActions();
  const { handleSave } = useEditorTabs();

  const languageCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const editableCompartment = useRef(new Compartment()).current;
  const keymapCompartment = useRef(new Compartment()).current;

  // If you need to reconfigure the import detection plugin later (e.g., change debounce time)
  // you would use a compartment for it:
  // const importDetectionCompartment = useRef(new Compartment()).current;

  const OptimizeCodeIcon = useMemo(
    () => <Icon icon='mdi:speedometer' width='1.5em' height='1.5em' />,
    [],
  );
  const AnalyzeCodeIcon = useMemo(
    () => <Icon icon='mdi:magnify' width='1.5em' height='1.5em' />,
    [],
  );
  const RepairCodeIcon = useMemo(
    () => <Icon icon='mdi:wrench-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const FormatCodeIcon = useMemo(
    () => <Icon icon='mdi:format-align-left' width='1.5em' height='1.5em' />,
    [],
  );
  const RemoveCommentsIcon = useMemo(
    () => <Icon icon='mdi:comment-remove-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const GenerateCodeIcon = useMemo(
    () => <Icon icon='mdi:lightbulb-on-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const GenerateDocsIcon = useMemo(
    () => <Icon icon='mdi:book-open-outline' width='1.5em' height='1.5em' />,
    [],
  );
  const GenerateInlineDocsIcon = useMemo(
    () => <Icon icon='mdi:comment-text-multiple-outline' width='1.5em' height='1.5em' />,
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
        ]),
      ),

      lintGutter(),
      eslintLinterCompartment.of(initialESLintLinterExtension),

      // 🚀 ADDED: Your new client-side import detection plugin here
      // It will receive the activeFilePath to provide context in its console logs.
      importDetectionPlugin(activeFilePath),
      // If using a compartment:
      // importDetectionCompartment.of(importDetectionPlugin(activeFilePath)),

      EditorView.updateListener.of((update) => {
        if (update.docChanged && viewRef.current) {
          const updatedContent = update.state.doc.toString();

          if (updatedContent !== getFileContent(activeFilePath)) {
            handleCodeMirrorChange(activeFilePath, updatedContent, language);
          }

          triggerFileLinting(viewRef.current, updatedContent, activeFilePath);
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
      doc: value,
      extensions: initialExtensions,
    });

    const view = new EditorView({
      state: startState,
      parent: container,
    });

    viewRef.current = view;

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

    triggerFileLinting(view, value, activeFilePath);

    return () => {
      view.destroy();
      viewRef.current = null;
      codeMirrorStatus.set({ language: 'plaintext', line: 1, col: 1, isUnsaved: false });
    };
  }, [
    containerRef,
    handleCmSaveKeybind,
    handleCodeMirrorChange,
    languageCompartment,
    themeCompartment,
    editableCompartment,
    keymapCompartment,
    activeFilePath, // Re-create plugin if activeFilePath changes
    // If using a compartment: importDetectionCompartment,
  ]);

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
          ? EditorSelection.cursor(value.length)
          : view.state.selection,
        userEvent: 'external.update',
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        languageCompartment.reconfigure(getLanguageExtensionByLangString(language || 'plaintext')),
        themeCompartment.reconfigure(getThemeExtension($theme)),
        editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
        // If importDetectionCompartment was used, reconfigure it here too if `activeFilePath` changes:
        // importDetectionCompartment.reconfigure(importDetectionPlugin(activeFilePath)),
      ],
    });

    codeMirrorStatus.set({
      ...codeMirrorStatus.get(),
      language: language || 'plaintext',
    });

    // Re-trigger linting when language/theme/readOnly changes, or on re-render related to activeFilePath
    triggerFileLinting(view, view.state.doc.toString(), activeFilePath);
  }, [
    language,
    $theme,
    readOnly,
    languageCompartment,
    themeCompartment,
    editableCompartment,
    activeFilePath,
  ]);

  useEffect(() => {
    const currentIsUnsaved = isFileUnsaved(activeFilePath);
    codeMirrorStatus.set({
      ...codeMirrorStatus.get(),
      isUnsaved: currentIsUnsaved,
    });
  }, [activeFilePath, $editorFilesMap]);

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
        <div className='flex h-full w-full items-center justify-center text-gray-500'>
          No file selected. Please select a file from the explorer.
        </div>
      ) : value === '' ? (
        <div className='flex h-full w-full items-center  justify-center flex-col  text-gray-500'>
          <Logo />
          <p className='text-sm'>Add some content here to get started.</p>
        </div>
      ) : (
        <div className='h-full w-full'>
          <div ref={containerRef} className='h-full cm-editor' />
        </div>
      )}
      <CodeMirrorContextMenuRenderer />
    </>
  );
};

export default EditorCodeMirror;

