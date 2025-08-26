export const truncateFilePath = (filePath: string, maxLength = 30): string => {
  if (filePath.length <= maxLength) {
    return filePath;
  }

  const parts = filePath.split('/');
  if (parts.length <= 2) {
    return `...${filePath.slice(-maxLength + 3)}`;
  }

  const firstPart = parts[0];
  const lastPart = parts[parts.length - 1];

  let middle = '';
  let currentLength = firstPart.length + lastPart.length + 4; // 2 for '...', 2 for '/'

  for (let i = 1; i < parts.length - 1; i++) {
    if (currentLength + parts[i].length + 1 < maxLength) {
      middle += `/${parts[i]}`;
      currentLength += parts[i].length + 1;
    } else {
      break;
    }
  }

  if (middle.length > 0) {
    return `${firstPart}/...${middle}/${lastPart}`;
  }

  // Fallback if middle parts are too long too, just show beginning and end
  return `${firstPart}/.../${lastPart}`;
};

/**
 * Joins all given path segments together, then normalizes the resulting path.
 * Similar to Node.js `path.join` but simplified for browser contexts.
 */
export function joinPaths(...segments: string[]): string {
  const parts: string[] = [];
  for (const segment of segments) {
    if (segment) {
      // Split by '/', remove empty parts, and add to overall parts list
      const segmentParts = segment.split('/').filter((p) => p !== '');
      parts.push(...segmentParts);
    }
  }

  // Filter out '..' and '.' in a simplified way (not full path.normalize)
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') {
      continue;
    } else if (part === '..') {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      stack.push(part);
    }
  }

  let result = stack.join('/');

  // If the first segment started with a slash, the result should too
  if (segments[0]?.startsWith('/')) {
    result = '/' + result;
  }
  // If all segments were empty or resolved to '', return '.' or '/'
  if (result === '') {
    return segments[0]?.startsWith('/') ? '/' : '.';
  }

  return result;
}

/**
 * Returns the last portion of a path, similar to Node.js `path.basename`.
 * Handles trailing slashes by ignoring them.
 */
export function getBasename(filePath: string): string {
  if (typeof filePath !== 'string') {
    throw new TypeError('Path must be a string. Received ' + typeof filePath);
  }
  if (filePath === '') {
    return '';
  }

  // Remove trailing slashes (unless it's just '/')
  const normalizedPath =
    filePath.endsWith('/') && filePath.length > 1
      ? filePath.slice(0, -1)
      : filePath;

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return normalizedPath; // No slashes, so the whole path is the basename
  }
  return normalizedPath.substring(lastSlashIndex + 1);
}

/**
 * Returns the directory name of a path, similar to Node.js `path.dirname`.
 */
export function getDirname(filePath: string): string {
  if (typeof filePath !== 'string') {
    throw new TypeError('Path must be a string. Received ' + typeof filePath);
  }
  if (filePath === '') {
    return '.';
  }

  // Remove trailing slashes (unless it's just '/')
  const normalizedPath =
    filePath.endsWith('/') && filePath.length > 1
      ? filePath.slice(0, -1)
      : filePath;

  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return '.'; // No slashes, so dirname is current directory
  }
  if (lastSlashIndex === 0) {
    return '/'; // Only a root slash (e.g., '/foo' -> '/')
  }
  return normalizedPath.substring(0, lastSlashIndex);
}
export function getDirectoryPaths(
  filePath: string,
): Array<{ name: string; fullPath: string }> {
  const result: Array<{ name: string; fullPath: string }> = [];
  if (!filePath || typeof filePath !== 'string') {
    return result;
  }

  const originalSeparator = filePath.includes('\\') ? '\\' : '/';
  let normalizedPath = filePath.replace(/\\/g, '/'); // Normalize to forward slashes for internal processing
  let currentAccumulatedPath = '';
  let startIndex = 0;

  // Handle Windows drive letters (e.g., C:/)
  if (/^[a-zA-Z]:\//.test(normalizedPath)) {
    const driveLetter = normalizedPath.substring(0, 2); // e.g., "C:"
    currentAccumulatedPath = driveLetter + originalSeparator; // "C:\" (re-apply original separator)
    result.push({ name: driveLetter, fullPath: currentAccumulatedPath });
    startIndex = 3; // Skip "C:/" or "C:\"
  }
  // Handle Unix root (e.g., /)
  else if (normalizedPath.startsWith('/')) {
    currentAccumulatedPath = '/';
    result.push({ name: '/', fullPath: '/' });
    startIndex = 1; // Skip leading "/"
  }

  // Split the remaining path into segments, filtering out any empty strings
  // A path like "dir1//dir2" would become ["dir1", "dir2"]
  const parts = normalizedPath.substring(startIndex).split('/').filter(Boolean);

  // Iterate over parts, adding each segment to the result
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Construct the full path for the current segment
    if (currentAccumulatedPath === '') {
      // For the very first part of a relative path (e.g., "folder/sub")
      currentAccumulatedPath = part;
    } else if (currentAccumulatedPath === '/') {
      // If at Unix root, just append part (e.g., "/media" from "/media")
      currentAccumulatedPath += part;
    } else if (currentAccumulatedPath.endsWith(originalSeparator)) {
      // If the current path already ends with a separator (e.g., "C:\")
      currentAccumulatedPath += part;
    } else {
      // For other cases, add separator then part (e.g., "/media/user")
      currentAccumulatedPath += originalSeparator + part;
    }

    result.push({
      name: part, // The name of the current segment (e.g., "code-editor")
      fullPath: currentAccumulatedPath, // The full path up to this segment (e.g., "/media/eddie/Data/projects/nestJS/nest-modules/ai-assistant/code-editor")
    });
  }

  // Handle special relative paths like "." or ".." if they are the sole path or at the start
  // If after all processing, result is empty but filePath was '.' or '..', add it
  if (result.length === 0 && (filePath === '.' || filePath === '..')) {
    result.push({ name: filePath, fullPath: filePath });
  }

  return result;
}

export function getFileExtension(filename: string): string | undefined {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase();
  }
  return undefined;
}

export function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
}


