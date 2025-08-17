import { apiFetch } from '@/services/apiFetch';
import { API_ENDPOINTS, EVENT_PREFIX } from '@/constants';
import { Diagnostic } from '@/types/eslint';

interface LintFile {
  code: string;
  filePath: string;
}

export const eslintService = {
  /**
   * Lints a single code string.
   * @param code The code content.
   * @param filePath Optional virtual file path for context.
   * @param cwd Optional current working directory.
   * @returns A promise resolving to an array of Diagnostic objects.
   */
  async lintCode(code: string, filePath?: string, cwd?: string): Promise<Diagnostic[]> {
    return apiFetch<Diagnostic[]>(API_ENDPOINTS._ESLINT.LINT_CODE, {
      method: 'POST',
      body: { code, filePath, cwd },
      wsEvent: EVENT_PREFIX.LINT_CODE,
    });
  },

  /**
   * Lints multiple code strings, each representing a virtual file.
   * @param files An array of { code, filePath } objects.
   * @param cwd Optional current working directory.
   * @returns A promise resolving to a record mapping file paths to their diagnostics.
   */
  async lintFiles(files: LintFile[], cwd?: string): Promise<Record<string, Diagnostic[]>> {
    return apiFetch<Record<string, Diagnostic[]>>(API_ENDPOINTS._ESLINT.LINT_FILES, {
      method: 'POST',
      body: { files, cwd },
      wsEvent: EVENT_PREFIX.LINT_FILES,
    });
  },

  /**
   * Lints all files within a specified directory.
   * @param directoryPath The path to the directory to lint.
   * @param cwd Optional current working directory.
   * @returns A promise resolving to a record mapping file paths to their diagnostics.
   */
  async lintDirectory(directoryPath: string, cwd?: string): Promise<Record<string, Diagnostic[]>> {
    return apiFetch<Record<string, Diagnostic[]>>(API_ENDPOINTS._ESLINT.LINT_DIRECTORY, {
      method: 'POST',
      body: { directoryPath, cwd },
      wsEvent: EVENT_PREFIX.LINT_DIRECTORY,
    });
  },
};
