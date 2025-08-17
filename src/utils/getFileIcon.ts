// src/utils/getFileIcon.ts

export function getFileIcon(
  filename: string,
  isDirectory: boolean,
  isOpen?: boolean,
): string {
  if (isDirectory) {
    return isOpen
      ? "vscode-icons:default-folder-opened"
      : "vscode-icons:default-folder";
  }
  console.log(filename, isDirectory);
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    js: "vscode-icons:file-type-js",
    jsx: "tabler:file-type-jsx",
    ts: "vscode-icons:file-type-typescript",
    tsx: "tabler:file-type-tsx",
    json: "bi:filetype-json",
    html: "vscode-icons:file-type-html",
    css: "vscode-icons:file-type-css",
    md: "lineicons:markdown",
    py: "vscode-icons:file-type-python",
    java: "vscode-icons:file-type-java",
    cpp: "vscode-icons:file-type-cpp",
    cs: "vscode-icons:file-type-csharp",
    png: "bi:filetype-png",
    jpg: "bi:filetype-jpg",
    gif: "bi:filetype-gif",
    env: "vscode-icons:file-type-dotenv",
    sh: "bi:terminal",
    config: "vscode-icons:folder-type-config",
    xml: "vscode-icons:file-type-xml",
    csv: "bi:filetype-csv",
    doc: "vscode-icons:file-type-doc",
    docx: "vscode-icons:file-type-docx",
    gitignore: "simple-icons:gitignoredotio",
  };

  return icons[ext] || "vscode-icons:default-file";
}
