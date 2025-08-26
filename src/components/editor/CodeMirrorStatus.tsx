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
import { truncateFilePath, getDirname, getBasename } from '@/utils/pathUtils';
import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { triggerDirectoryLinting } from '@/utils/eslintLinter';

export const CodeMirrorStatus: React.FC = () => {
  const { language, line, col } = useStore(codeMirrorStatus);
  const $editorActiveFilePath = useStore(editorActiveFilePath);
  const $editorCurrentDirectory = useStore(editorCurrentDirectory);
  const $lintDiagnostics = useStore(lintDiagnostics);
  const $directoryLintDiagnostics = useStore(directoryLintDiagnostics);
  const displayPath = truncateFilePath($editorActiveFilePath);
  const { handleSelectedPath } = useEditorExplorerActions();
  // Trigger directory linting whenever the current directory changes
  useEffect(() => {
    if ($editorCurrentDirectory) {
      triggerDirectoryLinting($editorCurrentDirectory);
    }
  }, [$editorCurrentDirectory]);

  const activeFileDiagnostics = useMemo(() => {
    return $editorActiveFilePath
      ? $lintDiagnostics[$editorActiveFilePath] || []
      : [];
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
 
        <div className="flex w-full items-center justify-between gap-4 py-1 px-4 border-t bg-dark-secondary text-base text-xs">
          <Breadcrumbs filePath={$editorActiveFilePath} onPathSelect={handleSelectedPath}/>
          

          {/* Main info section, might need some responsive handling if it gets too long */}
          <div className="flex items-center gap-4 text-center">
            <div className="relative flex items-center gap-3">
            {fileLintSummary.errors > 0 && (
              <span className="text-red-500 font-bold whitespace-nowrap">
                Errors: {fileLintSummary.errors}
              </span> // Use text-error and prevent wrapping
            )}
            {fileLintSummary.warnings > 0 && (
              <span className="text-yellow-500 font-bold whitespace-nowrap">
                Warnings: {fileLintSummary.warnings}
              </span> // Use text-warning and prevent wrapping
            )}
            <div className="border-l pl-4 ml-4 flex items-center whitespace-nowrap">
              {directoryDiagnosticsSummary.errors > 0 && (
                <span className="text-red-500 font-bold ml-1">
                  Errors: {directoryDiagnosticsSummary.errors}
                </span>
              )}
              {directoryDiagnosticsSummary.warnings > 0 && (
                <span className="text-yellow-500 font-bold ml-1">
                  Warnings: {directoryDiagnosticsSummary.warnings}
                </span>
              )}

            </div>
          </div>
            <span className="uppercase whitespace-nowrap">{language}</span>
            <span className="whitespace-nowrap">
              Ln {line}, Col {col}
            </span>
            {isFileUnsaved($editorActiveFilePath) && (
              <span className="text-yellow-500 whitespace-nowrap">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>
   
      ) : (
        ''
      )}
    </>
  );
};
