// utils/markdown.ts
export function safeMarkdown(input: unknown, lang: string = "ts"): string {
  if (typeof input === "string") return input;
  try {
    return `\`\`\`${lang}\n${JSON.stringify(input, null, 2)}\n\`\`\``;
  } catch (e) {
    return `\`\`\`\n[Unrenderable Content]\n\`\`\``;
  }
}
