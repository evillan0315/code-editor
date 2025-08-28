// src/components/LoadingIndicator.tsx (Hypothetical component)
import React from 'react';
import { useStore } from '@nanostores/react';
import { isLoading } from '@/stores/ui';

const LoadingIndicator: React.FC = () => {
  const $isLoading = useStore(isLoading);

  if (!$isLoading) return null;

  // Assuming your editorExplorerHeader is, for example, 12 units (48px) tall.
  // Adjust 'top-12' (or 'top-[48px]') and 'z-50' as needed for your specific layout.
  return (
    <div
      className="fixed top-12 left-0 right-0 h-1 bg-blue-500 z-50 animate-pulse"
      role="status"
      aria-label="Loading content"
    >
      {/* You might put a spinner icon or a progress bar here */}
      {/* For a simple loading bar: */}
      <div className="h-full bg-blue-600 w-full"></div>
    </div>
    // Or for a centralized spinner:
    // <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
    //   <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    // </div>
  );
};

export default LoadingIndicator;
