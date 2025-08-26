import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { previewContent, setPreviewContent } from '@/stores/layout';
import MarkdownViewer from '@/components/MarkdownViewer'; // Assuming this component exists

/**
 * Renders various types of content (URL, Markdown, SVG) within a preview panel.
 * The content is controlled via the `previewContent` nanostore.
 */
export function PreviewPanel() {
  const $previewContent = useStore(previewContent);

  useEffect(() => {
    // Clear preview content when component unmounts or tab changes away
    return () => {
      setPreviewContent({ type: null, content: null });
    };
  }, []); // Only runs on mount and unmount

  if (!$previewContent.type || !$previewContent.content) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500 p-4">
        Select 'Run' or provide content to preview.
      </div>
    );
  }

  const { type, content } = $previewContent;

  switch (type) {
    case 'url':
      return (
        <iframe
          src={content}
          title="Live Preview"
          className="w-full h-full border-0 bg-dark"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        ></iframe>
      );
    case 'markdown':
      return (
        <div className="overflow-auto p-4 flex-grow w-full h-full">
          <MarkdownViewer content={content} />
        </div>
      );
    case 'svg':
      // Dangerously set inner HTML for SVG content
      return (
        <div
          className="flex items-center justify-center p-4 bg-dark-secondary h-full w-full overflow-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    default:
      return (
        <div className="flex h-full w-full items-center justify-center text-gray-500 p-4">
          Unsupported preview type.
        </div>
      );
  }
}
