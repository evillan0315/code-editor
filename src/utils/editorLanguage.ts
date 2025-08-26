import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { yaml } from '@codemirror/lang-yaml';
import { xml } from '@codemirror/lang-xml';
import { json } from '@codemirror/lang-json';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { type Extension } from '@codemirror/state';

// If you have specific CodeMirror language extensions for these, uncomment and import them:
// import { go } from "@codemirror/lang-go";
// import { java } from "@codemirror/lang-java";
// import { php } from "@codemirror/lang-php";
// import { cpp } from "@codemirror/lang-cpp";
// import { rust } from "@codemirror/lang-rust";
// import { shell } from "@codemirror/lang-shell";
// import { handlebarsLanguage } from "@xiechao/codemirror-lang-handlebars";

/**
 * Maps a given language name string (e.g., "javascript", "python") to its
 * corresponding CodeMirror language extension. This is useful when the
 * language is explicitly known (e.g., from an API response or file metadata).
 *
 * It also handles common file extensions as language names (e.g., "js", "ts", "md").
 *
 * @param {string | undefined} languageName - The name of the language (e.g., "javascript", "json", "js", "md").
 * @returns {Extension} A CodeMirror language extension, or an empty array `[]`
 *                      if no matching extension is found.
 */
export function getLanguageExtensionByLangString(
  languageName?: string,
): Extension {
  if (!languageName || typeof languageName !== 'string') {
    return []; // No language name provided, return no specific highlighting
  }

  // Convert to lowercase for case-insensitive matching
  const lowerCaseLanguageName = languageName.toLowerCase();

  switch (lowerCaseLanguageName) {
    // JavaScript/TypeScript and related
    case 'javascript':
    case 'js': // Added common extension
    case 'typescript':
    case 'ts': // Added common extension
    case 'jsx':
    case 'tsx':
    case 'cjs': // CommonJS module extension
    case 'mjs': // ES module extension
    case 'ejs': // Embedded JavaScript extension
    case 'prisma': // Prisma schema files often use JS-like syntax highlighting
      return javascript();

    // HTML and related
    case 'html':
    case 'htm': // Common abbreviation
    case 'hbs': // Handlebars extension
    case 'handlebars': // If full name is used
      return html();
    // If you have a dedicated handlebars language extension:
    // return handlebarsLanguage();

    // CSS
    case 'css':
      return css();

    // JSON
    case 'json':
      return json();

    // Markdown
    case 'markdown':
    case 'md': // Added common extension
      return markdown();

    // Python
    case 'python':
    case 'py': // Added common extension
      return python();

    // SQL
    case 'sql':
      return sql();

    // YAML
    case 'yaml':
    case 'yml': // Added common extension
      return yaml();

    // XML
    case 'xml':
      return xml();

    // Add cases for other languages if you have their CodeMirror extensions imported:
    // case "go": return go();
    // case "java": return java();
    // case "php": return php();
    // case "cpp": // C++
    // case "c": // C (often highlighted with C++ extension)
    // case "hpp": // C++ Header
    // case "h": // C Header
    //   return cpp();
    // case "rust":
    // case "rs": // Rust extension
    //   return rust();
    // case "sh": // Shell Script
    // case "bash": // Bash Script
    //   return shell();
    // case "ps1": // PowerShell Script
    //   return []; // No direct CodeMirror extension for PowerShell currently listed
    // case "txt": // Plain Text
    // case "license":
    // case "readme":
    // case "dockerfile":
    // case "makefile":
    //   return []; // Treat as plain text or add specific extensions if imported

    default:
      // Log a warning for unknown languages to help debugging
      console.warn(
        `No CodeMirror extension found for language string: "${languageName}". Falling back to plain text.`,
      );
      return []; // Default to plain text (no specific highlighting)
  }
}

/**
 * Determines the appropriate CodeMirror language extension based on a file's path or name.
 * This function is useful as a fallback or if the language is not explicitly provided.
 * It primarily infers language from file extensions.
 *
 * @param {string | undefined} filePath - The full path or name of the file (e.g., "src/index.ts", "Dockerfile", "README.md").
 * @returns {Extension} A CodeMirror language extension, or an empty array `[]`
 *                      if no specific extension is found.
 */
export function getLanguageExtensionByFilename(filePath?: string): Extension {
  if (!filePath || typeof filePath !== 'string') {
    return [];
  }
  // console.log(filePath, 'filePath for filename detection'); // Uncomment for debugging

  const fileName = filePath.split(/[/\\]/).pop(); // Gets the last part of the path (filename)
  if (!fileName) {
    return [];
  }

  const lowerCaseFileName = fileName.toLowerCase();
  // Handle common files that might not have traditional extensions (e.g., "Dockerfile")
  switch (lowerCaseFileName) {
    case 'dockerfile':
      // If you had `@codemirror/lang-docker`, you'd return it here.
      return [];
    case 'makefile':
      // If you had `@codemirror/lang-makefile`, you'd return it here.
      return [];
    case 'license':
    case 'readme':
      return []; // Often plain text
  }

  // Extract the file extension
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;

  if (!ext) {
    return []; // No extension found
  }

  // Map file extensions to CodeMirror language extensions
  switch (ext) {
    // JavaScript/TypeScript and related
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'cjs': // CommonJS module
    case 'mjs': // ES module
    case 'ejs': // Embedded JavaScript
    case 'prisma': // Prisma schema files often use JS-like syntax highlighting
      return javascript();

    // HTML and related
    case 'html':
    case 'htm':
    case 'hbs': // Handlebars, often highlighted as HTML
      return html();
    // If you have a dedicated handlebars language extension:
    // return handlebarsLanguage();

    // CSS
    case 'css':
      return css();

    // JSON
    case 'json':
      return json();

    // Markdown
    case 'md':
    case 'markdown':
      return markdown();

    // Python
    case 'py':
      return python();

    // SQL
    case 'sql':
      return sql();

    // YAML
    case 'yaml':
    case 'yml':
      return yaml();

    // XML
    case 'xml':
      return xml();

    // Add cases for other languages whose extensions you want to support for inference:
    // case "go": return go();
    // case "java": return java();
    // case "rb": return php(); // Ruby
    // case "php": return php();
    // case "cpp": return cpp();
    // case "c": return cpp();
    // case "rs": return rust(); // Rust
    // case "sh": return shell(); // Shell Script (or [])
    // case "bash": return shell(); // Bash Script (or [])
    // case "txt": return []; // Plain Text

    default:
      return []; // For any other unknown or unsupported extensions
  }
}
