// src/services/iconCache.ts
const iconCache = new Map<string, string>();

export const getCachedIcon = (key: string) => iconCache.get(key);

export const setCachedIcon = (key: string, svg: string) => {
  iconCache.set(key, svg);
};
