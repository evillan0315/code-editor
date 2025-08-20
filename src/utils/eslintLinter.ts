// src/utils/eslintLinter.ts
import { ApiError } from '@/services/apiFetch';
import { VITE_BASE_DIR } from '@/constants/refactored/app';

import {
  linter,
  Diagnostic as CodeMirrorDiagnostic,
  setDiagnostics,
  Action as CodeMirrorAction,
} from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';

import type {
  Diagnostic as ESLintBackendDiagnostic,
  DiagnosticAction as ESLintBackendAction,
  Severity as ESLintBackendSeverity,
  DirectoryDiagnostics as ESLintBackendDirectoryDiagnostics,
} from '@/types/eslint';

import {
  editorActiveFilePath,
  editorCurrentDirectory,
  lintDiagnostics,
  directoryLintDiagnostics,
} from '@/stores/editorContent';
import { eslintService } from '@/services/eslintService';
import { Debouncer } from '@/utils/debouncer';
import { getParentPath } from '@/utils/fileTree';

const mapSeverity = (severity: ESLintBackendSeverity): CodeMirrorDiagnostic['severity'] => {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'hint':
      return 'info';
    default:
      return 'info';
  }
};

function transformBackendDiagnosticToCodeMirror(
  backendDiag: ESLintBackendDiagnostic,
): CodeMirrorDiagnostic {
  const codeMirrorDiag: CodeMirrorDiagnostic = {
    from: backendDiag.from,
    to: backendDiag.to,
    message: backendDiag.message,
    severity: mapSeverity(backendDiag.severity),
    source: backendDiag.source || 'eslint',
  };

  if (backendDiag.actions && backendDiag.actions.length > 0) {
    codeMirrorDiag.actions = backendDiag.actions.map(
      (action: ESLintBackendAction): CodeMirrorAction => ({
        name: action.name,

        apply: (view: EditorView, from: number, to: number) => {
          try {
            const fixPayload = JSON.parse(action.apply);
            view.dispatch({
              changes: {
                from: fixPayload.from,
                to: fixPayload.to,
                insert: fixPayload.insert,
              },
              userEvent: 'lint.fix',
            });
          } catch (e) {
            console.error('Failed to apply lint fix from backend payload:', e, action.apply);
          }
        },
      }),
    );
  }
  return codeMirrorDiag;
}

const fileLintCache = new Map<string, CodeMirrorDiagnostic[]>();

const fileLintDebouncer = new Debouncer(500);
const directoryLintDebouncer = new Debouncer(1000);

export const eslintLinterCompartment = new Compartment();

const eslintSource = (view: EditorView): CodeMirrorDiagnostic[] => {
  const filePath = editorActiveFilePath.get();
  return filePath ? fileLintCache.get(filePath) || [] : [];
};

export const initialESLintLinterExtension = linter(eslintSource);

async function lintCodeWithESLintServer(
  code: string,
  filePath: string,
  cwd: string,
  signal: AbortSignal,
): Promise<CodeMirrorDiagnostic[]> {
  try {
    const backendDiagnostics: ESLintBackendDiagnostic[] = await eslintService.lintCode(
      code,
      filePath,
      cwd,
    );

    const processedDiagnostics: CodeMirrorDiagnostic[] = backendDiagnostics.map(
      transformBackendDiagnosticToCodeMirror,
    );

    console.log(`[ESLint Backend] Received ${processedDiagnostics.length} diagnostics.`);
    return processedDiagnostics;
  } catch (error: any) {
    if (signal.aborted) {
      console.log('ESLint linting request aborted.');
      return [];
    }
    const errorMessage =
      error instanceof ApiError
        ? `Linting failed: ${error.message}`
        : `Linting service unavailable or failed: ${error.message || 'Unknown error'}`;

    console.error(
      error instanceof ApiError
        ? `ESLint API error: ${error.status} - ${error.message}`
        : 'Error calling ESLint backend:',
      error.details || error,
    );

    return [
      {
        from: 0,
        to: code.length,
        severity: 'error',
        message: errorMessage,
        source: 'backend-eslint',
      },
    ];
  }
}

export const triggerFileLinting = (view: EditorView, code: string, filePath?: string) => {
  const cwd = editorCurrentDirectory.get();

  fileLintDebouncer.debounce(async () => {
    if (!filePath) {
      fileLintCache.set('', []);
      lintDiagnostics.set({});
      view.dispatch(setDiagnostics(view.state, []));
      return;
    }

    try {
      const abortController = new AbortController();

      const diagnostics = await lintCodeWithESLintServer(
        code,
        filePath,
        VITE_BASE_DIR,
        abortController.signal,
      );

      if (!abortController.signal.aborted) {
        fileLintCache.set(filePath, diagnostics);

        lintDiagnostics.set({ [filePath]: diagnostics });

        view.dispatch(setDiagnostics(view.state, diagnostics));
      }
    } catch (error: any) {
      console.error('ESLint file linting error:', error);
      const errorDiagnostic: CodeMirrorDiagnostic = {
        from: 0,
        to: code.length,
        message: `Linting error: ${error.message || String(error)}`,
        severity: 'error',
        source: 'eslint-service',
      };
      fileLintCache.set(filePath, [errorDiagnostic]);
      lintDiagnostics.set({ [filePath]: [errorDiagnostic] });

      view.dispatch(setDiagnostics(view.state, [errorDiagnostic]));
    }
  });
};

export const triggerDirectoryLinting = (directoryPath: string) => {
  const cwd = getParentPath(directoryPath);
  directoryLintDebouncer.debounce(async () => {
    if (!directoryPath) {
      directoryLintDiagnostics.set({});
      return;
    }
    try {
      const backendDiagnostics: ESLintBackendDirectoryDiagnostics =
        await eslintService.lintDirectory(directoryPath, VITE_BASE_DIR);

      const transformedDiagnostics: Record<string, CodeMirrorDiagnostic[]> = {};

      for (const path in backendDiagnostics) {
        if (Object.prototype.hasOwnProperty.call(backendDiagnostics, path)) {
          transformedDiagnostics[path] = backendDiagnostics[path].map(
            transformBackendDiagnosticToCodeMirror,
          );
        }
      }
      directoryLintDiagnostics.set(transformedDiagnostics);
    } catch (error) {
      console.error('ESLint directory linting error:', error);
      directoryLintDiagnostics.set({});
    }
  });
};
