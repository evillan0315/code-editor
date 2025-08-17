// ./src/utils/eslintLinter.ts
import { Diagnostic, setDiagnostics } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { apiFetch, ApiError } from "@/services/apiFetch"; // Import apiFetch and ApiError
import { API_ENDPOINTS, VITE_BASE_DIR } from "@/constants";             // Import API_ENDPOINTS

// Remove the LINT_API_URL constant as apiFetch will handle the URL construction.
// const LINT_API_URL = 'http://localhost:3000/eslint/lint';

// This function will now make a real HTTP/WebSocket request using apiFetch
async function lintCodeWithESLintServer(
  code: string,
  filePath: string,
  cwd: string,
  signal: AbortSignal,
): Promise<Diagnostic[]> {
  try {
    // Use apiFetch instead of raw fetch
    const backendDiagnostics: Diagnostic[] = await apiFetch(
      API_ENDPOINTS._ESLINT.LINT, // Use the constant for the endpoint
      {
        method: 'POST',
        headers: {
          // apiFetch automatically sets Content-Type for JSON body unless formData
          // So, you don't need 'Content-Type': 'application/json' here explicitly.
        },
        body: { code, filePath, cwd }, // Pass code and filePath in the body object
        signal, // Pass the abort signal. apiFetch passes it to fetch, or lintCodeWithESLintServer uses it for WS.
      }
    );
    console.log(filePath, 'backendDiagnostics filePath');
    // Diagnostics from backend should match CodeMirror's Diagnostic format
    // Process actions if needed (e.g., if you need to convert apply string to a function)
    const processedDiagnostics: Diagnostic[] = backendDiagnostics.map(diag => {
        if (diag.actions && diag.actions.length > 0) {
            return {
                ...diag,
                actions: diag.actions.map(action => ({
                    name: action.name,
                    // DANGER: Eval is generally unsafe. For a production system,
                    // you would have a predefined set of actions and identifiers.
                    // The client would then apply the specific fix based on the identifier.
                    // This is a simplified demo for the 'apply' function.
                    apply: (view: EditorView, from: number, to: number) => {
                        try {
                            const fixPayload = JSON.parse(action.apply); // Parse the fix instruction
                            view.dispatch({
                                changes: { from: fixPayload.from, to: fixPayload.to, insert: fixPayload.insert },
                                userEvent: "lint.fix",
                            });
                        } catch (e) {
                            console.error("Failed to apply lint fix:", e);
                        }
                    }
                }))
            };
        }
        return diag;
    });

    console.log(`[ESLint Backend] Received ${processedDiagnostics.length} diagnostics.`);
    console.log(processedDiagnostics);
    return processedDiagnostics;

  } catch (error: any) {
    if (error instanceof ApiError) {
      if (error.name === 'AbortError' || (error.message && error.message.includes('aborted'))) {
        console.log("ESLint linting request aborted.");
        return []; // Return empty array on abort
      }
      console.error(`ESLint API error: ${error.status} - ${error.message}`, error.details);
      return [{
        from: 0,
        to: code.length,
        severity: "error",
        message: `Linting failed: ${error.message}`,
        source: "backend-eslint",
      }];
    } else if (error.name === 'AbortError') {
      console.log("ESLint linting request aborted (direct AbortError).");
      return [];
    } else {
      console.error("Error calling ESLint backend:", error);
      // Return a generic diagnostic for unexpected errors
      return [{
        from: 0,
        to: code.length,
        severity: "error",
        message: `Linting service unavailable or failed: ${error.message || 'Unknown error'}`,
        source: "backend-eslint",
      }];
    }
  }
}

let lintingTimeout: NodeJS.Timeout | null = null;
let lastLintedDoc: string = "";
let lastFilePath: string = "";
let currentAbortController: AbortController | null = null;

export const triggerESLintLinting = (
  view: EditorView,
  code: string,
  filePath: string,
  debounceMs: number = 750,
) => {
  // Only lint if the document or file path has actually changed
  if (code === lastLintedDoc && filePath === lastFilePath) {
    return;
  }

  if (lintingTimeout) {
    clearTimeout(lintingTimeout);
  }

  if (currentAbortController) {
    currentAbortController.abort();
  }

  currentAbortController = new AbortController();
  const { signal } = currentAbortController;

  lintingTimeout = setTimeout(async () => {
    const docToLint = view.state.doc.toString(); // Get the latest doc content at the time of execution
    try {
      const diagnostics = await lintCodeWithESLintServer(docToLint, filePath, VITE_BASE_DIR, signal);

      if (!signal.aborted) { // Crucial check: only update if the request wasn't superseded
        view.dispatch(setDiagnostics(view.state, diagnostics));
        lastLintedDoc = docToLint;
        lastFilePath = filePath;
      }
    } catch (error: any) {
      // This outer catch handles errors that might escape lintCodeWithESLintServer
      // (e.g., if it throws something unexpected or very early).
      if (error.name === 'AbortError') {
        console.log("ESLint linting request aborted in trigger.");
      } else {
        console.error("Error during ESLint linting in triggerESLintLinting:", error);
        view.dispatch(setDiagnostics(view.state, [{
            from: 0,
            to: docToLint.length,
            severity: "error",
            message: `Linting system error: ${error.message || 'Unknown error'}`,
            source: "frontend-eslint-trigger",
        }]));
      }
    } finally {
      currentAbortController = null;
      lintingTimeout = null;
    }
  }, debounceMs);
};
