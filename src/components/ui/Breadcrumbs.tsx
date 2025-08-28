// src/components/ui/Breadcrumbs.tsx

import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { getDirectoryPaths } from '@/utils/pathUtils'; // Assumes getDirectoryPaths is robust for various path formats
import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';

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
 *
 * This version limits the visible segments to a maximum of 5,
 * showing an ellipsis for longer paths.
 */
export function Breadcrumbs({
  filePath,
  onPathSelect,
  className,
}: BreadcrumbsProps) {
  // Determine the current path to display. If filePath is provided, use it; otherwise, use the global store.
  const currentPath = useStore(editorCurrentDirectory) || filePath;

  // Memoize the array of path segments. Each segment has a name and its full path.
  // Example: '/a/b/c' -> [{ name: '/', fullPath: '/' }, { name: 'a', fullPath: '/a' }, ...]
  const allPathSegments = useMemo(
    () => getDirectoryPaths(currentPath),
    [currentPath],
  );

  // Memoize the array of path segments to display, applying the 5-path limit
  const displayedPathSegments = useMemo(() => {
    const maxSegments = 5; // The maximum number of segments to display
    const ellipsisThreshold = 0; // Number of segments from the start to show before ellipsis
    const endSegmentsToShow = 4; // Number of segments from the end to show after ellipsis (excluding the last one)

    if (allPathSegments.length <= maxSegments) {
      return allPathSegments; // If 5 or fewer, show all
    }

    // If more than 5, show first N, then ellipsis, then last M
    const firstSegments = allPathSegments.slice(0, ellipsisThreshold);
    const lastSegments = allPathSegments.slice(
      allPathSegments.length - endSegmentsToShow,
    );

    // Ensure the last segment is always included, even if it overlaps with `lastSegments` logic
    const lastSegment = allPathSegments[allPathSegments.length - 1];

    // Build the unique list for display
    const uniqueDisplayedSegments = new Map();
    firstSegments.forEach((segment) =>
      uniqueDisplayedSegments.set(segment.fullPath, segment),
    );
    lastSegments.forEach((segment) =>
      uniqueDisplayedSegments.set(segment.fullPath, segment),
    );
    uniqueDisplayedSegments.set(lastSegment.fullPath, lastSegment); // Ensure last segment is always there

    const result = Array.from(uniqueDisplayedSegments.values());

    // Sort to maintain order
    result.sort((a, b) => {
      const indexA = allPathSegments.findIndex(
        (s) => s.fullPath === a.fullPath,
      );
      const indexB = allPathSegments.findIndex(
        (s) => s.fullPath === b.fullPath,
      );
      return indexA - indexB;
    });

    // Insert ellipsis segment
    const ellipsisSegment = {
      name: '...',
      fullPath: 'ellipsis',
      isEllipsis: true,
    };
    if (result.length < allPathSegments.length) {
      // Find where to insert ellipsis, typically after the first set and before the last set
      // A simple approach is to insert it after the Nth element, if it's not the actual next element
      // For example, if we have A, B, C, X, Y, Z and want A, B, ... , Y, Z
      // Insert "..." if there's a gap between the first and last displayed segment
      const firstDisplayedFullPath = result[result.length - 2]?.fullPath; // Second to last displayed
      const lastDisplayedFullPath = result[result.length - 1]?.fullPath; // Last displayed

      const lastIndexOfFirstSet = allPathSegments.indexOf(
        firstSegments[firstSegments.length - 1],
      );
      const firstIndexOfLastSet = allPathSegments.indexOf(lastSegments[0]);

      if (firstIndexOfLastSet > lastIndexOfFirstSet + 1) {
        // Find the actual index where the ellipsis should be inserted in the `result` array
        const insertionIndex = result.findIndex(
          (s) => s.fullPath === lastSegments[0]?.fullPath,
        );
        if (insertionIndex !== -1) {
          result.splice(insertionIndex, 0, ellipsisSegment);
        }
      }
    }

    return result;
  }, [allPathSegments]);

  // Callback for handling clicks on individual breadcrumb segments.
  const handleSegmentClick = useCallback(
    (path: string, isLastSegment: boolean, isEllipsis: boolean = false) => {
      // Typically, the last segment in a breadcrumb is not clickable as it represents the current location.
      // Ellipsis segments are also not clickable.
      if (!isLastSegment && !isEllipsis) {
        onPathSelect(path);
      }
    },
    [onPathSelect],
  );

  // Render a placeholder if no path is available or segments are empty.
  if (!currentPath || allPathSegments.length === 0) {
    return (
      <div
        className={`flex items-center text-gray-500 text-sm py-2 px-1 ${className}`}
      >
        No path selected
      </div>
    );
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 whitespace-nowrap overflow-hidden ${className}`}
    >
      {displayedPathSegments.map((segment, index) => {
        // If this is an ellipsis segment, render it differently
        if ((segment as any).isEllipsis) {
          return (
            <React.Fragment key="ellipsis">
              <span className="text-base px-1 py-0.5 text-sm">...</span>
              <Icon
                icon="mdi:chevron-right"
                className="text-neutral-500 flex-shrink-0"
                width="1.2em"
                height="1.2em"
              />
            </React.Fragment>
          );
        }

        const isLastSegment = index === displayedPathSegments.length - 1;

        // Adjust display name for root segments to be more intuitive (e.g., '/' or 'C:\')
        let segmentDisplayName = segment.name;
        if (segment.fullPath === '/') {
          segmentDisplayName = '/'; // Unix-like root
        } else if (
          /^[a-zA-Z]:\\?$/.test(segment.fullPath) &&
          segment.name === ''
        ) {
          // Windows drive root (e.g., 'C:\') where pathUtils might return empty name for root
          segmentDisplayName = segment.fullPath.replace(/\\$/, ''); // Show 'C:'
        } else if (
          segment.name === '' &&
          index === 0 &&
          currentPath.length > 0
        ) {
          // Fallback for an empty first segment name, trying to derive from currentPath
          // This part of the logic might need refinement depending on actual pathUtils output
          segmentDisplayName = currentPath.substring(
            0,
            currentPath.indexOf('/') > 0
              ? currentPath.indexOf('/')
              : currentPath.indexOf('\\') > 0
                ? currentPath.indexOf('\\')
                : currentPath.length,
          );
          if (segmentDisplayName === '') segmentDisplayName = '/'; // Default to / if nothing else works
        }

        return (
          <React.Fragment key={segment.fullPath + index}>
            <Button
              onClick={() =>
                handleSegmentClick(
                  segment.fullPath,
                  isLastSegment,
                  (segment as any).isEllipsis,
                )
              }
              variant="ghost" // Make the button appear as a text link
              size="sm" // Small button size for compact display
              className={`
                px-1 py-0.5 text-sm rounded-md
                ${isLastSegment ? 'text-muted font-semibold' : 'text-base-accent hover:text-sky-400 cursor-pointer'}
                flex-shrink-0 
                focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-800
              `}
              aria-current={isLastSegment ? 'page' : undefined} // ARIA for current page in breadcrumbs
              disabled={isLastSegment || (segment as any).isEllipsis} // Visually and functionally disable last segment and ellipsis click
              title={segment.fullPath} // Show full path on hover for accessibility/debugging
            >
              <span className="truncate max-w-[150px] md:max-w-[200px]">
                {segmentDisplayName}
              </span>
            </Button>
            {!isLastSegment && (
              // Add a separator icon between segments, but not after the last one
              <Icon
                icon="mdi:chevron-right"
                className="text-gray-500 flex-shrink-0"
                width="1.2em"
                height="1.2em"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
