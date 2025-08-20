// src/utils/fileTree.ts
import { Project, ts } from 'ts-morph';
import * as path from 'path';
import type { FileItem } from '../types/file-system';

export function findFileByPath(path: string, items: FileItem[]): FileItem | undefined {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.type === 'folder' && item.children) {
      const result = findFileByPath(path, item.children);
      if (result) return result;
    }
  }
  return undefined;
}

export function updateFileContent(path: string, newContent: string, items: FileItem[]): FileItem[] {
  return items.map((item) => {
    if (item.path === path && item.type === 'file') {
      console.log(item, 'updateFileContent');
      return { ...item, content: newContent };
    }
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: updateFileContent(path, newContent, item.children),
      };
    }
    return item;
  });
}

export function updateFolderStateRecursive(
  path: string,
  items: FileItem[],
  newState: { isOpen?: boolean; isLoadingChildren?: boolean; children?: FileItem[] },
): FileItem[] {
  return items.map((item) => {
    if (item.path === path && item.type === 'folder') {
      return { ...item, ...newState };
    }
    if (item.type === 'folder' && item.children) {
      return {
        ...item,
        children: updateFolderStateRecursive(path, item.children, newState),
      };
    }
    return item;
  });
}

export function ensureFolderDefaults(items: FileItem[]): FileItem[] {
  return items.map((item) => ({
    ...item,

    ...(item.type === 'folder' && {
      children: item.children || [],
      isOpen: item.isOpen || false,
      isLoadingChildren: item.isLoadingChildren || false,
    }),
  }));
}
export function toggleFolderState(path: string, items: FileItem[]): FileItem[] {
  return items.map((item) => {
    if (item.path === path && item.type === 'folder') {
      return { ...item, isOpen: !item.isOpen };
    }
    if (item.type === 'folder' && item.children) {
      return { ...item, children: toggleFolderState(path, item.children) };
    }
    return item;
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const getParentPath = (path: string): string => {
  if (path === '/' || path === '') return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
};

export const createNewFileItem = (
  name: string,
  fullPath: string,

  type: 'file' | 'folder',
): FileItem => ({
  name,
  path: fullPath,
  type,

  ...(type === 'folder' && { children: [], isOpen: false }),
});

export const updateTreeWithNewItem = (
  currentNodes: FileItem[],
  parentPath: string,
  newItem: FileItem,
  explorerRootPath: string,
): FileItem[] => {
  if (parentPath === explorerRootPath || (parentPath === '/' && explorerRootPath === '/')) {
    const newNodes = [...currentNodes, newItem];

    newNodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);

      return a.type === 'folder' ? -1 : 1;
    });
    return newNodes;
  }

  return currentNodes.map((node) => {
    if (node.type === 'folder' && node.path === parentPath) {
      const newChildren = node.children ? [...node.children, newItem] : [newItem];
      newChildren.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);

        return a.type === 'folder' ? -1 : 1;
      });
      return {
        ...node,
        children: newChildren,
        isOpen: true,
      };
    } else if (node.type === 'folder' && parentPath.startsWith(node.path + '/')) {
      const updatedChildren = updateTreeWithNewItem(
        node.children || [],
        parentPath,
        newItem,
        explorerRootPath,
      );
      return {
        ...node,
        children: updatedChildren,

        isOpen: node.children ? node.isOpen : true,
      };
    }
    return node;
  });
};

export const removeItemFromTree = (
  nodes: FileItem[],
  itemPath: string,
): { updatedNodes: FileItem[]; removedItem: FileItem | null } => {
  let removedItem: FileItem | null = null;
  const updatedNodes = nodes.filter((node) => {
    if (node.path === itemPath) {
      removedItem = node;
      return false;
    }

    if (node.type === 'folder' && itemPath.startsWith(node.path + '/')) {
      const result = removeItemFromTree(node.children || [], itemPath);
      if (result.removedItem) {
        removedItem = result.removedItem;

        return { ...node, children: result.updatedNodes };
      }
    }
    return true;
  });
  return { updatedNodes, removedItem };
};

export const updatePathsRecursively = (
  item: FileItem,
  oldBasePath: string,
  newBasePath: string,
): FileItem => {
  const updatedItem: FileItem = { ...item };

  updatedItem.path = item.path.replace(oldBasePath, newBasePath);

  const pathParts = updatedItem.path.split('/').filter(Boolean);
  updatedItem.name = pathParts[pathParts.length - 1] || (updatedItem.path === '/' ? '/' : '');

  if (updatedItem.type === 'folder' && updatedItem.children) {
    updatedItem.children = updatedItem.children.map((child) =>
      updatePathsRecursively(child, oldBasePath, newBasePath),
    );
  }

  return updatedItem;
};



/**
 * A script to detect local imports and get their resolved file paths
 * using the ts-morph library.
 */

export async function findLocalImports(filePath: string): Promise<void> {
    try {
        // Create a new ts-morph project instance.
        const project = new Project({
            // Pass the path to your tsconfig.json to ensure correct module resolution
            // and path alias handling.
            // If you don't have a tsconfig.json, you can omit this option.
            tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
            // Optionally, specify compiler options directly.
            compilerOptions: {
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
            },
        });

        // Add the target source file to the project.
        const sourceFile = project.addSourceFileAtPath(filePath);

        // Get all import declarations from the file.
        const importDeclarations = sourceFile.getImportDeclarations();
        console.log(`Analyzing file: ${sourceFile.getFilePath()}`);
        console.log('---');

        for (const importDeclaration of importDeclarations) {
            // Get the module specifier (the string after 'from').
            const moduleSpecifier = importDeclaration.getModuleSpecifierValue();

            // Check if the import path is a relative one.
            const isLocal = moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('..');

            if (isLocal) {
                // If it's a local import, get the source file it resolves to.
                const resolvedSourceFile = importDeclaration.getModuleSpecifierSourceFile();

                if (resolvedSourceFile) {
                    // Get the absolute file path of the resolved source file.
                    const resolvedPath = resolvedSourceFile.getFilePath();
                    console.log(`Local Import found: "${moduleSpecifier}"`);
                    console.log(`Resolved path: ${resolvedPath}`);
                    console.log('---');
                } else {
                    console.warn(`Warning: Could not resolve local import "${moduleSpecifier}"`);
                }
            }
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
        console.error('Please ensure the file path and tsconfig.json are correct.');
    }
}



