// src/components/MarkdownViewer.tsx
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import LoadingDots from './ui/LoadingDots';

interface MarkdownViewerProps {
  content: string;

  isProcessing?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = memo(
  ({ content, isProcessing = false }) => {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none w-full">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');

              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              );
            },

            img: ({ node, ...props }) => (
              <img
                className="max-w-full h-auto rounded-md"
                {...props}
                alt={props.alt || ''}
              />
            ),

            a: ({ node, ...props }) => (
              <a
                className="text-sky-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {props.children}
              </a>
            ),

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

        {}
        {isProcessing && content.length === 0 && (
          <div className="mt-2">
            <LoadingDots />
          </div>
        )}
      </div>
    );
  },
);

MarkdownViewer.displayName = 'MarkdownViewer';

export default MarkdownViewer;
