// src/components/ui/LoadingDots.tsx (or directly in MarkdownViewer.tsx if it's only used there)
import React from 'react';

interface LoadingDotsProps {
  color?: string;

  size?: string;
  message?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  color = 'text-gray-500',
  size = 'text-lg',
  message = '',
}) => {
  return (
    <div className={`flex items-center space-x-1 ${color} ${size}`}>
      <span>{message}</span>
      <span className="animate-bounce" style={{ animationDelay: '0s' }}>
        •
      </span>
      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
        •
      </span>
      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
        •
      </span>
    </div>
  );
};

export default LoadingDots;
