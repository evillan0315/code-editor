// src/types/markdown.ts

export enum OutputFormat {
  HTML = "html", // Converts Markdown to HTML
  DOCX = "docx", // Converts Markdown to DOCX
  PLAIN_TEXT = "plain_text", // Converts Markdown to Plain Text
  JSON_AST = "json_ast", // Converts Markdown to JSON AST
  DOCX_FROM_HTML = "docx_from_html", // Converts HTML to DOCX (input treated as HTML)
}

// The MarkdownConvertRequest type might not be strictly necessary anymore
// as request bodies will be constructed dynamically based on the format and endpoint.
// But keeping it as a placeholder if you have other generic APIs.
export type MarkdownConvertRequest = {
  markdownContent: string;
  format: OutputFormat;
  // Potentially other fields like filename etc.
};
