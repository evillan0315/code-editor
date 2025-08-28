// src/utils/fileIcon.ts

/**
 * Resolves the appropriate Iconify icon string for a file or directory.
 * @param options.filename Optional file name to derive extension-based icon.
 * @param options.isDirectory True if the item is a directory.
 * @param options.isOpen If directory is open, use open-folder icon.
 * @param options.language Optional language string (e.g. "typescript", "json").
 * @returns Iconify icon string.
 */
export function getFileIcon({
  filename,
  isDirectory = false,
  isOpen = false,
  language,
}: {
  filename?: string;
  isDirectory?: boolean;
  isOpen?: boolean;
  language?: string;
}): string {
  if (isDirectory) {
    return isOpen
      ? 'vscode-icons:default-folder-opened'
      : 'vscode-icons:default-folder';
  }

  const lang =
    typeof language === 'string' ? language.toLowerCase() : undefined;
  // const lang = language?.toLowerCase();
  if (lang) {
    switch (lang) {
      case 'javascript':
        return 'vscode-icons:file-type-js';
      case 'html':
        return 'vscode-icons:file-type-html';
      case 'css':
        return 'mdi:language-css3';
      case 'json':
        return 'vscode-icons:file-type-json';
      case 'markdown':
        return 'vscode-icons:file-type-markdown';
      case 'python':
        return 'mdi:language-python';
      case 'go':
        return 'mdi:language-go';
      case 'java':
        return 'mdi:language-java';
      case 'ruby':
        return 'mdi:language-ruby';
      case 'php':
        return 'mdi:language-php';
      case 'cpp':
        return 'mdi:language-cpp';
      case 'csharp':
        return 'mdi:language-csharp';
      case 'rust':
        return 'mdi:language-rust';
      case 'sql':
        return 'mdi:database';
      case 'yaml':
      case 'yml':
        return 'vscode-icons:file-type-yaml';
      case 'xml':
        return 'mdi:xml';
      case 'dockerfile':
        return 'mdi:docker';
      case 'shell':
      case 'bash':
        return 'vscode-icons:file-type-shell';
      case 'powershell':
        return 'mdi:microsoft-powershell';

      case 'plaintext':
        return 'mdi:file-document-outline';
    }
  }

  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const extensionIcons: Record<string, string> = {

    jsx: 'tabler:file-type-jsx',
    tsx: 'tabler:file-type-tsx',
    json: 'vscode-icons:file-type-json',
    html: 'vscode-icons:file-type-html',
    css: 'vscode-icons:file-type-css',
    md: 'lineicons:markdown',
    py: 'vscode-icons:file-type-python',
    java: 'vscode-icons:file-type-java',
    cpp: 'vscode-icons:file-type-cpp',
    cs: 'vscode-icons:file-type-csharp',
    png: 'bi:filetype-png',
    jpg: 'bi:filetype-jpg',
    jpeg: 'bi:filetype-jpg',
    gif: 'bi:filetype-gif',
    svg: 'bi:filetype-svg',
    cjs: 'bi:filetype-js',
    yaml: 'bi:filetype-yml',
    env: 'vscode-icons:file-type-dotenv',
    sh: 'bi:terminal',
    config: 'vscode-icons:folder-type-config',
    xml: 'vscode-icons:file-type-xml',
    csv: 'bi:filetype-csv',
    doc: 'vscode-icons:file-type-doc',
    docx: 'vscode-icons:file-type-docx',
    prisma: 'vscode-icons:file-type-prisma',

    ts: 'vscode-icons:file-type-typescript',

    webm: 'mdi:music',
    js: 'vscode-icons:file-type-javascript',
    mjs: 'bi:filetype-js',
    ejs: 'file-icons:ejs',
    gitignore: 'simple-icons:gitignoredotio',
  };

  return extensionIcons[ext] || 'vscode-icons:default-file';
}
