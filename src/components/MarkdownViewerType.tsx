import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import parse, { HTMLReactParserOptions } from 'html-react-parser';
import { Copy, Check, PlaySquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { useToast } from '@/hooks/useToast';
import MarkdownCodeMirror from '@/components/markdown/MarkdownCodeMirror';
import { LANGUAGE_DISPLAY_MAP } from '@/constants';

import '@/styles/markdown.css';

interface MarkdownViewerProps {
  markdown: string;
}

interface NodeWithChildren {
  type: string;
  name?: string;
  data?: string;
  children?: NodeWithChildren[];
  attribs?: { [key: string]: string };
}

const extractTextFromDomNode = (node: NodeWithChildren): string => {
  if (node.type === 'text') return node.data || '';
  if (node.children) return node.children.map(extractTextFromDomNode).join('');
  return '';
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Code copied success!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy code!', 'error');
    }
  };

  return (
    <Button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 hover:text-blue-600 rounded-md transition-colors duration-150"
      title="Copy code"
    >
      <span>{copied ? <Check size={16} /> : <Copy size={16} />}</span>
      <span>Copy to clipboard</span>
    </Button>
  );
};

const PreviewButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 hover:text-blue-600 rounded-md transition-colors duration-150"
      title="Preview React Component"
    >
      <PlaySquare size={14} />
      <span className="sr-only">Preview React Component</span> {}
    </Button>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
  const { showToast } = useToast();
  const sanitizedHtml = useMemo(() => {
    const rawHtml = marked.parse(markdown);
    return DOMPurify.sanitize(rawHtml);
  }, [markdown]);

  const parseOptions: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (
        domNode.type === 'tag' &&
        domNode.name === 'pre' &&
        domNode.children &&
        domNode.children.length === 1 &&
        domNode.children[0].type === 'tag' &&
        domNode.children[0].name === 'code'
      ) {
        const codeNode = domNode.children[0] as NodeWithChildren;
        const classAttr = codeNode.attribs?.class || '';
        const languageMatch = classAttr.match(/language-(\w+)/);
        const language = languageMatch ? languageMatch[1] : 'plaintext';

        const isReactCode = language === 'jsx' || language === 'tsx';

        const displayLanguage = isReactCode
          ? language === 'jsx'
            ? 'React JSX'
            : 'React TSX'
          : LANGUAGE_DISPLAY_MAP[language] || language.toUpperCase();

        const codeContent = extractTextFromDomNode(codeNode);

        const handlePreviewClick = () => {
          showToast(
            `Preview triggered for ${displayLanguage} code! (Dynamic execution needs further setup)`,
            'info',
          );

          console.log('React code to preview:', codeContent);
        };
        return (
          <div className="relative group markdown-code-wrapper">
            <div className="absolute -top-8 inset-x-0 flex items-center justify-between px-4 py-1 bg-dark rounded-t-md border-t border-l border-r text-sm font-light z-10">
              <div className="flex">
                {displayLanguage} {}
              </div>
              {}
              <div className="flex items-center gap-1.5">
                {isReactCode && <PreviewButton onClick={handlePreviewClick} />}
                <CopyButton text={codeContent} />
              </div>
            </div>
            <MarkdownCodeMirror
              value={codeContent}
              language={language}
              readOnly={true}
            />
          </div>
        );
      }
      return undefined;
    },
  };

  return <>{parse(sanitizedHtml, parseOptions)}</>;
};

export default MarkdownViewer;
