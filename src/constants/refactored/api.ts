export const API_ENDPOINTS = {
  _FILE: {
    GET_FILES: '/api/file/list',
    READ_FILE: '/api/file/read',
    WRITE_FILE: '/api/file/write',
    DELETE_FILE: '/api/file/delete',
    UPLOAD_FILE: '/api/file/upload',
    RENAME_FILE: '/api/file/rename',
  },
  _UTILS: {
    FORMAT_CODE: '/api/utils/format-code',
    STRIP_CODE_BLOCK: '/api/utils/strip-code-block',
    REMOVE_CODE_COMMENT: '/api/utils/remove-comments',
    CONVERT_MARKDOWN_TO_HTML: '/api/utils/to-html',
  },
  _GOOGLE_GEMINI: {
    GENERATE_LLM: '/api/llm/generate-llm',
    OPTIMIZE_CODE: '/api/google-gemini/optimize-code',
    GENERATE_TEXT: '/api/gemini/file/generate-text',
    GENERATE_FILE: '/api/gemini/file/generate-file',
  },
  _ESLINT: {
    LINT: '/api/eslint/lint',
    LINT_CODE: '/api/eslint/lint',
    LINT_DIRECTORY: '/api/eslint/lint-directory',
    LINT_FILES: '/api/eslint/lint-files',
  },
} as const;
