// Please rename this file from src/components/PathDropdown.tsx to src/components/Breadcrumbs.tsx
// This file now contains the Breadcrumbs component logic

import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { getDirectoryPaths } from '@/utils/pathUtils';
import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';

// IMPORTANT: The DropdownMenu, SearchToggleInput, and useEditorExplorerActions
// have been removed as their functionality is not part of a standard Breadcrumbs component.
// If you need search or other actions, they should be implemented alongside the Breadcrumbs,
// not within it.

// Interface for Breadcrumbs component props
interface BreadcrumbsProps {
  filePath?: string; // Optional: If provided, use this path; otherwise, use editorCurrentDirectory store
  onPathSelect: (path: string) => void;
  className?: string; // Additional class names for the container
}

/**
 * A Breadcrumbs component that displays a navigation path with clickable segments.
 *
 * It defaults to displaying the path from `editorCurrentDirectory` store
 * but can be overridden by a `filePath` prop. Each segment (except the last)
 * is clickable and triggers the `onPathSelect` callback.
 */
export function Breadcrumbs({ filePath, onPathSelect, className }: BreadcrumbsProps) {
  // Determine the current path to display. If filePath is provided, use it; otherwise, use the global store.
  const currentPath = filePath || useStore(editorCurrentDirectory);

  // Memoize the array of path segments. Each segment has a name and its full path.
  // Example: '/a/b/c' -> [{ name: '/', fullPath: '/' }, { name: 'a', fullPath: '/a' }, ...]
  const pathSegments = useMemo(() => getDirectoryPaths(currentPath), [currentPath]);

  // Callback for handling clicks on individual breadcrumb segments.
  const handleSegmentClick = useCallback(
    (path: string, isLastSegment: boolean) => {
      // Typically, the last segment in a breadcrumb is not clickable as it represents the current location.
      if (!isLastSegment) {
        onPathSelect(path);
      }
    },
    [onPathSelect],
  );

  // Render a placeholder if no path is available or segments are empty.
  if (!currentPath || pathSegments.length === 0) {
    return (
      <div className={`flex items-center text-gray-500 text-sm py-2 px-1 ${className}`}>
        No path selected
      </div>
    );
  }

  return (
    <nav aria-label='Breadcrumb' className={`flex items-center space-x-1 whitespace-nowrap overflow-hidden ${className}`}>
      {pathSegments.map((segment, index) => {
        const isLastSegment = index === pathSegments.length - 1;
        
        // Adjust display name for root segments to be more intuitive (e.g., '/' or 'C:\')
        let segmentDisplayName = segment.name;
        if (segment.fullPath === '/') {
          segmentDisplayName = '/'; // Unix-like root
        } else if (/^[a-zA-Z]:\\?$/.test(segment.fullPath) && segment.name === '') {
          // Windows drive root (e.g., 'C:\') where pathUtils might return empty name for root
          segmentDisplayName = segment.fullPath.replace(/\\$/, ''); // Show 'C:'
        } else if (segment.name === '' && index === 0 && currentPath.length > 0) {
          // Fallback for an empty first segment name, trying to derive from currentPath
          segmentDisplayName = currentPath.substring(0, currentPath.indexOf('/') > 0 ? currentPath.indexOf('/') : currentPath.indexOf('\\') > 0 ? currentPath.indexOf('\\') : currentPath.length);
          if (segmentDisplayName === '') segmentDisplayName = '/'; // Default to / if nothing else works
        }

        return (
          <React.Fragment key={segment.fullPath + index}>
            <Button
              onClick={() => handleSegmentClick(segment.fullPath, isLastSegment)}
              variant='ghost' // Make the button appear as a text link
              size='sm' // Small button size for compact display
              className={`
                px-1 py-0.5 text-sm rounded-md
                ${isLastSegment ? 'text-white cursor-default font-semibold' : 'text-gray-400 hover:text-sky-400 cursor-pointer'}
                flex-shrink-0 // Prevent segments from shrinking too much unnecessarily
                focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-800
              `}
              aria-current={isLastSegment ? 'page' : undefined} // ARIA for current page in breadcrumbs
              disabled={isLastSegment} // Visually and functionally disable last segment click
              title={segment.fullPath} // Show full path on hover for accessibility/debugging
            >
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                 {segmentDisplayName}
              </span>
            </Button>
            {!isLastSegment && (
              // Add a separator icon between segments, but not after the last one
              <Icon icon='mdi:chevron-right' className='text-gray-500 flex-shrink-0' width='1.2em' height='1.2em' />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

