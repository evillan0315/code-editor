// --- Core Application & API Constants ---
export const APP_NAME = "Project Board";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION =
  "The best solution to manage your projects efficiently and effortlessly.";

export const API_URL: string = `${import.meta.env.VITE_WS_URL}`;
export const BASE_URL_API: string = API_URL || "http://localhost:5000";

export const VITE_BASE_DIR: string = import.meta.env.VITE_BASE_DIR || '';
if (!VITE_BASE_DIR) {
  console.warn("VITE_BASE_DIR is not set in environment variables. ESLint may not find correct configurations.");
}
console.log(import.meta.dirname, 'import.meta')
// All Default config
export const DEFAULT_LANGUAGE = "typescript";

export {
  GET_FILES,
  READ_FILE,
  WRITE_FILE,
  STRIP_CODE_BLOCK,
  OPTIMIZE_CODE,
  REMOVE_COMMENTS,
  FORMAT_CODE,
  GENERATE_TEXT,
  GENERATE_FILE,
  CONVERT_MARKDOWN_TO_HTML,
  API_ENDPOINTS,
} from "./endpoint";
export { CODE_MIRROR_CONTEXT_MENU_ITEMS } from "@/constants/codemirror";
export { FILE_SERVICE } from "@/constants/file";

// socket
export {
  FILE_NAMESPACE,
  HTTP_STATUS,
  EVENT_PREFIX,
  SOCKET_EVENTS,
  SOCKET_EVENTS_MERGED,
} from "@/constants/socket";

// Chat and AI chat
export {
  CONV_ID_KEY,
  SYSTEM_INSTR_KEY,
  HISTORY_KEY,
  CONVERSATION_RESPONSES_KEY,
  // --- AI Persona System Instructions ---
  SYSTEM_INSTRUCTIONS_REACT_EXPERT,
  SYSTEM_INSTRUCTIONS_CODE_OPTIMIZER,
  SYSTEM_INSTRUCTIONS_BASH_ADMIN_EXPERT,
  SYSTEM_INSTRUCTIONS_DEVOPS_EXPERT,
  SYSTEM_INSTRUCTIONS_FULLSTACK_DEVELOPER_EXPERT,
  SYSTEM_INSTRUCTIONS_SOFTWARE_ENGINEER_EXPERT,
  SYSTEM_INSTRUCTIONS_CODEGENIUS,
  SYSTEM_INSTRUCTIONS_DOCUMENTATION,
  // AI Personas
  PERSONAS,
} from "@/constants/gemini";

export const HEADER = "header";
export const DIVIDER = "divider";
export const BUTTON = "button";

// AppLayout Layout constants
export const TARGET_LEFT_PERCENTAGE = 0.2; // Left sidebar target: 30% of screen width
export const TARGET_RIGHT_PERCENTAGE = 0.3; // Right sidebar target: 30% of screen width

// Minimum pixel dimensions that resizable components can be (both width and height)
export const MIN_DIMENSION_PX = 260; // Unified minimum pixel size (e.g., 40px for width or height)

// Maximum percentage constraints for resizing.
export const MAX_LEFT_PERCENTAGE_CONSTRAINT = 0.2; // Left sidebar max 20% of window width
export const MAX_RIGHT_PERCENTAGE_CONSTRAINT = 0.6; // Right sidebar max 40% of window width

// Constants for the Main Content Area Terminal
export const TARGET_TERMINAL_PERCENTAGE = 0.4; // Terminal initial height: 30% of screen height
export const MAX_TERMINAL_PERCENTAGE_CONSTRAINT = 0.8; // Terminal max height: 60% of screen height

// New Constants for the Resizable Bottom Panels within Sidebars
export const TARGET_SIDEBAR_BOTTOM_PANEL_PERCENTAGE = 0.2; // Initial height 50% of its parent sidebar's available height
export const MAX_SIDEBAR_BOTTOM_PANEL_PERCENTAGE_CONSTRAINT = 0.2; // Max height 80% of its parent sidebar's available height

// --- File Size & Conversation Limits ---
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CONVERSATION_LIST_LIMIT = 50;
export const CONVERSATION_HISTORY_LIMIT = 1000;
export const TYPE_SPEED_MS = 0;

// Constants for max and min dimensions for floating movable component - src/components/FloatingConfigPanel.tsx
export const MAX_WIDTH_PERCENT = 30; // Max width: 30% of viewport width
export const MAX_HEIGHT_VH = 60; // Max height: 30% of viewport height
export const MIN_SIZE_PX = 100; // Minimum width/height in pixels

// --- UI/Editor Related Constants ---
export const TTS_LANGUAGE_OPTIONS = [
  { label: "Arabic (Egyptian)", code: "ar-EG" },
  { label: "German (Germany)", code: "de-DE" },
  { label: "English (US)", code: "en-US" },
  { label: "Spanish (US)", code: "es-US" },
  { label: "French (France)", code: "fr-FR" },
  { label: "Hindi (India)", code: "hi-IN" },
  { label: "Indonesian (Indonesia)", code: "id-ID" },
  { label: "Italian (Italy)", code: "it-IT" },
  { label: "Japanese (Japan)", code: "ja-JP" },
  { label: "Korean (Korea)", code: "ko-KR" },
  { label: "Portuguese (Brazil)", code: "pt-BR" },
  { label: "Russian (Russia)", code: "ru-RU" },
  { label: "Dutch (Netherlands)", code: "nl-NL" },
  { label: "Polish (Poland)", code: "pl-PL" },
  { label: "Thai (Thailand)", code: "th-TH" },
  { label: "Turkish (Turkey)", code: "tr-TR" },
  { label: "Vietnamese (Vietnam)", code: "vi-VN" },
  { label: "Romanian (Romania)", code: "ro-RO" },
  { label: "Ukrainian (Ukraine)", code: "uk-UA" },
  { label: "Bengali (Bangladesh)", code: "bn-BD" },
  { label: "English (India)", code: "en-IN" },
  { label: "Marathi (India)", code: "mr-IN" },
  { label: "Tamil (India)", code: "ta-IN" },
  { label: "Telugu (India)", code: "te-IN" },
];
export const TTS_VOICE_OPTIONS = [
  { name: "Zephyr", tone: "Bright" },
  { name: "Puck", tone: "Upbeat" },
  { name: "Charon", tone: "Informative" },
  { name: "Kore", tone: "Firm" },
  { name: "Fenrir", tone: "Excitable" },
  { name: "Leda", tone: "Youthful" },
  { name: "Orus", tone: "Firm" },
  { name: "Aoede", tone: "Breezy" },
  { name: "Callirrhoe", tone: "Easy-going" },
  { name: "Autonoe", tone: "Bright" },
  { name: "Enceladus", tone: "Breathy" },
  { name: "Iapetus", tone: "Clear" },
  { name: "Umbriel", tone: "Easy-going" },
  { name: "Algieba", tone: "Smooth" },
  { name: "Despina", tone: "Smooth" },
  { name: "Erinome", tone: "Clear" },
  { name: "Algenib", tone: "Gravelly" },
  { name: "Rasalgethi", tone: "Informative" },
  { name: "Laomedeia", tone: "Upbeat" },
  { name: "Achernar", tone: "Soft" },
  { name: "Alnilam", tone: "Firm" },
  { name: "Schedar", tone: "Even" },
  { name: "Gacrux", tone: "Mature" },
  { name: "Pulcherrima", tone: "Forward" },
  { name: "Achird", tone: "Friendly" },
  { name: "Zubenelgenubi", tone: "Casual" },
  { name: "Vindemiatrix", tone: "Gentle" },
  { name: "Sadachbia", tone: "Lively" },
  { name: "Sadaltager", tone: "Knowledgeable" },
  { name: "Sulafat", tone: "Warm" },
];

export const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
  js: "JavaScript",
  //jsx: "JSX",
  ts: "TypeScript",
  //tsx: "TSX",
  jsx: 'React JSX', // Important: This entry *could* be here, but our new logic overrides it for explicit "React JSX"
  tsx: 'React TSX', // Important: Same here for "React TSX"
  py: "Python",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  http: "HTTP",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  sql: "SQL",
  md: "Markdown",
  markdown: "Markdown",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  makefile: "Makefile",
  ini: "INI",
  toml: "TOML",
  rs: "Rust",
  go: "Go",
  java: "Java",
  kt: "Kotlin",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  c: "C",
  cs: "C#",
  php: "PHP",
  ruby: "Ruby",
  rb: "Ruby",
  swift: "Swift",
  dart: "Dart",
  scala: "Scala",
  groovy: "Groovy",
  perl: "Perl",
  r: "R",
  lua: "Lua",
  tex: "LaTeX",
  asm: "Assembly",
  clj: "Clojure",
  cljc: "Clojure",
  cljs: "ClojureScript",
  edn: "EDN",
  vue: "Vue",
  svelte: "Svelte",
  plaintext: "Plain Text",
  txt: "Plain Text",
  text: "Plain Text",
};

export const SPINNER_FRAMES = [
  "⠋",
  "⠙",
  "⠹",
  "⠸",
  "⠼",
  "⠴",
  "⠦",
  "⠧",
  "⠇",
  "⠏",
];

export const TERMINAL_COMMANDS = [
  "/new",
  "/system",
  "/persona",
  "/file",
  "/files",
  "/summarize",
  "/translate",
  "/retry",
  "/save",
  "/code",
];

export const PROMPT_PREFIX = "🤖 AI > ";

// --- New Additions / Requested Items ---

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

export const SUPPORTED_FILE_EXTENSIONS = [
  // Programming & Scripting
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs", // JavaScript/TypeScript
  ".py",
  ".pyc",
  ".pyd", // Python
  ".java",
  ".class",
  ".jar", // Java
  ".cs", // C#
  ".c",
  ".cpp",
  ".h",
  ".hpp", // C/C++
  ".go", // Go
  ".rs", // Rust
  ".php",
  ".phps",
  ".phtml", // PHP
  ".rb", // Ruby
  ".swift", // Swift
  ".kt",
  ".kts", // Kotlin
  ".dart", // Dart
  ".sh",
  ".bash",
  ".zsh", // Shell scripts
  ".pl", // Perl
  ".r", // R
  ".lua", // Lua
  ".scala", // Scala
  ".groovy", // Groovy
  ".clj",
  ".cljc",
  ".cljs",
  ".edn", // Clojure

  // Web Technologies
  ".html",
  ".htm", // HTML
  ".css",
  ".scss",
  ".sass",
  ".less", // CSS variants
  ".vue", // Vue Single File Components
  ".svelte", // Svelte Single File Components
  ".json",
  ".jsonc", // JSON & JSON with comments
  ".xml", // XML

  // Configuration & Data
  ".yaml",
  ".yml", // YAML
  ".ini", // INI
  ".toml", // TOML
  ".env", // Environment variables
  "Dockerfile", // Docker (no extension but common file name)
  "Makefile", // Make (no extension but common file name)

  // Markdown & Documentation
  ".md",
  ".markdown", // Markdown
  ".txt",
  ".log", // Plain text

  // SQL & Database
  ".sql", // SQL

  // Other commonly supported
  ".gitignore",
  ".editorconfig",
  ".npmrc",
  ".prettierrc", // Config files
  ".csv",
  ".tsv", // Data files
  ".svg", // Vector graphics (code-like)
];

// --- End Combined Content ---
