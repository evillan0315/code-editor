import { atom, onMount } from 'nanostores';

// --- Types ---
export type TerminalMode = 'none' | 'ai' | 'local';
export type FileExplorerViewMode = 'list' | 'thumbnail';
export type RightSidebarTab = 'codeAssist' | 'preview' | 'none';
export type PreviewContentType = 'url' | 'markdown' | 'svg' | null;

// --- Atoms ---
export const showLeftSidebar = atom<boolean>(true);
export const showRightSidebar = atom<boolean>(true);
export const showBottomLeft = atom<boolean>(false);
export const showBottomRight = atom<boolean>(false);
export const activeTerminal = atom<TerminalMode>('local');
export const showTerminal = atom<boolean>(true);
export const fileExplorerViewMode = atom<FileExplorerViewMode>('list');
export const rightSidebarActiveTab = atom<RightSidebarTab>('codeAssist');
export const previewContent = atom<{ type: PreviewContentType; content: string | null }>({
  type: null,
  content: null,
});

// --- Keys ---
const STORAGE_KEYS = {
  left: 'showLeftSidebar',
  right: 'showRightSidebar',
  bottomLeft: 'showBottomLeft',
  bottomRight: 'showBottomRight',
  showTerminal: 'showTerminal',
  terminal: 'activeTerminal',
  fileExplorerView: 'fileExplorerViewMode',
  rightSidebarTab: 'rightSidebarActiveTab',
};

// --- Helpers ---
const readBool = (key: string, fallback = false): boolean => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : fallback;
  } catch {
    return fallback;
  }
};

const writeBool = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore write errors (e.g. in private mode)
  }
};

const readTerminalMode = (): TerminalMode => {
  const saved = localStorage.getItem(STORAGE_KEYS.terminal);
  return saved === 'ai' || saved === 'local' ? saved : 'none';
};

const readFileExplorerViewMode = (): FileExplorerViewMode => {
  const saved = localStorage.getItem(STORAGE_KEYS.fileExplorerView);
  return saved === 'list' || saved === 'thumbnail' ? saved : 'list';
};

const readRightSidebarTab = (): RightSidebarTab => {
  const saved = localStorage.getItem(STORAGE_KEYS.rightSidebarTab);
  return saved === 'codeAssist' || saved === 'preview' ? saved : 'codeAssist';
};

// --- Initialization from localStorage ---
onMount(showLeftSidebar, () => {
  showLeftSidebar.set(readBool(STORAGE_KEYS.left));
});
onMount(showRightSidebar, () => {
  showRightSidebar.set(readBool(STORAGE_KEYS.right));
});
onMount(showBottomLeft, () => {
  showBottomLeft.set(readBool(STORAGE_KEYS.bottomLeft));
});
onMount(showBottomRight, () => {
  showBottomRight.set(readBool(STORAGE_KEYS.bottomRight));
});
onMount(showTerminal, () => {
  showTerminal.set(readBool(STORAGE_KEYS.showTerminal));
});
onMount(activeTerminal, () => {
  activeTerminal.set(readTerminalMode());
});
onMount(fileExplorerViewMode, () => {
  fileExplorerViewMode.set(readFileExplorerViewMode());
});
onMount(rightSidebarActiveTab, () => {
  rightSidebarActiveTab.set(readRightSidebarTab());
});

// --- Subscriptions to persist state ---
showLeftSidebar.subscribe((value) => writeBool(STORAGE_KEYS.left, value));
showRightSidebar.subscribe((value) => writeBool(STORAGE_KEYS.right, value));
showBottomLeft.subscribe((value) => writeBool(STORAGE_KEYS.bottomLeft, value));
showTerminal.subscribe((value) => writeBool(STORAGE_KEYS.showTerminal, value));
showBottomRight.subscribe((value) => writeBool(STORAGE_KEYS.bottomRight, value));
activeTerminal.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEYS.terminal, value);
  } catch {
    // Ignore
  }
});
fileExplorerViewMode.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEYS.fileExplorerView, value);
  } catch {
    // Ignore
  }
});
rightSidebarActiveTab.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEYS.rightSidebarTab, value);
  } catch {
    // Ignore
  }
});

// --- Toggle Functions ---
export const toggleLeftSidebar = () => {
  showLeftSidebar.set(!showLeftSidebar.get());
};

export const toggleRightSidebar = () => {
  showRightSidebar.set(!showRightSidebar.get());
};

export const toggleBottomLeft = () => {
  showBottomLeft.set(!showBottomLeft.get());
};

export const toggleBottomRight = () => {
  showBottomRight.set(!showBottomRight.get());
};

export const setTerminal = () => {
  const current = activeTerminal.get();
  activeTerminal.set(current === 'none' ? 'ai' : 'none');
};

export const toggleTerminal = () => {
  showTerminal.set(!showTerminal.get());
};

export const toggleFileExplorerViewMode = () => {
  fileExplorerViewMode.set(fileExplorerViewMode.get() === 'list' ? 'thumbnail' : 'list');
};
export const setPreviewContent = (type: PreviewContentType, content: string | null) => {
  previewContent.set({ type, content });
};

export const setRightSidebarActiveTab = (tab: RightSidebarTab) => {
  rightSidebarActiveTab.set(tab);
};

