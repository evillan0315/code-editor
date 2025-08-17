export const GET_FILES = "/api/file/list";
export const READ_FILE = "/api/file/read";
export const WRITE_FILE = "/api/file/write";
export const STRIP_CODE_BLOCK = "/api/utils/strip-code-block";
export const OPTIMIZE_CODE = "/api/utils/optimize-code";
export const REMOVE_COMMENTS = "/api/utils/remove-comments";
export const FORMAT_CODE = "/api/utils/format-code";
export const GENERATE_TEXT = "/api/gemini/file/generate-text";
export const GENERATE_FILE = "/api/gemini/file/generate-file";
export const CONVERT_MARKDOWN_TO_HTML = "/api/utils/to-html";
export const API_ENDPOINTS_DIR =
  "/media/eddie/Data/projects/nestJS/nest-modules/full-stack/frontend/src/constants/controllers";
// API Endpoints
export const API_ENDPOINTS = {
  _FILE: {
    GET_FILES,
    READ_FILE,
    WRITE_FILE,
  },
  _UTILS: {
    FORMAT_CODE: FORMAT_CODE,
    STRIP_CODE_BLOCK: STRIP_CODE_BLOCK,
    REMOVE_CODE_COMMENT: REMOVE_COMMENTS,
  },
  _GOOGLE_GEMINI: {
    OPTIMIZE_CODE: "/api/google-gemini/optimize-code",
    GENERATE_TEXT,
    GENERATE_FILE,
  },
  _ESLINT: {
    LINT: "/eslint/lint",
    }
} as const; // `as const` ensures string literal types
