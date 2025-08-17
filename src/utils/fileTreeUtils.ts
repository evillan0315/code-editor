// src/utils/fileTreeUtils.ts
import { type FileItem } from "@/types/file-system";

/**
 * Gets the parent path of a given path.
 * @param path The full path.
 * @returns The parent path, or "/" if it's the root.
 */
export const getParentPath = (path: string): string => {
  if (path === "/" || path === "") return "/";
  const parts = path.split("/").filter(Boolean);
  parts.pop(); // Remove the last part (file/folder name)
  return "/" + parts.join("/"); // Rejoin with leading slash
};

/**
 * Creates a new FileItem object.
 * @param name Name of the file/folder.
 * @param fullPath Full path of the file/folder.
 * @param type Type of the item ('file' or 'dir').
 * @returns A new FileItem.
 */
export const createNewFileItem = (
  name: string,
  fullPath: string,
  type: "file" | "dir",
): FileItem => ({
  name,
  path: fullPath,
  type,
  // For directories, initialize children as an empty array and isOpen to false.
  ...(type === "dir" && { children: [], isOpen: false }),
});

/**
 * Recursively updates the file tree by adding a new item to its specified parent.
 * It ensures immutability by returning new array/object references for modified parts of the tree.
 * It also marks the parent folder (and any ancestors in the path) as `isOpen: true`
 * if they were previously closed, to make the new item immediately visible.
 *
 * @param currentNodes The current array of FileItem nodes at the current level of recursion.
 * @param parentPath The full path of the parent directory where the new item should be added.
 * @param newItem The new FileItem (file or directory) to be added.
 * @param explorerRootPath The path that `editorFileTreeNodes` represents (usually `editorCurrentDirectory.get()`).
 *                         Used to determine if `newItem` is a direct child of the explorer's root.
 * @returns A new array of FileItem nodes with the `newItem` appended in the correct location.
 */
export const updateTreeWithNewItem = (
  currentNodes: FileItem[],
  parentPath: string,
  newItem: FileItem,
  explorerRootPath: string,
): FileItem[] => {
  // Scenario 1: Adding to the current directory shown in the explorer.
  // This means the `parentPath` is the `explorerRootPath`.
  if (
    parentPath === explorerRootPath ||
    (parentPath === "/" && explorerRootPath === "/")
  ) {
    const newNodes = [...currentNodes, newItem];
    // Sort for consistent display: directories first, then alphabetical by name
    newNodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "dir" ? -1 : 1;
    });
    return newNodes;
  }

  // Scenario 2: Adding to a subfolder within the current explorer view.
  // We need to recursively find the parent and add the item.
  return currentNodes.map((node) => {
    // Check if this node is the direct parent we're looking for
    if (node.type === "dir" && node.path === parentPath) {
      const newChildren = node.children
        ? [...node.children, newItem]
        : [newItem];
      newChildren.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "dir" ? -1 : 1;
      });
      return {
        ...node,
        children: newChildren,
        isOpen: true, // Ensure the direct parent is open to reveal the new item
      };
    }
    // Check if this node is an ancestor of the parentPath (i.e., parentPath starts with this node's path)
    else if (node.type === "dir" && parentPath.startsWith(node.path + "/")) {
      // Recurse into this ancestor's children.
      // If `node.children` is undefined (meaning it was never expanded or fetched),
      // we initialize it as an empty array for the recursion.
      const updatedChildren = updateTreeWithNewItem(
        node.children || [],
        parentPath,
        newItem,
        explorerRootPath, // Pass explorerRootPath down
      );
      return {
        ...node,
        children: updatedChildren,
        // If children were just initialized (i.e., node.children was undefined),
        // then this ancestor should also be opened to reveal the path.
        // Otherwise, maintain its current `isOpen` state.
        isOpen: node.children ? node.isOpen : true,
      };
    }
    return node; // Return node as is if no match
  });
};

/**
 * Recursively removes a FileItem from the tree.
 * @param nodes The current array of FileItem nodes.
 * @param itemPath The full path of the item to remove.
 * @returns An object containing the updated nodes and the removed item (or null if not found).
 */
export const removeItemFromTree = (
  nodes: FileItem[],
  itemPath: string,
): { updatedNodes: FileItem[]; removedItem: FileItem | null } => {
  let removedItem: FileItem | null = null;
  const updatedNodes = nodes.filter((node) => {
    if (node.path === itemPath) {
      removedItem = node;
      return false; // Remove this node
    }
    // If it's a directory and the itemPath is a child/descendant of this directory
    if (node.type === "dir" && itemPath.startsWith(node.path + "/")) {
      // Recurse into children
      const result = removeItemFromTree(node.children || [], itemPath);
      if (result.removedItem) {
        removedItem = result.removedItem;
        // Return a new node object with updated children
        return { ...node, children: result.updatedNodes };
      }
    }
    return true; // Keep this node
  });
  return { updatedNodes, removedItem };
};

/**
 * Recursively updates the paths and names of a FileItem and its children after a rename.
 * This is crucial for directories being renamed, as all their children's paths also change.
 * @param item The FileItem to update.
 * @param oldBasePath The old full path of the item being renamed (e.g., '/projects/old_dir').
 * @param newBasePath The new full path of the item being renamed (e.g., '/projects/new_dir').
 * @returns A new FileItem object with updated paths for itself and its children.
 */
export const updatePathsRecursively = (
  item: FileItem,
  oldBasePath: string, // e.g., "/parent/old_name"
  newBasePath: string, // e.g., "/parent/new_name"
): FileItem => {
  const updatedItem: FileItem = { ...item };

  // Update the path of the current item itself
  updatedItem.path = item.path.replace(oldBasePath, newBasePath);

  // Update the name of the current item based on its *new* path
  const pathParts = updatedItem.path.split("/").filter(Boolean);
  updatedItem.name =
    pathParts[pathParts.length - 1] || (updatedItem.path === "/" ? "/" : ""); // Handle root path case

  // If it's a directory, recursively update children's paths
  if (updatedItem.type === "dir" && updatedItem.children) {
    updatedItem.children = updatedItem.children.map((child) =>
      updatePathsRecursively(child, oldBasePath, newBasePath),
    );
  }

  return updatedItem;
};
