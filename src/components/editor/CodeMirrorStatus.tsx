import React, { useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  codeMirrorStatus,
  isFileUnsaved,
  editorActiveFilePath,
  getFileContent,
  lintDiagnostics,
  editorCurrentDirectory,
  directoryLintDiagnostics,
} from '@/stores/editorContent';
import { Diagnostic, Severity } from '@/types/eslint';
import { triggerDirectoryLinting } from '@/utils/eslintLinter';

export const CodeMirrorStatus: React.FC = () => {
  const { language, line, col } = useStore(codeMirrorStatus);
  const $editorActiveFilePath = useStore(editorActiveFilePath);
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);
  const $lintDiagnostics = useStore(lintDiagnostics);
  const $directoryLintDiagnostics = useStore(directoryLintDiagnostics);

  // Trigger directory linting whenever the current directory changes
  useEffect(() => {
    if ($editorCurrentDirectory) {
      triggerDirectoryLinting($editorCurrentDirectory);
    }
  }, [$editorCurrentDirectory]);

  const activeFileDiagnostics = useMemo(() => {
    return $editorActiveFilePath ? $lintDiagnostics[$editorActiveFilePath] || [] : [];
  }, [$editorActiveFilePath, $lintDiagnostics]);

  const directoryDiagnosticsSummary = useMemo(() => {
    const summary = { errors: 0, warnings: 0 };
    for (const filePath in $directoryLintDiagnostics) {
      for (const diag of $directoryLintDiagnostics[filePath]) {
        if (diag.severity === 'error') {
          summary.errors++;
        } else if (diag.severity === 'warning') {
          summary.warnings++;
        }
      }
    }
    return summary;
  }, [$directoryLintDiagnostics]);

  const fileLintSummary = useMemo(() => {
    const summary = { errors: 0, warnings: 0 };
    for (const diag of activeFileDiagnostics) {
      if (diag.severity === 'error') {
        summary.errors++;
      } else if (diag.severity === 'warning') {
        summary.warnings++;
      }
    }
    return summary;
  }, [activeFileDiagnostics]);

  return (
    <>
      {getFileContent($editorActiveFilePath) ? (
        <div className='flex w-full items-center justify-center gap-4 '>
          <div className='flex items-center gap-4 text-center'>
            <span className='uppercase'>{language}</span>
            <span>
              Ln {line}, Col {col}
            </span>
          </div>
          {isFileUnsaved($editorActiveFilePath) && (
            <span className='text-yellow-400'>Unsaved Changes</span>
          )}
          {fileLintSummary.errors > 0 && (
            <span className='text-red-500 font-bold'>Errors: {fileLintSummary.errors}</span>
          )}
          {fileLintSummary.warnings > 0 && (
            <span className='text-yellow-500 font-bold'>Warnings: {fileLintSummary.warnings}</span>
          )}
          <div className='border-l border-gray-600 pl-4 ml-4'>
            Directory Lint:
            {directoryDiagnosticsSummary.errors > 0 && (
              <span className='text-red-500 font-bold ml-1'>
                Errors: {directoryDiagnosticsSummary.errors}
              </span>
            )}
            {directoryDiagnosticsSummary.warnings > 0 && (
              <span className='text-yellow-500 font-bold ml-1'>
                Warnings: {directoryDiagnosticsSummary.warnings}
              </span>
            )}
            {directoryDiagnosticsSummary.errors === 0 && directoryDiagnosticsSummary.warnings === 0 && (
              <span className='text-green-500 ml-1'>Clean</span>
            )}
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
};
