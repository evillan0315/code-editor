import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";

export function getTheme(theme: "light" | "dark") {
  return theme === "dark" ? oneDark : EditorView.theme({}, { dark: false });
}

const tailwindDarkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#030712",
      height: "100%",
      color: "#f5f5f5",
    },
    ".cm-content": {
      caretColor: "#f4f4f5",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#f4f4f5",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#3f3f46",
    },
    ".cm-gutters": {
      backgroundColor: "#030712",
      color: "#a3a3a3",
      border: "none",
    },
  },
  { dark: true },
);

const tailwindLightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      height: "100%",
      color: "#1f2937",
    },
    ".cm-content": {
      caretColor: "#111827",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#111827",
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#e5e7eb",
    },
    ".cm-gutters": {
      backgroundColor: "#f9fafb",
      color: "#9ca3af",
      border: "none",
    },
  },
  { dark: false },
);

const darkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#22d3ee" },
  { tag: [t.name, t.deleted, t.character, t.propertyName], color: "#f87171" },
  { tag: [t.variableName], color: "#e4e4e7" },
  { tag: [t.string, t.meta], color: "#86efac" },
  { tag: [t.function(t.variableName)], color: "#c4b5fd" },
  { tag: [t.number], color: "#facc15" },
  { tag: [t.comment], color: "#71717a", fontStyle: "italic" },
]);

const lightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#0ea5e9" },
  { tag: [t.name, t.deleted, t.character, t.propertyName], color: "#b91c1c" },
  { tag: [t.variableName], color: "#374151" },
  { tag: [t.string, t.meta], color: "#16a34a" },
  { tag: [t.function(t.variableName)], color: "#7c3aed" },
  { tag: [t.number], color: "#ca8a04" },
  { tag: [t.comment], color: "#6b7280", fontStyle: "italic" },
]);

export function getThemeExtension(theme: "light" | "dark") {
  return [
    theme === "dark" ? tailwindDarkTheme : tailwindLightTheme,
    syntaxHighlighting(
      theme === "dark" ? darkHighlightStyle : lightHighlightStyle,
    ),
  ];
}
