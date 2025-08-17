import { apiFetch, ApiError } from '@/services/apiFetch';
import { API_ENDPOINTS, VITE_BASE_DIR } from '@/constants';

import { linter, Diagnostic, setDiagnostics } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import {
  editorActiveFilePath,
  editorCurrentDirectory,
  lintDiagnostics,
  directoryLintDiagnostics,
} from '@/stores/editorContent';
import { eslintService } from '@/services/eslintService';
import { Debouncer } from '@/utils/debouncer';
import { getParentPath } from '@/utils/fileTreeUtils';

// A Map to store the linter diagnostics for each file. This allows `linter` to quickly retrieve them.
const fileLintCache = new Map<string, Diagnostic[]>();

// Debouncer for linting calls to avoid excessive API requests
const fileLintDebouncer = new Debouncer(500);
const directoryLintDebouncer = new Debouncer(1000); // Longer debounce for directory linting

// Define the compartment that will hold the linter extension.
// This allows us to reconfigure the linter dynamically if needed,
// for example, to change its source function or enable/disable it.
export const eslintLinterCompartment = new Compartment();

// This is the actual linter extension.
// Its source function will query `fileLintCache` for diagnostics.
// When diagnostics are updated in the cache (via `triggerFileLinting` which calls `setDiagnostics`),
// CodeMirror automatically re-runs this linter source.
const eslintSource = (view: EditorView): Diagnostic[] => {
  const filePath = editorActiveFilePath.get();
  // Return diagnostics for the active file from the cache.
  // If no file path, or no diagnostics in cache, return empty array.
  return filePath ? fileLintCache.get(filePath) || [] : [];
};

// This is the extension that will be passed to the compartment.
// It uses `eslintSource` as its diagnostic provider.
export const initialESLintLinterExtension = linter(eslintSource);

// This function will now make a real HTTP/WebSocket request using apiFetch
async function lintCodeWithESLintServer(
  code: string,
  filePath: string,
  cwd: string,
  signal: AbortSignal,
): Promise<Diagnostic[]> {
  try {
    const backendDiagnostics: Diagnostic[] = await eslintService.lintCode(code, filePath, cwd);

    const processedDiagnostics: Diagnostic[] = backendDiagnostics.map((diag) => {
      if (diag.actions && diag.actions.length > 0) {
        return {
          ...diag,
          actions: diag.actions.map((action) => ({
            name: action.name,
            apply: (view: EditorView, from: number, to: number) => {
              try {
                // Ensure action.apply is a string that can be parsed to a fix instruction.
                // This is a simplified example. In a real app, you might have a dedicated
                // fix application logic based on a structured fix object from the backend.
                const fixPayload = JSON.parse(action.apply); // Assuming action.apply is JSON string like {from, to, insert}
                view.dispatch({
                  changes: { from: fixPayload.from, to: fixPayload.to, insert: fixPayload.insert },
                  userEvent: 'lint.fix',
                });
              } catch (e) {
                console.error('Failed to apply lint fix:', e);
              }
            },
          })),
        };
      }
      return diag;
    });

    console.log(`[ESLint Backend] Received ${processedDiagnostics.length} diagnostics.`);
    return processedDiagnostics;
  } catch (error: any) {
    if (signal.aborted) {
      console.log('ESLint linting request aborted.');
      return []; // Return empty array on abort
    }
    if (error instanceof ApiError) {
      console.error(`ESLint API error: ${error.status} - ${error.message}`, error.details);
      return [
        {
          from: 0,
          to: code.length,
          severity: 'error',
          message: `Linting failed: ${error.message}`,
          source: 'backend-eslint',
        },
      ];
    } else {
      console.error('Error calling ESLint backend:', error);
      return [
        {
          from: 0,
          to: code.length,
          severity: 'error',
          message: `Linting service unavailable or failed: ${error.message || 'Unknown error'}`,
          source: 'backend-eslint',
        },
      ];
    }
  }
}

// Remove triggerESLintLinting as it's not the intended pattern for setDiagnostics
// Also remove the associated state (lintingTimeout, lastLintedDoc, currentAbortController)
// because `fileLintDebouncer` will manage the debounce and its cancellation implicitly.

/**
 * Triggers ESLint linting for the given code content of a single file.
 * Updates the `lintDiagnostics` Nanostore and the CodeMirror linter diagnostics.
 * @param view The CodeMirror EditorView instance.
 * @param code The current code content.
 * @param filePath The virtual or actual file path of the code.
 */
export const triggerFileLinting = (view: EditorView, code: string, filePath?: string) => {
  const cwd = editorCurrentDirectory.get(); // Get the current working directory from the store

  // Debounce the actual linting request
  fileLintDebouncer.debounce(async () => {
    if (!filePath) {
      fileLintCache.set('', []); // Clear lint for no active file
      lintDiagnostics.set({}); // Clear nanostore diagnostics
      view.dispatch(setDiagnostics(view.state, [])); // Clear CodeMirror diagnostics
      return;
    }

    try {
      // Create a new AbortController for each lint request to cancel previous ones
      const abortController = new AbortController();
      // Store the latest controller if needed for external cancellation, though debouncer handles it for us here.
      // E.g., `currentAbortController.current = abortController;`
      // For this debounce setup, the Debouncer class ensures only the last call proceeds.

      const diagnostics = await lintCodeWithESLintServer(
        code,
        filePath,
        VITE_BASE_DIR,
        abortController.signal,
      );

      // It's possible `diagnostics` is an empty array due to abort, check `abortController.signal.aborted`
      if (!abortController.signal.aborted) {
        // Only update if the request wasn't superseded
        fileLintCache.set(filePath, diagnostics); // Cache for CodeMirror linter source function
        lintDiagnostics.set({ [filePath]: diagnostics }); // Update Nanostore

        // This is the crucial part: Dispatch a `setDiagnostics` effect to update CodeMirror's UI.
        // `setDiagnostics` takes the `EditorState` and an array of `Diagnostic` objects.
        view.dispatch(setDiagnostics(view.state, diagnostics));
      }
    } catch (error: any) {
      console.error('ESLint file linting error:', error);
      const errorDiagnostic: Diagnostic = {
        from: 0,
        to: code.length,
        message: `Linting error: ${error.message || String(error)}`,
        severity: 'error',
        source: 'eslint-service',
      };
      fileLintCache.set(filePath, [errorDiagnostic]);
      lintDiagnostics.set({ [filePath]: [errorDiagnostic] });
      // Also update CodeMirror's display for the error
      view.dispatch(setDiagnostics(view.state, [errorDiagnostic]));
    }
  });
};

/**
 * Triggers ESLint linting for all files within the specified directory.
 * Updates the `directoryLintDiagnostics` Nanostore.
 * This is intended for displaying directory-wide linting status, not directly for CodeMirror's linter gutter.
 * @param directoryPath The path to the directory to lint.
 */
export const triggerDirectoryLinting = (directoryPath: string) => {
  const cwd = getParentPath(directoryPath); // CWD for directory linting is its parent
  directoryLintDebouncer.debounce(async () => {
    if (!directoryPath) {
      directoryLintDiagnostics.set({});
      return;
    }
    try {
      const diagnostics = await eslintService.lintDirectory(directoryPath, cwd);
      directoryLintDiagnostics.set(diagnostics); // Store the full map of directory diagnostics
    } catch (error) {
      console.error('ESLint directory linting error:', error);
      directoryLintDiagnostics.set({}); // Clear diagnostics on error
    }
  });
};
