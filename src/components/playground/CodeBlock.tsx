import React from 'react';
// This is a simplified CodeBlock. For production, you'd use a syntax highlighter like react-syntax-highlighter.
// For now, it's just a styled pre/code block.

interface CodeBlockProps {
  code: string;
  language?: string; // e.g., 'tsx', 'javascript', 'css'
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'plaintext',
}) => {
  return (
    <pre className="p-4 bg-zinc-900 rounded-md text-white overflow-x-auto text-sm font-mono">
      <code className={`language-${language}`}>{code.trim()}</code>
    </pre>
  );
};
