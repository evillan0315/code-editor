// src/components/MarkdownViewer.tsx
import React, { useEffect, useRef, useCallback, useState, memo } from "react";
import { marked } from "marked";
import Prism from "prismjs";

// Import necessary Prism.js components.
// Ensure these are installed: npm install prismjs
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-http";

import { fileService } from "@/services/fileService";
import { useToast } from "@/hooks/useToast";
import { CHAT_CONFIGURATION, LANGUAGE_DISPLAY_MAP } from "@/constants";
import LoadingDots from "./LoadingDots";

import "@/styles/markdown.css";

interface MarkdownViewerProps {
  content: string;
  /**
   * If true, attempts to display content with a typewriter effect for text.
   * Note: The typewriter effect is automatically disabled if the content contains code blocks
   * or other complex Markdown elements to prevent performance issues.
   * Defaults to false.
   */
  typewriter?: boolean;
  /**
   * Indicates if the content is still being processed or streamed externally.
   * Used for initial loading indicator when content is empty.
   */
  isProcessing?: boolean;
}

// Custom renderer for marked.
// It focuses on generating the <pre><code> structure, allowing Prism to handle highlighting.
// We add a class `markdown-code-pre-highlight` for initial state.
const customMarkedRenderer = new marked.Renderer();
customMarkedRenderer.code = (code, language) => {
  //console.log(code, 'code');
  const lang = code.lang || "text";
  // Marked automatically escapes the code content, so we just wrap it.
  // We add 'markdown-code-pre-highlight' class to mark it for post-processing.
  return `<pre class="language-${lang} markdown-code-pre-highlight"><code class="language-${lang}">${code.text}</code></pre>`;
};

// Set marked options once globally.
marked.setOptions({
  renderer: customMarkedRenderer,
  gfm: true, // Enable GitHub Flavored Markdown
});

const MarkdownViewer: React.FC<MarkdownViewerProps> = memo(
  ({ content, typewriter = false, isProcessing = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const [isTypingAnimationActive, setIsTypingAnimationActive] =
      useState(false);

    // Determines if the typewriter effect should actually run for the given content.
    // Disable if content has code blocks or other complex elements for performance.
    const shouldApplyTypewriter = useCallback(() => {
      if (!typewriter) return false;
      // Heuristic: Check for common code block markers.
      // A more robust check might involve parsing the Markdown AST.
      const hasCodeBlock = content.includes("```"); // Markdown code block indicator

      // If it has code blocks, it's safer to just render directly.
      return !hasCodeBlock;
    }, [content, typewriter]);

    // useCallback to memoize the code block enhancement function.
    const enhanceCodeBlocks = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      // Select only <pre> elements that haven't been enhanced yet.
      const codeBlocksToEnhance = container.querySelectorAll(
        "pre.markdown-code-pre-highlight",
      );

      codeBlocksToEnhance.forEach((block) => {
        // Capture parent and next sibling BEFORE modifying the DOM
        const originalParent = block.parentNode;
        const nextSibling = block.nextSibling; // Element that comes after `block`

        if (!originalParent) {
          // This case should ideally not happen if `querySelectorAll` returned it,
          // but as a safeguard.
          console.warn(
            "Skipping code block enhancement: Parent node is null.",
            block,
          );
          return;
        }

        // Create wrapper and buttons
        const wrapper = document.createElement("div");
        wrapper.className = `relative group my-4 markdown-code-wrapper ${block.className}`; // Inherit language class from pre

        const codeElement = block.querySelector("code");
        if (!codeElement) return; // Should not happen

        // Extract language and display name
        const langClass = [...codeElement.classList].find((cls) =>
          cls.startsWith("language-"),
        );
        const lang = langClass ? langClass.replace("language-", "") : "";
        const displayLang =
          LANGUAGE_DISPLAY_MAP[lang] ||
          (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "");

        const langTag = document.createElement("div");
        langTag.textContent = displayLang;
        langTag.className =
          "language-btn absolute top-0 left-0 bg-sky-600 text-sm font-bold px-2 py-1 rounded-br-md rounded-tl-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10";

        const copyButton = document.createElement("button");
        copyButton.innerHTML = "📋";
        copyButton.title = "Copy code";
        copyButton.className =
          "copy-btn absolute top-0 right-8 p-1 text-sm rounded-bl-md bg-sky-500 hover:bg-sky-600 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 z-10";
        copyButton.onclick = () => {
          const textToCopy = codeElement.innerText;
          if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            copyButton.innerHTML = "✅";
            showToast("Code copied to clipboard!", "success");
            setTimeout(() => (copyButton.innerHTML = "📋"), 1000);
          }
        };

        const saveButton = document.createElement("button");
        saveButton.innerHTML = "💾";
        saveButton.title = "Save to Server";
        saveButton.className =
          "save-btn absolute top-0 right-0 p-1 text-sm rounded-bl-md rounded-tr-md bg-sky-500 hover:bg-sky-600 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 z-10";
        saveButton.onclick = async () => {
          const textToSave = codeElement.innerText;
          if (!textToSave) return;

          const firstLine = textToSave.split("\n")[0];
          const filePathMatch = firstLine.match(
            /^\/\/\s*(\/?[^\s"]+\.[a-zA-Z0-9]+)/,
          );
          const fileExt = lang ? `.${lang}` : ".txt";
          const defaultFilePath = `/tmp/code-snippet-${Date.now()}${fileExt}`;
          const filePath = filePathMatch ? filePathMatch[1] : defaultFilePath;

          try {
            if (typeof fileService.createFile === "function") {
              await fileService.createFile(filePath, textToSave);
              showToast(`File saved to ${filePath}`, "success");
              saveButton.innerHTML = "✅";
              setTimeout(() => (saveButton.innerHTML = "💾"), 1000);
            } else {
              showToast("File save service is not available.", "error");
              console.error(
                "fileService.createFile is not a function or not defined.",
              );
            }
          } catch (err: any) {
            const errMessage =
              err?.response?.data?.message || err?.message || "Unknown error";
            console.error("File save failed:", err);
            if (errMessage.includes("already exists")) {
              showToast(`File "${filePath}" already exists.`, "warning");
            } else {
              showToast(`Failed to save file: ${errMessage}`, "error");
              saveButton.innerHTML = "❌";
              setTimeout(() => (saveButton.innerHTML = "💾"), 1500);
            }
          }
        };

        // --- Core Fix for wrapping DOM elements ---
        // 1. Remove the original block from the DOM.
        originalParent.removeChild(block);

        // 2. Append all desired elements (lang tag, buttons, and the original block) to the new wrapper.
        wrapper.appendChild(langTag);
        wrapper.appendChild(copyButton);
        wrapper.appendChild(saveButton);
        wrapper.appendChild(block); // This is now a child of 'wrapper'

        // 3. Insert the new wrapper back into the original parent,
        // using the captured nextSibling to maintain order.
        originalParent.insertBefore(wrapper, nextSibling);
        // --- End Core Fix ---

        // Mark the block as enhanced by removing the pre-highlight class
        // (This should be done *after* it's re-attached in its new structure, or on the wrapper)
        // Since `block` is now inside `wrapper`, we mark the `block` itself.
        block.classList.remove("markdown-code-pre-highlight");
        block.classList.add("markdown-code-enhanced");
      });
    }, [showToast]);

    // Main effect for rendering and typewriter animation
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let interval: NodeJS.Timeout | undefined;
      const useTypewriterEffect = shouldApplyTypewriter();

      // Parse full markdown to HTML once.
      const fullHtmlContent = marked.parse(content);

      const finalizeRender = () => {
        // Render the full HTML content.
        container.innerHTML = fullHtmlContent;
        // Apply Prism highlighting to all code blocks.
        Prism.highlightAllUnder(container);
        // Add custom buttons and language tags.
        enhanceCodeBlocks();
        setIsTypingAnimationActive(false); // Signal animation complete
      };

      const cleanup = () => {
        if (interval) {
          clearInterval(interval);
        }
        if (container) {
          container.innerHTML = ""; // Clear content on unmount or new content
        }
        setIsTypingAnimationActive(false); // Ensure state is reset
      };

      // Perform cleanup immediately on effect re-run or component unmount.
      cleanup();

      if (useTypewriterEffect && content.length > 0) {
        setIsTypingAnimationActive(true); // Signal typewriter is starting

        let index = 0;
        const TYPE_SPEED_MS = CHAT_CONFIGURATION.TYPE_SPEED_MS;

        interval = setInterval(() => {
          if (index < fullHtmlContent.length) {
            // During typewriter, simply slice the pre-generated HTML string.
            // This is fast as it avoids re-parsing/re-highlighting per step.
            container.innerHTML = fullHtmlContent.slice(0, index);
            index += 2; // Type faster by adding more chars per step
          } else {
            // Animation finished. Finalize render.
            clearInterval(interval);
            finalizeRender();
          }
        }, TYPE_SPEED_MS);
      } else {
        // If no typewriter (due to prop or content type), render immediately and fully.
        finalizeRender();
      }

      return cleanup; // Return the cleanup function
    }, [content, typewriter, shouldApplyTypewriter, enhanceCodeBlocks]); // Dependencies

    return (
      <div className="markdown-wrapper">
        <div
          className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none font-sans p-2"
          ref={containerRef}
        />
        {/* Optional: Show loading dots if content is empty but external processing is active */}
        {isProcessing && content.length === 0 && (
          <div className="mt-2 ml-4">
            <LoadingDots />
          </div>
        )}
      </div>
    );
  },
);

MarkdownViewer.displayName = "MarkdownViewer";
export default MarkdownViewer;
