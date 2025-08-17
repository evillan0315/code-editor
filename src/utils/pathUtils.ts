// src/utils/pathUtils.ts

/**
 * Truncates a file path to show only the last two directory levels plus the filename.
 * Handles both Unix-like (/) and Windows-like (\) path separators.
 *
 * @param filePath The full file path string.
 * @returns The truncated file path, or an empty string if the input is invalid.
 */
export function truncateFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }

  // Determine the primary path separator used in the given path
  const separator = filePath.includes("/") ? "/" : "\\";

  // Split the path by the separator and filter out any empty strings
  const parts = filePath.split(separator).filter(Boolean);

  // If there are 3 or more parts, take the last 3.
  // Otherwise, take all available parts (for paths with fewer than 2 directories).
  const truncatedParts = parts.slice(-3);

  // Join the truncated parts back with the determined separator
  return truncatedParts.join(separator);
}

/**
 * Extracts all hierarchical segments from a given file or directory path.
 * Each segment, including the final one (which might be a filename), is returned
 * as an item with its name and full path. This function provides the building blocks
 * for path navigation.
 *
 * @param filePath The full file or directory path string (e.g., "/a/b/c/file.txt" or "C:\dir1\dir2\file.js").
 * @returns An array of objects, each with a `name` (the segment's name) and `fullPath` (the full absolute path up to that segment).
 *          Returns an empty array if the input is invalid or no segments are found.
 *
 * Examples:
 * - `getDirectoryPaths("/media/user/proj/file.txt")` =>
 *   [{ name: '/', fullPath: '/' }, { name: 'media', fullPath: '/media' }, { name: 'user', fullPath: '/media/user' }, { name: 'proj', fullPath: '/media/user/proj' }, { name: 'file.txt', fullPath: '/media/user/proj/file.txt' }]
 * - `getDirectoryPaths("/media/user/proj/")` =>
 *   [{ name: '/', fullPath: '/' }, { name: 'media', fullPath: '/media' }, { name: 'user', fullPath: '/media/user' }, { name: 'proj', fullPath: '/media/user/proj' }]
 * - `getDirectoryPaths("/media/user/proj")` =>
 *   [{ name: '/', fullPath: '/' }, { name: 'media', fullPath: '/media' }, { name: 'user', fullPath: '/media/user' }, { name: 'proj', fullPath: '/media/user/proj' }]
 * - `getDirectoryPaths("C:\dir\file.txt")` =>
 *   [{ name: 'C:', fullPath: 'C:\' }, { name: 'dir', fullPath: 'C:\dir' }, { name: 'file.txt', fullPath: 'C:\dir\file.txt' }]
 * - `getDirectoryPaths("C:\dir")` =>
 *   [{ name: 'C:', fullPath: 'C:\' }, { name: 'dir', fullPath: 'C:\dir' }]
 * - `getDirectoryPaths("file.txt")` =>
 *   [{ name: 'file.txt', fullPath: 'file.txt' }]
 * - `getDirectoryPaths("my_dir")` =>
 *   [{ name: 'my_dir', fullPath: 'my_dir' }]
 * - `getDirectoryPaths("/")` =>
 *   [{ name: '/', fullPath: '/' }]
 * - `getDirectoryPaths("C:\")` =>
 *   [{ name: 'C:', fullPath: 'C:\' }]
 * - `getDirectoryPaths(".")` =>
 *   [{ name: '.', fullPath: '.' }]
 */
export function getDirectoryPaths(
  filePath: string,
): Array<{ name: string; fullPath: string }> {
  const result: Array<{ name: string; fullPath: string }> = [];
  if (!filePath || typeof filePath !== "string") {
    return result;
  }

  const originalSeparator = filePath.includes("\\") ? "\\" : "/";
  let normalizedPath = filePath.replace(/\\/g, "/"); // Normalize to forward slashes for internal processing
  let currentAccumulatedPath = "";
  let startIndex = 0;

  // Handle Windows drive letters (e.g., C:/)
  if (/^[a-zA-Z]:\//.test(normalizedPath)) {
    const driveLetter = normalizedPath.substring(0, 2); // e.g., "C:"
    currentAccumulatedPath = driveLetter + originalSeparator; // "C:\" (re-apply original separator)
    result.push({ name: driveLetter, fullPath: currentAccumulatedPath });
    startIndex = 3; // Skip "C:/" or "C:\"
  }
  // Handle Unix root (e.g., /)
  else if (normalizedPath.startsWith("/")) {
    currentAccumulatedPath = "/";
    result.push({ name: "/", fullPath: "/" });
    startIndex = 1; // Skip leading "/"
  }

  // Split the remaining path into segments, filtering out any empty strings
  // A path like "dir1//dir2" would become ["dir1", "dir2"]
  const parts = normalizedPath.substring(startIndex).split("/").filter(Boolean);

  // Iterate over parts, adding each segment to the result
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Construct the full path for the current segment
    if (currentAccumulatedPath === "") {
      // For the very first part of a relative path (e.g., "folder/sub")
      currentAccumulatedPath = part;
    } else if (currentAccumulatedPath === "/") {
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
  if (result.length === 0 && (filePath === "." || filePath === "..")) {
    result.push({ name: filePath, fullPath: filePath });
  }

  return result;
}
