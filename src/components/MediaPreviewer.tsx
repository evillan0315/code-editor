import React, { useMemo } from 'react';
import { getFileExtension, getFileName } from '@/utils/pathUtils';
import MarkdownViewer from '@/components/MarkdownViewerType'; // This is the component name in the existing file
import { isValidHttpUrl } from '@/utils/urlUtils';
import DOMPurify from 'dompurify'; // For HTML sanitization
import '@/styles/chat.css';

interface MediaPreviewerProps {
  filePath: string;
  fileContent: string;
}

const ImagePreview: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="flex items-center justify-center w-full h-full p-4">
    <img src={src} alt={alt} className="max-w-full max-h-full object-contain bg-neutral-800" />
  </div>
);

const VideoPreview: React.FC<{ src: string }> = ({ src }) => (
  <div className="flex items-center justify-center w-full h-full p-4">
    <video src={src} controls className="max-w-full max-h-full bg-neutral-800" />
  </div>
);

const AudioPreview: React.FC<{ src: string }> = ({ src }) => (
  <div className="flex items-center justify-center w-full h-full p-4">
    <audio src={src} controls className="w-full" />
  </div>
);

const UrlIframePreview: React.FC<{ src: string }> = ({ src }) => (
  <iframe
    src={src}
    title="External Content"
    className="w-full h-full border-0"
    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
  />
);

const HtmlPreview: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(htmlContent), [htmlContent]);
  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      className="w-full h-full overflow-auto p-4"
    />
  );
};

const MediaPreviewer: React.FC<MediaPreviewerProps> = ({ filePath, fileContent }) => {
  const extension = getFileExtension(filePath)?.toLowerCase();
  const fileName = getFileName(filePath);

  const fileSourceUrl = useMemo(() => {
    // For local binary files, construct a URL that a backend would serve.
    // This is a placeholder; a real implementation would need a file serving endpoint.
    return `/api/files/download?path=${encodeURIComponent(filePath)}`;
  }, [filePath]);

  // Check if the file content itself is a valid URL, regardless of extension
  const isContentUrl = isValidHttpUrl(fileContent.trim());

  let previewElement: JSX.Element | null = null;

  if (extension === 'md' || extension === 'markdown') {
    previewElement = <MarkdownViewer markdown={fileContent} />;
  } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension || '')) {
    previewElement = <ImagePreview src={fileSourceUrl} alt={fileName} />;
  } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) {
    previewElement = <VideoPreview src={fileSourceUrl} />;
  } else if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
    previewElement = <AudioPreview src={fileSourceUrl} />;
  } else if (extension === 'html' || extension === 'htm') {
    if (isContentUrl) {
      previewElement = <UrlIframePreview src={fileContent.trim()} />;
    } else {
      previewElement = <HtmlPreview htmlContent={fileContent} />;
    }
  } else if (isContentUrl) {
    // If content is a URL, and no specific file type matches
    previewElement = <UrlIframePreview src={fileContent.trim()} />;
  } else {
    previewElement = (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 w-full h-full">
        <p className="text-xl font-medium">No preview available</p>
        <p>
          File type <span className="font-semibold text-gray-400">.{extension || 'unknown'}</span>{' '}
          is not supported for preview, or content is not a valid URL.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-start markdown-wrapper px-4">
      {previewElement}
    </div>
  );
};

export default MediaPreviewer;
