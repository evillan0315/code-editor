// src/components/editor/EditorCodeMirror.tsx (MODIFIED)

import React, {
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react';
import { useStore } from '@nanostores/react';

import { showCodeMirrorContextMenu } from '@/stores/contextMenu';

import { theme } from '@/stores/theme';
import { getLanguageExtensionByLangString } from '@/utils/editorLanguage';
import { getThemeExtension } from '@/utils/editorTheme';
import { createEditorKeybindings } from '@/utils/editorKeymaps';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { useEditorTabs } from '@/hooks/useEditorTabs';
import { Icon } from '@/components/ui/Icon';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import Logo from '@/components/ui/Logo';

import { CODE_MIRROR_CONTEXT_MENU_ITEMS } from '@/constants';
import '@/styles/code-mirror.css';

interface MarkdownCodeMirrorProps {
  activeFilePath?: string;
  value: string;
  language: string;
  onContentChange: (newContent: string) => void;
  readOnly?: boolean;
}
const MarkdownCodeMirror: React.FC<MarkdownCodeMirrorProps> = ({
  activeFilePath,
  value,
  language,
  onContentChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const $theme = useStore(theme);

  const { handleCodeMirrorChange } = useEditorExplorerActions();
  const { handleSave } = useEditorTabs();

  const languageCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const editableCompartment = useRef(new Compartment()).current;
  const keymapCompartment = useRef(new Compartment()).current;

  // CodeMirror context menu icons
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
    () => (
      <Icon icon="mdi:comment-remove-outline" width="1.5em" height="1.5em" />
    ),
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
    () => (
      <Icon
        icon="mdi:comment-text-multiple-outline"
        width="1.5em"
        height="1.5em"
      />
    ),
    [],
  );

  const handleCodemirrorContextMenu = useCallback(() => {
    console.log('log');
    //handleSave();
    //return true;
  }, []);
  const memoizedCodeMirrorMenuItems = useMemo(() => {
    return CODE_MIRROR_CONTEXT_MENU_ITEMS.map((item) => {
      if (item.type !== 'button') return item;
      switch (item.id) {
        case 'optimize-code':
          return {
            ...item,
            icon: OptimizeCodeIcon,
            action: handleCodemirrorContextMenu,
          };
        case 'analyze-code':
          return { ...item, icon: AnalyzeCodeIcon };
        case 'repair-code':
          return { ...item, icon: RepairCodeIcon };
        case 'format-code':
          return { ...item, icon: FormatCodeIcon };
        case 'remove-comments':
          return { ...item, icon: RemoveCommentsIcon };
        case 'generate-code':
          return { ...item, icon: GenerateCodeIcon };
        case 'generate-documentation':
          return { ...item, icon: GenerateDocsIcon };
        case 'generate-inline-documentation':
          return { ...item, icon: GenerateInlineDocsIcon };
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

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageCompartment.of(
          getLanguageExtensionByLangString(language || 'plaintext'),
        ),
        themeCompartment.of(getThemeExtension($theme)),
        editableCompartment.of(EditorView.editable.of(!readOnly)),
        keymapCompartment.of(
          keymap.of(createEditorKeybindings(handleCmSaveKeybind)),
        ),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && viewRef.current) {
            const updatedContent = update.state.doc.toString();
            if (updatedContent !== value) {
              handleCodeMirrorChange?.(
                activeFilePath,
                updatedContent,
                language,
              );
            }
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: container,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [
    containerRef,
    handleCmSaveKeybind,
    onContentChange,
    languageCompartment,
    themeCompartment,
    editableCompartment,
    keymapCompartment,
    activeFilePath,
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
        selection: { anchor: value.length },
        userEvent: 'external.update',
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        languageCompartment.reconfigure(
          getLanguageExtensionByLangString(language || 'plaintext'),
        ),
        themeCompartment.reconfigure(getThemeExtension($theme)),
        editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
      ],
    });
  }, [
    language,
    $theme,
    readOnly,
    languageCompartment,
    themeCompartment,
    editableCompartment,
  ]);

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
          //CODE_MIRROR_CONTEXT_MENU_ITEMS,
          memoizedCodeMirrorMenuItems,
        );
      }
    };

    editorDom.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorDom.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [value]);

  if (value === null || value === undefined) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        No file selected. Please select a file from the explorer.
      </div>
    );
  }

  if (value === '') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
        <Logo />
        <p className="text-sm">Add some content here to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full">
        <div ref={containerRef} className="h-full cm-editor" />
      </div>
    </>
  );
};

export default MarkdownCodeMirror;
