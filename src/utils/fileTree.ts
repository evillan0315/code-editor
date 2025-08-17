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
    ...(item.type === 'dir' && {
      children: item.children || [],
      isOpen: item.isOpen || false,
      isLoadingChildren: item.isLoadingChildren || false,
    }),
  }));
}
export function toggleFolderState(path: string, items: FileItem[]): FileItem[] {
  return items.map((item) => {
    if (item.path === path && item.type === "folder") {
      return { ...item, isOpen: !item.isOpen };
    }
    if (item.type === "folder" && item.children) {
      return { ...item, children: toggleFolderState(path, item.children) };
    }
    return item;
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64); // Decode Base64 string
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
