import { EditorSelection } from '@codemirror/state';
import { language } from '@codemirror/language';

import { CodeMirrorActionItem } from '@/types/codeMirror';
import { getSelectionOrDoc, formatCode } from '@/utils/codeMirror';

export const CODE_MIRROR_CONTEXT_MENU_ITEMS: CodeMirrorActionItem[] = [
  {
    type: 'header',
    label: 'Code Tools',
  },
  {
    id: 'optimize-code',
    label: 'Optimize Code',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Optimizing code:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:speedometer',
    type: 'button',
  },
  {
    id: 'analyze-code',
    label: 'Analyze Code',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Analyzing code:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:magnify',
    type: 'button',
  },
  {
    id: 'repair-code',
    label: 'Repair Code',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Repairing code:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:wrench-outline',
    type: 'button',
  },
  {
    type: 'divider',
  },
  {
    id: 'format-code',
    label: 'Format Code',
    action: async (view) => {
      const code = view.state.doc.toString();

      const activeLanguage = view.state.facet(language);
      let languageToUse = 'plaintext';

      if (activeLanguage) {
        languageToUse = activeLanguage.name;
        console.log('Detected CodeMirror Language:', languageToUse);
      } else {
        console.warn(
          'No specific language extension found for CodeMirror state. Falling back to:',
          languageToUse,
        );
      }

      const formatted = await formatCode({ code, language: languageToUse });
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: formatted },
        selection: EditorSelection.cursor(0),
      });
      console.log('Action: Formatting code.', formatted);
    },
    icon: 'mdi:format-align-left',
    type: 'button',
  },
  {
    id: 'remove-comments',
    label: 'Remove Code Comments',
    action: (view) => {
      const currentDoc = view.state.doc.toString();

      const cleanedCode = currentDoc.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|/g, '');
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: cleanedCode },
        selection: EditorSelection.cursor(0),
      });
      console.log(cleanedCode, 'cleanedCode');
      console.log('Action: Removed comments.');
    },
    icon: 'mdi:comment-remove-outline',
    type: 'button',
  },
  {
    type: 'divider',
  },
  {
    id: 'generate-code',
    label: 'Generate Code',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Generating code:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:lightbulb-on-outline',
    type: 'button',
  },
  {
    id: 'generate-documentation',
    label: 'Generate Documentation',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Generating documentation:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:book-open-outline',
    type: 'button',
  },
  {
    id: 'generate-inline-documentation',
    label: 'Generate Inline Documentation',
    action: (view) => {
      const selectedCode = getSelectionOrDoc(view);
      console.log('Action: Generating inline docs:', selectedCode.substring(0, 100) + '...');
    },
    icon: 'mdi:comment-text-multiple-outline',
    type: 'button',
  },
];

export const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  http: 'HTTP',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  less: 'Less',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  sql: 'SQL',
  md: 'Markdown',
  markdown: 'Markdown',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  makefile: 'Makefile',
  ini: 'INI',
  toml: 'TOML',
  rs: 'Rust',
  go: 'Go',
  java: 'Java',
  kt: 'Kotlin',
  cpp: 'C++',
  cc: 'C++',
  cxx: 'C++',
  c: 'C',
  cs: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  rb: 'Ruby',
  swift: 'Swift',
  dart: 'Dart',
  scala: 'Scala',
  groovy: 'Groovy',
  perl: 'Perl',
  r: 'R',
  lua: 'Lua',
  tex: 'LaTeX',
  asm: 'Assembly',
  clj: 'Clojure',
  cljc: 'Clojure',
  cljs: 'ClojureScript',
  edn: 'EDN',
  vue: 'Vue',
  svelte: 'Svelte',
  plaintext: 'Plain Text',
  txt: 'Plain Text',
  text: 'Plain Text',
};
