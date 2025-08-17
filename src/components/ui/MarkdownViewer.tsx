// src/components/MarkdownViewer.tsx
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Plugin for GitHub Flavored Markdown (tables, task lists, strikethrough)
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Choose a style for your code blocks. You can find more in 'react-syntax-highlighter/dist/esm/styles/prism'
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

import LoadingDots from "./ui/LoadingDots"; // Assuming you placed LoadingDots here

/**
 * Props for the MarkdownViewer component.
 */
interface MarkdownViewerProps {
  /** The Markdown content string to be rendered. */
  content: string;
  /**
   * Optional. Indicates if the content is still being processed or streamed.
   * If true, a loading indicator will be displayed *below* the content,
   * especially useful when content is empty and AI is generating.
   * Note: This component does NOT change this prop; it only displays based on it.
   */
  isProcessing?: boolean;
}

/**
 * A React component that renders Markdown content with syntax highlighting for code blocks.
 * It also includes an optional loading indicator for streaming responses.
 *
 * @param {MarkdownViewerProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered Markdown content.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = memo(
  ({ content, isProcessing = false }) => {
    return (
      // 'prose' classes from @tailwindcss/typography plugin provide sensible default styles
      // 'prose-sm' for smaller text, 'dark:prose-invert' for dark mode compatibility
      // 'max-w-none w-full' ensures it takes full available width without max-width constraints
      <div className="prose prose-sm dark:prose-invert max-w-none w-full">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown features
          components={{
            // Custom renderer for <code> tags (which includes code blocks)
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              // If it's a block of code (not inline) and a language is specified
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  style={dracula} // Apply the chosen syntax highlighting style
                  language={match[1]} // Set the language for highlighting
                  PreTag="div" // Render the parent <pre> tag as a <div> to avoid conflicts
                  // Remove trailing newline character from code to prevent extra blank lines
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                // For inline code, just render a standard <code> tag
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },
            // Custom renderer for images to ensure they are responsive
            img: ({ node, ...props }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="max-w-full h-auto rounded-md"
                {...props}
                alt={props.alt || ""}
              />
            ),
            // Custom renderer for links to add styling and ensure external links open in new tab
            a: ({ node, ...props }) => (
              <a
                className="text-sky-500 hover:underline"
                target="_blank" // Open links in a new tab
                rel="noopener noreferrer" // Security best practice for target="_blank"
                {...props}
              >
                {props.children}
              </a>
            ),
            // You can customize other elements like lists, blockquotes, etc., if the default 'prose' styles aren't enough
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside ml-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside ml-4" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>

        {/* Show loading dots if content is empty (or very short) and isProcessing is true.
          This is useful for indicating that a streaming response has started but no content yet. */}
        {isProcessing && content.length === 0 && (
          <div className="mt-2">
            <LoadingDots />
          </div>
        )}
      </div>
    );
  },
);

MarkdownViewer.displayName = "MarkdownViewer";

export default MarkdownViewer;
