import { ViewPlugin, EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { IMPORT_SPECIFIER_REGEX, PATH_ALIASES_MAP } from '@/constants';

/**
 * Simulates basic alias resolution based on the hardcoded map.
 * This does not check for file existence or full module resolution.
 * @param specifier The import string (e.g., "@/components/MyComponent")
 * @returns A string representing the potentially resolved path (e.g., "src/components/MyComponent")
 */
function simulateAliasResolution(specifier: string): string {
  for (const alias in PATH_ALIASES_MAP) {
    if (specifier.startsWith(alias)) {
      return PATH_ALIASES_MAP[alias] + specifier.substring(alias.length);
    }
  }
  return specifier; // Return the original specifier if no alias matched
}

/**
 * Simple debounce function to limit how often import analysis runs.
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Core function to detect import specifiers in the given document content.
 * Logs the detected imports to the console, simulating alias resolution for local paths.
 * @param doc The content of the editor document.
 * @param filePath The active file path, for context in logs.
 */
const detectAndLogImports = debounce(
  (doc: string, filePath: string | undefined) => {
    const detectedImports: {
      specifier: string;
      simulatedResolvedPath?: string;
      type: 'local' | 'external';
    }[] = [];
    let match;

    // Reset regex lastIndex for repeated executions
    IMPORT_SPECIFIER_REGEX.lastIndex = 0;

    while ((match = IMPORT_SPECIFIER_REGEX.exec(doc)) !== null) {
      const specifier = match[1];
      if (specifier) {
        // Heuristic for "local" imports: starts with '.' or one of the defined aliases
        const isLocalCandidate =
          specifier.startsWith('.') ||
          Object.keys(PATH_ALIASES_MAP).some((alias) =>
            specifier.startsWith(alias),
          );

        if (isLocalCandidate) {
          detectedImports.push({
            specifier,
            simulatedResolvedPath: simulateAliasResolution(specifier),
            type: 'local',
          });
        } else {
          detectedImports.push({
            specifier,
            type: 'external',
          });
        }
      }
    }

    console.groupCollapsed(
      `CodeMirror Import Analysis: ${filePath || 'Current File'} (${detectedImports.length} imports)`,
    );
    if (detectedImports.length === 0) {
      console.log('No import/export statements found.');
    } else {
      detectedImports.forEach((imp) => {
        if (imp.type === 'local') {
          console.log(
            `Local Import: "${imp.specifier}" -> Simulated: "${imp.simulatedResolvedPath}"`,
          );
        } else {
          console.log(`External Import: "${imp.specifier}"`);
        }
      });
    }
    console.groupEnd();
  },
  750,
); // Debounce by 750ms to avoid excessive runs while typing

/**
 * CodeMirror ViewPlugin that triggers import detection on document changes.
 * @param activeFilePath The path of the currently active file, passed from the React component.
 */
export const importDetectionPlugin = (activeFilePath: string | undefined) =>
  ViewPlugin.define((view) => {
    // Initial analysis when the editor view is first created
    detectAndLogImports(view.state.doc.toString(), activeFilePath);

    return {
      update(update: ViewUpdate) {
        // Re-run analysis only if the document content has changed
        if (update.docChanged) {
          detectAndLogImports(update.state.doc.toString(), activeFilePath);
        }
      },
      destroy() {
        // Optional cleanup if necessary when the plugin is removed/editor destroyed
      },
    };
  });
