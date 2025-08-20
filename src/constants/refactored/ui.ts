import React from 'react';
import { EditorSelection } from '@codemirror/state';
import { language } from '@codemirror/language';

import type { CodeMirrorActionItem } from '@/types/codeMirror';
import type { FileItem, ContextMenuItem } from '@/types/file-system';
import { getSelectionOrDoc, formatCode } from '@/utils/codeMirror';

// --- UI General Constants ---
export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const TERMINAL_COMMANDS = [
  '/new',
  '/system',
  '/persona',
  '/file',
  '/files',
  '/summarize',
  '/translate',
  '/retry',
  '/save',
  '/code',
];

export const PROMPT_PREFIX = '🤖 AI > ';

export const HEADER = 'header';
export const DIVIDER = 'divider';
export const BUTTON = 'button';

export const TTS_LANGUAGE_OPTIONS = [
  { label: 'Arabic (Egyptian)', code: 'ar-EG' },
  { label: 'German (Germany)', code: 'de-DE' },
  { label: 'English (US)', code: 'en-US' },
  { label: 'Spanish (US)', code: 'es-US' },
  { label: 'French (France)', code: 'fr-FR' },
  { label: 'Hindi (India)', code: 'hi-IN' },
  { label: 'Indonesian (Indonesia)', code: 'id-ID' },
  { label: 'Italian (Italy)', code: 'it-IT' },
  { label: 'Japanese (Japan)', code: 'ja-JP' },
  { label: 'Korean (Korea)', code: 'ko-KR' },
  { label: 'Portuguese (Brazil)', code: 'pt-BR' },
  { label: 'Russian (Russia)', code: 'ru-RU' },
  { label: 'Dutch (Netherlands)', code: 'nl-NL' },
  { label: 'Polish (Poland)', code: 'pl-PL' },
  { label: 'Thai (Thailand)', code: 'th-TH' },
  { label: 'Turkish (Turkey)', code: 'tr-TR' },
  { label: 'Vietnamese (Vietnam)', code: 'vi-VN' },
  { label: 'Romanian (Romania)', code: 'ro-RO' },
  { label: 'Ukrainian (Ukraine)', code: 'uk-UA' },
  { label: 'Bengali (Bangladesh)', code: 'bn-BD' },
  { label: 'English (India)', code: 'en-IN' },
  { label: 'Marathi (India)', code: 'mr-IN' },
  { label: 'Tamil (India)', code: 'ta-IN' },
  { label: 'Telugu (India)', code: 'te-IN' },
];

export const TTS_VOICE_OPTIONS = [
  { name: 'Zephyr', tone: 'Bright' },
  { name: 'Puck', tone: 'Upbeat' },
  { name: 'Charon', tone: 'Informative' },
  { name: 'Kore', tone: 'Firm' },
  { name: 'Fenrir', tone: 'Excitable' },
  { name: 'Leda', tone: 'Youthful' },
  { name: 'Orus', tone: 'Firm' },
  { name: 'Aoede', tone: 'Breezy' },
  { name: 'Callirrhoe', tone: 'Easy-going' },
  { name: 'Autonoe', tone: 'Bright' },
  { name: 'Enceladus', tone: 'Breathy' },
  { name: 'Iapetus', tone: 'Clear' },
  { name: 'Umbriel', tone: 'Easy-going' },
  { name: 'Algieba', tone: 'Smooth' },
  { name: 'Despina', tone: 'Smooth' },
  { name: 'Erinome', tone: 'Clear' },
  { name: 'Algenib', tone: 'Gravelly' },
  { name: 'Rasalgethi', tone: 'Informative' },
  { name: 'Laomedeia', tone: 'Upbeat' },
  { name: 'Achernar', tone: 'Soft' },
  { name: 'Alnilam', tone: 'Firm' },
  { name: 'Schedar', tone: 'Even' },
  { name: 'Gacrux', tone: 'Mature' },
  { name: 'Pulcherrima', tone: 'Forward' },
  { name: 'Achird', tone: 'Friendly' },
  { name: 'Zubenelgenubi', tone: 'Casual' },
  { name: 'Vindemiatrix', tone: 'Gentle' },
  { name: 'Sadachbia', tone: 'Lively' },
  { name: 'Sadaltager', tone: 'Knowledgeable' },
  { name: 'Sulafat', tone: 'Warm' },
];

export const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'React JSX',
  ts: 'TypeScript',
  tsx: 'React TSX',
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

// --- CodeMirror Context Menu Items ---
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

// --- File Explorer Context Menu Items ---
export const FILE_EXPLORER_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  {
    type: 'header',
    label: 'Create File',
  },
  {
    id: 'create-file',
    label: 'Optimize Code',
    action: (event: React.MouseEvent, file: FileItem) => {
      console.log(file);
    },
    icon: 'mdi:speedometer',
    type: 'button',
  },
  {
    type: 'divider',
  },
  {
    id: 'Delete-File',
    label: 'Delete File',
    action: (event: MouseEvent, file: FileItem) => {},
    icon: 'mdi:magnify',
    type: 'button',
  },
];
